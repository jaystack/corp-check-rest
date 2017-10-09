import { rest, aws, param, inject, use } from 'functionly';
import { stringify } from 'querystring';
import request = require('request-promise-native');
import { StartPackageValidation, IsExpiredResult } from '../services/checker';
import { ValidationStart } from '../services/validationStart';
import { Badge } from '../services/badge';
import { FileStorage } from '../stores/s3filestorages';

import { PackageInfoApi } from '../api/packageInfo';
import { EvaluationsApi } from '../api/evaluations';
import { PackageInfo, EvaluationInfo } from '../types';
import { popularPackageNames } from '../consts';

import { CorpCheckRestService } from './corpCheckRestService';

export class MissingPackageParameters extends Error {}

@rest({ path: '/validation', methods: [ 'post' ], anonymous: true, cors: true })
export class Validation extends CorpCheckRestService {
  public async handle(
    @param packageName,
    @param force,
    @param packageJSON,
    @param packageLock,
    @param yarnLock,
    @param isProduction,
    @param ruleSet,
    @inject(PackageInfoApi) packageInfoApi: PackageInfoApi,
    @inject(ValidationStart) validationStart,
    //TODO
    @inject(FileStorage) files: FileStorage
  ) {
    let packageInfoFromResult: { packageInfo: PackageInfo; created: boolean };
    if (packageJSON) {
      packageInfoFromResult = await packageInfoApi.fromPackageJSON({
        packageJSON,
        packageLock,
        yarnLock,
        isProduction: !!isProduction
      });
    } else if (packageName) {
      packageInfoFromResult = await packageInfoApi.fromPackageName({ packageName });
    } else {
      throw new MissingPackageParameters('packageJSON or packageName');
    }

    const evaluationInfo = await validationStart({ force: !!force, ruleSet, packageInfoFromResult });

    return { state: packageInfoFromResult.packageInfo.state, cid: evaluationInfo._id };
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
        result.name = packageInfo.packageName || 'undefined';
        result.state = <any>packageInfo.state;
        result.expired = await isExpiredResult({ packageInfo, update: false, force: false });
      }
    }

    return result;
  }
}

@rest({ path: '/popular-packages', methods: [ 'get' ], anonymous: true, cors: true })
export class PopularPackages extends CorpCheckRestService {
  public async handle(
    @inject(PackageInfoApi) packageInfoApi: PackageInfoApi,
    @inject(EvaluationsApi) evaluationsApi: EvaluationsApi
  ) {
    const evaluations = await evaluationsApi.getByNames(popularPackageNames);
    const packageInfoIds = evaluations.map(({ packageInfoId }) => packageInfoId);
    const packageInfos = await packageInfoApi.getByIds(packageInfoIds);
    return evaluations.map(
      (
        {
          _id: cid,
          result: { qualification, rootEvaluation: { nodeName: name, nodeVersion: version, nodeScore: score } }
        },
        i
      ) => ({
        cid,
        name,
        version,
        state: packageInfos[i].state,
        qualification,
        score
      })
    );
  }
}

@rest({ path: '/badge', methods: [ 'get' ], anonymous: true, cors: true })
export class BadgeService extends CorpCheckRestService {
  public async handle(
    @param scope,
    @param name,
    @param version,
    @inject(PackageInfoApi) packageInfoApi: PackageInfoApi,
    @inject(ValidationStart) validationStart,
    @inject(Badge) badge,
    //TODO
    @inject(FileStorage) files: FileStorage
  ) {
    const packageName = `${scope ? `@${scope}/` : ''}${name}@${version || 'latest'}`;
    const packageInfoFromResult = await packageInfoApi.fromPackageName({ packageName });

    const evaluationInfo: EvaluationInfo = await validationStart({ packageInfoFromResult });

    const content = await badge({ packageInfo: packageInfoFromResult.packageInfo, evaluationInfo });
    if (!content) throw new Error('missing badge');

    return {
      status: 200,
      headers: {
        'content-type': 'image/svg+xml'
      },
      data: content
    };
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
export const popularPackages = PopularPackages.createInvoker();
export const getSuggestions = Suggestion.createInvoker();
export const badge = BadgeService.createInvoker();
