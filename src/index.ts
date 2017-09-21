import { FunctionalService, DynamoTable, Service, Api, NoCallbackWaitsForEmptyEventLoop } from 'functionly';
import { rest, aws, param, inject, use } from 'functionly';
import { stringify } from 'querystring';
import request = require('request-promise-native');
import { ErrorTransform } from './middleware/errorTransform';
import { GetNpmInfo } from './services/npm';
import { StartPackageValidation, IsExpiredResult } from './services/checker';

import { PackageInfoApi } from './api/packageInfo';
import { EvaluationsApi } from './api/evaluations';
import { PackageInfo } from './types';

@aws({ type: 'nodejs6.10', memorySize: 512, timeout: 3 })
@use(NoCallbackWaitsForEmptyEventLoop)
@use(ErrorTransform)
export class CorpCheckRestService extends FunctionalService {}

export class MissingPackageParameters extends Error {}

@rest({ path: '/validation', methods: [ 'post' ], anonymous: true, cors: true })
export class Validation extends CorpCheckRestService {
  public async handle(
    @param packageName,
    @param force,
    @param packageJSON,
    @param isProduction,
    @param ruleSet,
    @inject(PackageInfoApi) packageInfoApi: PackageInfoApi,
    @inject(EvaluationsApi) evaluationsApi: EvaluationsApi,
    @inject(IsExpiredResult) isExpiredResult,
    @inject(StartPackageValidation) startPackageValidation
  ) {
    const isProd = typeof isProduction !== 'undefined';
    let packageInfo: PackageInfo;
    if (packageJSON) {
      packageInfo = await packageInfoApi.fromPackageJSON({ packageJSON, isProduction: isProd });
    } else if (packageName) {
      packageInfo = await packageInfoApi.fromPackageName({ packageName });
    } else {
      throw new MissingPackageParameters('packageJSON or packageName');
    }

    if (await isExpiredResult({ packageInfo, update: true, force: typeof force !== 'undefined' })) {
      packageInfo = await packageInfoApi.create(packageInfo);
    }

    const packageInfoId = packageInfo._id;
    let evaluationInfo = await evaluationsApi.fromRuleSet({ packageInfoId, ruleSet });
    if (!evaluationInfo) {
      evaluationInfo = await evaluationsApi.create({ packageInfoId, ruleSet });

      if (packageInfo.state.type === 'PENDING') {
        await startPackageValidation({
          packageName: packageInfo.packageName,
          packageJSON: packageInfo.packageJSON,
          cid: evaluationInfo._id,
          isProduction: packageInfo.isProduction
        });
      }
    }

    if (packageInfo.state.type === 'SUCCEEDED') {
      await evaluationsApi.evaluate({
        evaluationInfo,
        data: packageInfo.meta
      });
    }

    return { state: packageInfo.state, cid: evaluationInfo._id };
  }
}

@rest({ path: '/package', methods: [ 'get' ], anonymous: true, cors: true })
export class Package extends CorpCheckRestService {
  public async handle(
    @param cid,
    @inject(PackageInfoApi) packageInfoApi: PackageInfoApi,
    @inject(EvaluationsApi) evaluationsApi: EvaluationsApi,
    @inject(IsExpiredResult) isExpiredResult
  ) {
    const result = {
      cid,
      name: undefined,
      state: { type: 'NOTEXISTS', date: Date.now() },
      expired: true,
      result: null,
      ruleSet: null
    };

    const evaluationInfo = await evaluationsApi.get({ cid });
    if (evaluationInfo) {
      result.result = evaluationInfo.result;
      result.ruleSet = evaluationInfo.ruleSet;

      const packageInfo = await packageInfoApi.getById({ _id: evaluationInfo.packageInfoId });
      if (packageInfo) {
        result.name = packageInfo.packageName || `${packageInfo.packageJSON.name}@${packageInfo.date.toISOString()}`;
        result.state = <any>packageInfo.state;
        result.expired = await isExpiredResult({ packageInfo, update: false, force: false });
      }
    }

    return result;
  }
}

//TODO remove
@rest({ path: '/complete', methods: [ 'post' ] })
export class Complete extends CorpCheckRestService {
  public async handle(
    @param cid,
    @param data,
    @param error,
    @inject(PackageInfoApi) packageInfoApi: PackageInfoApi,
    @inject(EvaluationsApi) evaluationsApi: EvaluationsApi
  ) {
    const evaluationInfo = await evaluationsApi.get({ cid });
    if (!evaluationInfo) return;

    if (error) {
      await packageInfoApi.updateState({
        _id: evaluationInfo.packageInfoId,
        meta: error,
        type: 'FAILED'
      });
      return;
    }

    await evaluationsApi.evaluate({
      evaluationInfo,
      data
    });
  }
}

@rest({ path: '/suggestions', methods: [ 'get' ], anonymous: true, cors: true })
export class Suggestion extends CorpCheckRestService {
  public async handle(@param name, @param version): Promise<{ title: string; description?: string }[]> {
    if (!name) return [];
    if (version === undefined) {
      const { objects } = await request
        .get(`https://registry.npmjs.org/-/v1/search?${stringify({ text: name, size: 5 })}`, {
          json: true
        })
        .catch(err => ({ objects: [] }));
      return objects.map(({ package: { name, description } }) => ({ title: name, description }));
    } else {
      const { versions } = await request.get(`https://registry.npmjs.org/${name}`, { json: true });
      const pattern = new RegExp(`^${version.replace(/\./g, '\\.')}`);
      return [ ...Object.keys(versions || {}) ]
        .reverse()
        .filter(version => pattern.test(version))
        .slice(0, 10)
        .map(version => ({ title: `${name}@${version}` }));
    }
  }
}

export const validation = Validation.createInvoker();
export const packageInfo = Package.createInvoker();
export const complete = Complete.createInvoker();
export const getSuggestions = Suggestion.createInvoker();
