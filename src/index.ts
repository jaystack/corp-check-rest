import { generate } from 'shortid';
import { FunctionalService, DynamoTable, Service, Api, NoCallbackWaitsForEmptyEventLoop } from 'functionly';
import { rest, aws, param, inject, use } from 'functionly';
import { stringify } from 'querystring';
import request = require('request-promise-native');
import { ErrorTransform } from './middleware/errorTransform';
import { GetPackageInfo } from './services/npm';
import { Evaluate } from './services/evaluate';
import { GetRuleSet } from './services/defaultRuleSet';
import {
  GetPackageResult,
  UpdatePackageResult,
  CreatePackageResult,
  StartPackageValidation,
  IsExpiredResult
} from './services/checker';

@aws({ type: 'nodejs6.10', memorySize: 512, timeout: 3 })
@use(NoCallbackWaitsForEmptyEventLoop)
@use(ErrorTransform)
export class CorpCheckRestService extends FunctionalService {}

@rest({ path: '/validation', methods: [ 'get' ], anonymous: true, cors: true })
export class Validation extends CorpCheckRestService {
  public async handle(
    @param name,
    @param version,
    @param force,
    @inject(GetPackageInfo) getPackageInfo,
    @inject(GetPackageResult) getPackageResult,
    @inject(CreatePackageResult) createPackageResult,
    @inject(StartPackageValidation) startPackageValidation,
    @inject(IsExpiredResult) isExpiredResult
  ) {
    const packageInfo = await getPackageInfo({ name, version });
    let item = await getPackageResult({ name: packageInfo.name, version: packageInfo.version, isProduction: true });

    if (item && (await isExpiredResult({ item, update: true, force: typeof force !== 'undefined' }))) {
      item = null;
    }

    if (item === null) {
      item = await createPackageResult({
        name: packageInfo.name,
        version: packageInfo.version,
        isNpmPackage: true,
        isProduction: true,
        packageJSON: packageInfo.packageJSON
      });

      await startPackageValidation({ packageJSON: item.packageJSON, cid: item._id, isProduction: true });
    }

    return { item, cid: item._id };
  }
}

@rest({ path: '/validation', methods: [ 'post' ], anonymous: true, cors: true })
export class PackageJsonValidation extends CorpCheckRestService {
  public async handle(
    @param packageJSON,
    @param isProduction,
    @inject(CreatePackageResult) createPackageResult,
    @inject(StartPackageValidation) startPackageValidation
  ) {
    const isProd = typeof isProduction !== 'undefined';
    const item = await createPackageResult({
      isNpmPackage: false,
      isProduction: isProd,
      packageJSON
    });

    await startPackageValidation({ packageJSON: item.packageJSON, cid: item._id, isProduction: isProd });

    return { item, cid: item._id };
  }
}

@rest({ path: '/package', methods: [ 'get' ], anonymous: true, cors: true })
export class Package extends CorpCheckRestService {
  public async handle(
    @param name,
    @param version,
    @param cid,
    @inject(GetPackageInfo) getPackageInfo,
    @inject(GetPackageResult) getPackageResult,
    @inject(IsExpiredResult) isExpiredResult,
    @inject(Evaluate) evaluate,
    @inject(GetRuleSet) getRuleSet
  ) {
    if (name && !version) {
      const packageInfo = await getPackageInfo({ name });
      version = packageInfo.version;
    }

    const item = await getPackageResult({ name, version, cid, isProduction: true });
    let expired = false;

    if (name && version) {
      if (item && (await isExpiredResult({ item, update: false, force: false }))) {
        expired = true;
      }
    } else {
      expired = undefined;
    }

    let result = {};
    if (item && item.validationData && item.validationState.state === 'SUCCEEDED') {
      result = await evaluate({
        data: JSON.parse(item.validationData),
        ruleSet: await getRuleSet({ ruleSet: item.ruleSet })
      });
    }

    return {
      package: packageInfo,
      item,
      name,
      version,
      cid: item && item._id,
      expired,
      result
    };
  }
}

//TODO remove
@rest({ path: '/complete', methods: [ 'post' ] })
export class Complete extends CorpCheckRestService {
  public async handle(@param cid, @param data, @param error, @inject(UpdatePackageResult) updatePackageResult) {
    if (error) {
      await updatePackageResult({
        cid,
        result: JSON.stringify(error),
        state: 'FAILED'
      });
    } else {
      await updatePackageResult({
        cid,
        data: JSON.stringify(data),
        state: 'SUCCEEDED'
      });
    }

    return { ok: 1 };
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
export const packageJsonValidation = PackageJsonValidation.createInvoker();
export const packageInfo = Package.createInvoker();
export const complete = Complete.createInvoker();
export const getSuggestions = Suggestion.createInvoker();
