import { generate } from 'shortid';
import { FunctionalService, DynamoTable, Service, Api } from 'functionly';
import { rest, aws, param, inject, use } from 'functionly';
import { ErrorTransform } from './middleware/errorTransform';
import { GetPackageInfo } from './services/npm';
import { Evaluate } from './services/evaluate';
import { GetPackageResult, UpdatePackageResult, CreatePackageResult, StartPackageValidation } from './services/checker';
import { ValidationsResults } from './tables/validationResults';

@aws({ type: 'nodejs6.10', memorySize: 512, timeout: 3 })
export class CorpjsCorpcheckService extends FunctionalService {}

@use(ErrorTransform)
@rest({ path: '/validation', methods: [ 'get' ], anonymous: true, cors: true })
export class Validation extends CorpjsCorpcheckService {
  public async handle(
    @param name,
    @param version,
    @inject(GetPackageInfo) getPackageInfo,
    @inject(GetPackageResult) getPackageResult,
    @inject(CreatePackageResult) createPackageResult,
    @inject(StartPackageValidation) startPackageValidation
  ) {
    const packageInfo = await getPackageInfo({ name, version });
    let item = await getPackageResult({ name: packageInfo.name, version: packageInfo.version, isProduction: true });

    if (item === null) {
      item = await createPackageResult({
        name: packageInfo.name,
        version: packageInfo.version,
        isNpmPackage: true,
        isProduction: true,
        packageJSON: packageInfo.packageJSON
      });

      await startPackageValidation({ packageJSON: item.packageJSON, cid: item.id, isProduction: true });
    }

    return { item, cid: item.id };
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

    await startPackageValidation({ packageJSON: item.packageJSON, cid: item.id, isProduction: isProd });

    return { item, cid: item.id };
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
    @inject(GetPackageResult) getPackageResult
  ) {
    if (name && !version) {
      const packageInfo = await getPackageInfo({ name });
      version = packageInfo.version;
    }

    const item = await getPackageResult({ name, version, cid, isProduction: true });

    return {
      package: packageInfo,
      item,
      name,
      version,
      cid: item && item.id
    };
  }
}

@use(ErrorTransform)
@rest({ path: '/complete', methods: [ 'post' ] })
export //TODO remove
class Complete extends CorpjsCorpcheckService {
  public async handle(
    @param cid,
    @param data,
    @inject(UpdatePackageResult) updatePackageResult,
    @inject(Evaluate) evaluate
  ) {
    const result = evaluate({ data });
    await updatePackageResult({
      cid,
      data: JSON.stringify(data),
      result,
      state: 'Completed'
    });

    return { ok: 1 };
  }
}

export const validation = Validation.createInvoker();
export const packageJsonValidation = PackageJsonValidation.createInvoker();
export const packageInfo = Package.createInvoker();
export const complete = Complete.createInvoker();
