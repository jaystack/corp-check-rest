import 'jest';
import { Validation } from '../src/functionalServices/rest';
import { container } from 'functionly';

process.env.NODE_ENV = 'test';

const _ = undefined;

describe('validation', () => {
  let validation: Validation = null;
  beforeAll(() => {
    validation = container.resolve(Validation);
  });

  it('no param', async () => {
    try {
      await validation.handle(_, _, _, _, _, _, _, _, _);
    } catch (e) {
      expect(e.message).toEqual('packageJSON or packageName');
    }
  });

  describe('from packageName', () => {
    const __packageName = 'react';

    it('packageName', async () => {
      const packageInfoApiResult = {
        packageInfo: {
          state: 'state'
        }
      };
      
      const packageInfoApi: any = {
        fromPackageName(params) {
          const { packageName } = params;
          expect(Object.keys(params)).toEqual([ 'packageName' ]);
          expect(packageName).toEqual(__packageName);

          return packageInfoApiResult;
        }
      };

      const validationStart = ({ force, ruleSet, packageInfoFromResult }) => {
        expect(force).toEqual(false);
        expect(ruleSet).toEqual(undefined);
        expect(packageInfoFromResult).toEqual(packageInfoApiResult);

        return { _id: 'xyz' };
      };

      const res = await validation.handle(__packageName, _, _, _, _, _, _, packageInfoApi, validationStart);
      expect(res).toEqual({ state: 'state', cid: 'xyz' });
    });

    it('packageName force', async () => {
      const packageInfoApiResult = {
        packageInfo: {
          state: 'state'
        }
      };
      const packageInfoApi: any = {
        fromPackageName({ packageName }) {
          expect(packageName).toEqual(__packageName);

          return packageInfoApiResult;
        }
      };

      const validationStart = ({ force, ruleSet, packageInfoFromResult }) => {
        expect(force).toEqual(true);
        expect(ruleSet).toEqual(undefined);
        expect(packageInfoFromResult).toEqual(packageInfoApiResult);

        return { _id: 'xyz' };
      };

      const res = await validation.handle(__packageName, true, _, _, _, _, _, packageInfoApi, validationStart);
      expect(res).toEqual({ state: 'state', cid: 'xyz' });
    });

    it('packageName ruleSet', async () => {
      const _ruleSet = { rule: 1 };

      const packageInfoApiResult = {
        packageInfo: {
          state: 'state'
        }
      };
      const packageInfoApi: any = {
        fromPackageName(params) {
          const { packageName } = params;
          expect(Object.keys(params)).toEqual([ 'packageName' ]);
          expect(packageName).toEqual(__packageName);

          return packageInfoApiResult;
        }
      };

      const validationStart = ({ force, ruleSet, packageInfoFromResult }) => {
        expect(force).toEqual(false);
        expect(ruleSet).toEqual(_ruleSet);
        expect(packageInfoFromResult).toEqual(packageInfoApiResult);

        return { _id: 'xyz' };
      };

      const res = await validation.handle(__packageName, _, _, _, _, _, _ruleSet, packageInfoApi, validationStart);
      expect(res).toEqual({ state: 'state', cid: 'xyz' });
    });
  });

  describe('from packageJSON', () => {
    const __packageJSON = '{"name":"test","version":"0.0.1"}';

    it('packageJSON', async () => {
      const packageInfoApiResult = {
        packageInfo: {
          state: 'state'
        }
      };
      const packageInfoApi: any = {
        fromPackageJSON(params) {
          const { packageJSON, packageLock, yarnLock, isProduction, persistBinaries } = params;
          expect(Object.keys(params)).toEqual([
            'packageJSON',
            'packageLock',
            'yarnLock',
            'isProduction',
            'persistBinaries'
          ]);
          expect(packageJSON).toEqual(__packageJSON);
          expect(packageLock).toEqual(undefined);
          expect(yarnLock).toEqual(undefined);
          expect(isProduction).toEqual(false);
          expect(persistBinaries).toEqual(false);

          return packageInfoApiResult;
        }
      };

      const validationStart = ({ force, ruleSet, packageInfoFromResult }) => {
        expect(force).toEqual(false);
        expect(ruleSet).toEqual(undefined);
        expect(packageInfoFromResult).toEqual(packageInfoApiResult);

        return { _id: 'xyz' };
      };

      const res = await validation.handle(_, _, __packageJSON, _, _, _, _, packageInfoApi, validationStart);
      expect(res).toEqual({ state: 'state', cid: 'xyz' });
    });

    it('packageJSON force', async () => {
      const packageInfoApiResult = {
        packageInfo: {
          state: 'state'
        }
      };
      const packageInfoApi: any = {
        fromPackageJSON(params) {
          const { packageJSON, packageLock, yarnLock, isProduction, persistBinaries } = params;
          expect(Object.keys(params)).toEqual([
            'packageJSON',
            'packageLock',
            'yarnLock',
            'isProduction',
            'persistBinaries'
          ]);
          expect(packageJSON).toEqual(__packageJSON);
          expect(packageLock).toEqual(undefined);
          expect(yarnLock).toEqual(undefined);
          expect(isProduction).toEqual(false);
          expect(persistBinaries).toEqual(false);

          return packageInfoApiResult;
        }
      };

      const validationStart = ({ force, ruleSet, packageInfoFromResult }) => {
        expect(force).toEqual(true);
        expect(ruleSet).toEqual(undefined);
        expect(packageInfoFromResult).toEqual(packageInfoApiResult);

        return { _id: 'xyz' };
      };

      const res = await validation.handle(_, true, __packageJSON, _, _, _, _, packageInfoApi, validationStart);
      expect(res).toEqual({ state: 'state', cid: 'xyz' });
    });

    it('packageJSON packageLock', async () => {
      const packageInfoApiResult = {
        packageInfo: {
          state: 'state'
        }
      };
      const packageInfoApi: any = {
        fromPackageJSON(params) {
          const { packageJSON, packageLock, yarnLock, isProduction, persistBinaries } = params;
          expect(Object.keys(params)).toEqual([
            'packageJSON',
            'packageLock',
            'yarnLock',
            'isProduction',
            'persistBinaries'
          ]);
          expect(packageJSON).toEqual(__packageJSON);
          expect(packageLock).toEqual('{"xxxx":1}');
          expect(yarnLock).toEqual(undefined);
          expect(isProduction).toEqual(false);
          expect(persistBinaries).toEqual(false);

          return packageInfoApiResult;
        }
      };

      const validationStart = ({ force, ruleSet, packageInfoFromResult }) => {
        expect(force).toEqual(false);
        expect(ruleSet).toEqual(undefined);
        expect(packageInfoFromResult).toEqual(packageInfoApiResult);

        return { _id: 'xyz' };
      };

      const res = await validation.handle(_, _, __packageJSON, '{"xxxx":1}', _, _, _, packageInfoApi, validationStart);
      expect(res).toEqual({ state: 'state', cid: 'xyz' });
    });

    it('packageJSON yarnLock', async () => {
      const packageInfoApiResult = {
        packageInfo: {
          state: 'state'
        }
      };
      const packageInfoApi: any = {
        fromPackageJSON(params) {
          const { packageJSON, packageLock, yarnLock, isProduction, persistBinaries } = params;
          expect(Object.keys(params)).toEqual([
            'packageJSON',
            'packageLock',
            'yarnLock',
            'isProduction',
            'persistBinaries'
          ]);
          expect(packageJSON).toEqual(__packageJSON);
          expect(packageLock).toEqual(undefined);
          expect(yarnLock).toEqual('yarnLockContent');
          expect(isProduction).toEqual(false);
          expect(persistBinaries).toEqual(false);

          return packageInfoApiResult;
        }
      };

      const validationStart = ({ force, ruleSet, packageInfoFromResult }) => {
        expect(force).toEqual(false);
        expect(ruleSet).toEqual(undefined);
        expect(packageInfoFromResult).toEqual(packageInfoApiResult);

        return { _id: 'xyz' };
      };

      const res = await validation.handle(
        _,
        _,
        __packageJSON,
        _,
        'yarnLockContent',
        _,
        _,
        packageInfoApi,
        validationStart
      );
      expect(res).toEqual({ state: 'state', cid: 'xyz' });
    });

    it('packageJSON production', async () => {
      const packageInfoApiResult = {
        packageInfo: {
          state: 'state'
        }
      };
      const packageInfoApi: any = {
        fromPackageJSON(params) {
          const { packageJSON, packageLock, yarnLock, isProduction, persistBinaries } = params;
          expect(Object.keys(params)).toEqual([
            'packageJSON',
            'packageLock',
            'yarnLock',
            'isProduction',
            'persistBinaries'
          ]);
          expect(packageJSON).toEqual(__packageJSON);
          expect(packageLock).toEqual(undefined);
          expect(yarnLock).toEqual(undefined);
          expect(isProduction).toEqual(true);
          expect(persistBinaries).toEqual(false);

          return packageInfoApiResult;
        }
      };

      const validationStart = ({ force, ruleSet, packageInfoFromResult }) => {
        expect(force).toEqual(false);
        expect(ruleSet).toEqual(undefined);
        expect(packageInfoFromResult).toEqual(packageInfoApiResult);

        return { _id: 'xyz' };
      };

      const res = await validation.handle(_, _, __packageJSON, _, _, true, _, packageInfoApi, validationStart);
      expect(res).toEqual({ state: 'state', cid: 'xyz' });
    });

    it('packageJSON persistBinaries', async () => {
      expect(process.env.PERSIST_VALIDATION_BINARIES).toEqual(undefined);
      process.env.PERSIST_VALIDATION_BINARIES = '1';
      const packageInfoApiResult = {
        packageInfo: {
          state: 'state'
        }
      };
      const packageInfoApi: any = {
        fromPackageJSON(params) {
          const { packageJSON, packageLock, yarnLock, isProduction, persistBinaries } = params;
          expect(Object.keys(params)).toEqual([
            'packageJSON',
            'packageLock',
            'yarnLock',
            'isProduction',
            'persistBinaries'
          ]);
          expect(packageJSON).toEqual(__packageJSON);
          expect(packageLock).toEqual(undefined);
          expect(yarnLock).toEqual(undefined);
          expect(isProduction).toEqual(false);
          expect(persistBinaries).toEqual(true);

          return packageInfoApiResult;
        }
      };

      const validationStart = ({ force, ruleSet, packageInfoFromResult }) => {
        expect(force).toEqual(false);
        expect(ruleSet).toEqual(undefined);
        expect(packageInfoFromResult).toEqual(packageInfoApiResult);

        return { _id: 'xyz' };
      };

      const res = await validation.handle(_, _, __packageJSON, _, _, _, _, packageInfoApi, validationStart);
      expect(res).toEqual({ state: 'state', cid: 'xyz' });
      delete process.env.PERSIST_VALIDATION_BINARIES;
      expect(process.env.PERSIST_VALIDATION_BINARIES).toEqual(undefined);
    });

    it('packageJSON ruleSet', async () => {
      const _ruleSet = { rule: 1 };

      const packageInfoApiResult = {
        packageInfo: {
          state: 'state'
        }
      };
      const packageInfoApi: any = {
        fromPackageJSON(params) {
          const { packageJSON, packageLock, yarnLock, isProduction, persistBinaries } = params;
          expect(Object.keys(params)).toEqual([
            'packageJSON',
            'packageLock',
            'yarnLock',
            'isProduction',
            'persistBinaries'
          ]);
          expect(packageJSON).toEqual(__packageJSON);
          expect(packageLock).toEqual(undefined);
          expect(yarnLock).toEqual(undefined);
          expect(isProduction).toEqual(false);
          expect(persistBinaries).toEqual(false);

          return packageInfoApiResult;
        }
      };

      const validationStart = ({ force, ruleSet, packageInfoFromResult }) => {
        expect(force).toEqual(false);
        expect(ruleSet).toEqual(_ruleSet);
        expect(packageInfoFromResult).toEqual(packageInfoApiResult);

        return { _id: 'xyz' };
      };

      const res = await validation.handle(_, _, __packageJSON, _, _, _, _ruleSet, packageInfoApi, validationStart);
      expect(res).toEqual({ state: 'state', cid: 'xyz' });
    });
  });
});
