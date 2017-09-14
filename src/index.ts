import { generate } from 'shortid';
import { FunctionalService, DynamoTable, Service, Api } from 'functionly';
import { rest, aws, param, inject, use } from 'functionly';
import { ErrorTransform } from './middleware/errorTransform';
import { GetPackageInfo } from './services/npm';
import { Evaluate } from './services/evaluate';
import {
  GetPackageResult,
  UpdatePackageResult,
  CreatePackageResult,
  StartPackageValidation,
  IsExpiredResult
} from './services/checker';
import request = require('request-promise-native');

@aws({ type: 'nodejs6.10', memorySize: 512, timeout: 3 })
export class CorpjsCorpcheckService extends FunctionalService {}

@use(ErrorTransform)
@rest({ path: '/validation', methods: [ 'get' ], anonymous: true, cors: true })
export class Validation extends CorpjsCorpcheckService {
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

@use(ErrorTransform)
@rest({ path: '/validation', methods: [ 'post' ], anonymous: true, cors: true })
export class PackageJsonValidation extends CorpjsCorpcheckService {
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

@use(ErrorTransform)
@rest({ path: '/package', methods: [ 'get' ], anonymous: true, cors: true })
export class Package extends CorpjsCorpcheckService {
  public async handle(
    @param name,
    @param version,
    @param cid,
    @inject(GetPackageInfo) getPackageInfo,
    @inject(GetPackageResult) getPackageResult,
    @inject(IsExpiredResult) isExpiredResult,
    @inject(Evaluate) evaluate
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
      result = await evaluate({ data: JSON.parse(item.validationData) });
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

@use(ErrorTransform)
@rest({ path: '/complete', methods: [ 'post' ] })
export //TODO remove
class Complete extends CorpjsCorpcheckService {
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

@use(ErrorTransform)
@rest({ path: '/versions', methods: [ 'get' ], anonymous: true, cors: true })
export class GetPackageVersions extends CorpjsCorpcheckService {
  public async handle(@param name, @param version): Promise<string[]> {
    if (!name) return [];
    const pattern = new RegExp(`^${version.replace(/\./g, '\\.')}`);
    const response = await request({
      uri: `https://registry.npmjs.org/${name}`,
      json: true
    });
    return Object.keys(response.versions)
      .reverse()
      .filter(version => pattern.test(version))
      .map(version => `${name}@${version}`);
  }
}

export const validation = Validation.createInvoker();
export const packageJsonValidation = PackageJsonValidation.createInvoker();
export const packageInfo = Package.createInvoker();
export const complete = Complete.createInvoker();
export const getVersions = GetPackageVersions.createInvoker();
