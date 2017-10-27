import 'jest';
import { container } from 'functionly';

import { Validation, Package, BadgeService } from '../src/functionalServices/rest';
import { Complete, Progress } from '../src/functionalServices/workerComplete';
import { CreateCacheItems, GetModuleMeta } from '../src/functionalServices/moduleMetaCache';

import { StateType } from '../src/types';

const _ = undefined;

describe('functional services', () => {
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

        const res = await validation.handle(
          _,
          _,
          __packageJSON,
          '{"xxxx":1}',
          _,
          _,
          _,
          packageInfoApi,
          validationStart
        );
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

  describe('package', () => {
    let packageService: Package = null;
    beforeAll(() => {
      packageService = container.resolve(Package);
    });

    it('no params', async () => {
      const evaluationsApi: any = {
        get(params) {
          const { cid } = params;
          expect(Object.keys(params)).toEqual([ 'cid' ]);
          expect(cid).toEqual(undefined);

          return null;
        }
      };

      const res = await packageService.handle(_, _, evaluationsApi, _);
      expect(Object.keys(res)).toEqual([ 'cid', 'name', 'state', 'expired', 'result', 'ruleSet' ]);
      expect(res.cid).toEqual(undefined);
      expect(res.name).toEqual(undefined);
      expect(res.state.type).toEqual('NOTEXISTS');
      expect(typeof res.state.date).toEqual('number');
      expect(res.expired).toEqual(true);
      expect(res.result).toEqual(null);
      expect(res.ruleSet).toEqual(null);
    });

    it('missing package', async () => {
      const packageInfoApi: any = {
        getById(params) {
          const { _id } = params;
          expect(Object.keys(params)).toEqual([ '_id' ]);
          expect(_id).toEqual('123456789');

          return null;
        }
      };

      const evaluationsApi: any = {
        get(params) {
          const { cid } = params;
          expect(Object.keys(params)).toEqual([ 'cid' ]);
          expect(cid).toEqual(undefined);

          return {
            result: { value: 1 },
            ruleSet: null,
            packageInfoId: '123456789'
          };
        }
      };

      const res = await packageService.handle(_, packageInfoApi, evaluationsApi, _);
      expect(Object.keys(res)).toEqual([ 'cid', 'name', 'state', 'expired', 'result', 'ruleSet' ]);
      expect(res.cid).toEqual(undefined);
      expect(res.name).toEqual(undefined);
      expect(res.state.type).toEqual('NOTEXISTS');
      expect(typeof res.state.date).toEqual('number');
      expect(res.expired).toEqual(true);
      expect(res.result).toEqual({ value: 1 });
      expect(res.ruleSet).toEqual(null);
    });

    it('cid', async () => {
      const packageInfoApi: any = {
        getById(params) {
          const { _id } = params;
          expect(Object.keys(params)).toEqual([ '_id' ]);
          expect(_id).toEqual('123456789');

          return {
            packageName: 'packageName',
            state: { date: 1, type: 'stateType' }
          };
        }
      };

      const evaluationsApi: any = {
        get(params) {
          const { cid } = params;
          expect(Object.keys(params)).toEqual([ 'cid' ]);
          expect(cid).toEqual('1');

          return {
            result: { value: 1 },
            ruleSet: null,
            packageInfoId: '123456789'
          };
        }
      };

      const isExpiredResult = ({ packageInfo, update, force }) => {
        expect(packageInfo).toEqual({
          packageName: 'packageName',
          state: { date: 1, type: 'stateType' }
        });
        expect(update).toEqual(false);
        expect(force).toEqual(false);

        return true;
      };

      const res = await packageService.handle('1', packageInfoApi, evaluationsApi, isExpiredResult);
      expect(Object.keys(res)).toEqual([ 'cid', 'name', 'state', 'expired', 'result', 'ruleSet' ]);
      expect(res.cid).toEqual('1');
      expect(res.name).toEqual('packageName');
      expect(res.state.type).toEqual('stateType');
      expect(typeof res.state.date).toEqual('number');
      expect(res.expired).toEqual(true);
      expect(res.result).toEqual({ value: 1 });
      expect(res.ruleSet).toEqual(null);
    });
  });

  describe('badge', () => {
    let badgeService: BadgeService = null;
    beforeAll(() => {
      badgeService = container.resolve(BadgeService);
    });

    it('no params', async () => {
      const packageInfoApi: any = {
        fromPackageName(params) {
          const { packageName } = params;
          expect(Object.keys(params)).toEqual([ 'packageName' ]);
          expect(packageName).toEqual('undefined@latest');

          return { packageInfo: { state: 'state' } };
        }
      };

      const validationStart = params => {
        const { force, ruleSet, packageInfoFromResult } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfoFromResult' ]);
        expect(force).toEqual(undefined);
        expect(ruleSet).toEqual(undefined);
        expect(packageInfoFromResult).toEqual({ packageInfo: { state: 'state' } });

        return { cid: '1' };
      };

      const badge = params => {
        const { packageInfo, evaluationInfo } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfo', 'evaluationInfo' ]);
        expect(packageInfo).toEqual({ state: 'state' });
        expect(evaluationInfo).toEqual({ cid: '1' });

        return 'badgeContent';
      };

      const res = await badgeService.handle(_, _, _, packageInfoApi, validationStart, badge);
      expect(Object.keys(res)).toEqual([ 'status', 'headers', 'data' ]);
      expect(res.status).toEqual(200);
      expect(res.headers).toEqual({
        'content-type': 'image/svg+xml'
      });
      expect(res.data).toEqual('badgeContent');
    });

    it('no content', async () => {
      const packageInfoApi: any = {
        fromPackageName(params) {
          const { packageName } = params;
          expect(Object.keys(params)).toEqual([ 'packageName' ]);
          expect(packageName).toEqual('undefined@latest');

          return { packageInfo: { state: 'state' } };
        }
      };

      const validationStart = params => {
        const { force, ruleSet, packageInfoFromResult } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfoFromResult' ]);
        expect(force).toEqual(undefined);
        expect(ruleSet).toEqual(undefined);
        expect(packageInfoFromResult).toEqual({ packageInfo: { state: 'state' } });

        return { cid: '1' };
      };

      const badge = params => {
        const { packageInfo, evaluationInfo } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfo', 'evaluationInfo' ]);
        expect(packageInfo).toEqual({ state: 'state' });
        expect(evaluationInfo).toEqual({ cid: '1' });

        return null;
      };

      try {
        const res = await badgeService.handle(_, _, _, packageInfoApi, validationStart, badge);
      } catch (e) {
        expect(e.message).toEqual('missing badge');
      }
    });

    it('name', async () => {
      const packageInfoApi: any = {
        fromPackageName(params) {
          const { packageName } = params;
          expect(Object.keys(params)).toEqual([ 'packageName' ]);
          expect(packageName).toEqual('packageName@latest');

          return { packageInfo: { state: 'state' } };
        }
      };

      const validationStart = params => {
        const { force, ruleSet, packageInfoFromResult } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfoFromResult' ]);
        expect(force).toEqual(undefined);
        expect(ruleSet).toEqual(undefined);
        expect(packageInfoFromResult).toEqual({ packageInfo: { state: 'state' } });

        return { cid: '1' };
      };

      const badge = params => {
        const { packageInfo, evaluationInfo } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfo', 'evaluationInfo' ]);
        expect(packageInfo).toEqual({ state: 'state' });
        expect(evaluationInfo).toEqual({ cid: '1' });

        return 'badgeContent';
      };

      const res = await badgeService.handle(_, 'packageName', _, packageInfoApi, validationStart, badge);
      expect(Object.keys(res)).toEqual([ 'status', 'headers', 'data' ]);
      expect(res.status).toEqual(200);
      expect(res.headers).toEqual({
        'content-type': 'image/svg+xml'
      });
      expect(res.data).toEqual('badgeContent');
    });

    it('name@version', async () => {
      const packageInfoApi: any = {
        fromPackageName(params) {
          const { packageName } = params;
          expect(Object.keys(params)).toEqual([ 'packageName' ]);
          expect(packageName).toEqual('packageName@version');

          return { packageInfo: { state: 'state' } };
        }
      };

      const validationStart = params => {
        const { force, ruleSet, packageInfoFromResult } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfoFromResult' ]);
        expect(force).toEqual(undefined);
        expect(ruleSet).toEqual(undefined);
        expect(packageInfoFromResult).toEqual({ packageInfo: { state: 'state' } });

        return { cid: '1' };
      };

      const badge = params => {
        const { packageInfo, evaluationInfo } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfo', 'evaluationInfo' ]);
        expect(packageInfo).toEqual({ state: 'state' });
        expect(evaluationInfo).toEqual({ cid: '1' });

        return 'badgeContent';
      };

      const res = await badgeService.handle(_, 'packageName', 'version', packageInfoApi, validationStart, badge);
      expect(Object.keys(res)).toEqual([ 'status', 'headers', 'data' ]);
      expect(res.status).toEqual(200);
      expect(res.headers).toEqual({
        'content-type': 'image/svg+xml'
      });
      expect(res.data).toEqual('badgeContent');
    });

    it('@scope/name@version', async () => {
      const packageInfoApi: any = {
        fromPackageName(params) {
          const { packageName } = params;
          expect(Object.keys(params)).toEqual([ 'packageName' ]);
          expect(packageName).toEqual('@scope/packageName@version');

          return { packageInfo: { state: 'state' } };
        }
      };

      const validationStart = params => {
        const { force, ruleSet, packageInfoFromResult } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfoFromResult' ]);
        expect(force).toEqual(undefined);
        expect(ruleSet).toEqual(undefined);
        expect(packageInfoFromResult).toEqual({ packageInfo: { state: 'state' } });

        return { cid: '1' };
      };

      const badge = params => {
        const { packageInfo, evaluationInfo } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfo', 'evaluationInfo' ]);
        expect(packageInfo).toEqual({ state: 'state' });
        expect(evaluationInfo).toEqual({ cid: '1' });

        return 'badgeContent';
      };

      const res = await badgeService.handle('scope', 'packageName', 'version', packageInfoApi, validationStart, badge);
      expect(Object.keys(res)).toEqual([ 'status', 'headers', 'data' ]);
      expect(res.status).toEqual(200);
      expect(res.headers).toEqual({
        'content-type': 'image/svg+xml'
      });
      expect(res.data).toEqual('badgeContent');
    });
  });

  describe('complete', () => {
    let complete: Complete = null;
    beforeAll(() => {
      complete = container.resolve(Complete);
    });

    it('no params', async () => {
      const evaluationsApi: any = {
        get(params) {
          const { cid } = params;
          expect(Object.keys(params)).toEqual([ 'cid' ]);
          expect(cid).toEqual(undefined);

          return null;
        }
      };

      const res = await complete.handle(_, _, _, _, evaluationsApi, _);
      expect(res).toEqual(undefined);
    });

    it('data', async () => {
      const evaluationsApi: any = {
        get(params) {
          const { cid } = params;
          expect(Object.keys(params)).toEqual([ 'cid' ]);
          expect(cid).toEqual('1');

          return { cid };
        },
        evaluate(params) {
          const { evaluationInfo, data } = params;
          expect(Object.keys(params)).toEqual([ 'evaluationInfo', 'data' ]);
          expect(evaluationInfo).toEqual({ cid: '1' });
          expect(data).toEqual({ tree: {}, meta: { pkg: {} } });
        }
      };

      const createCacheItems = params => {
        const { meta } = params;
        expect(Object.keys(params)).toEqual([ 'meta' ]);
        expect(meta).toEqual({ pkg: {} });
      };

      const res = await complete.handle('1', { tree: {}, meta: { pkg: {} } }, _, _, evaluationsApi, createCacheItems);
      expect(res).toEqual(undefined);
    });

    it('data no meta', async () => {
      const evaluationsApi: any = {
        get(params) {
          const { cid } = params;
          expect(Object.keys(params)).toEqual([ 'cid' ]);
          expect(cid).toEqual('1');

          return { cid };
        },
        evaluate(params) {
          const { evaluationInfo, data } = params;
          expect(Object.keys(params)).toEqual([ 'evaluationInfo', 'data' ]);
          expect(evaluationInfo).toEqual({ cid: '1' });
          expect(data).toEqual({ tree: {} });
        }
      };

      try {
        const res = await complete.handle('1', { tree: {} }, _, _, evaluationsApi, _);
        expect(res).toEqual(undefined);
      } catch (e) {
        expect(e).toEqual(undefined);
      }
    });

    it('error', async () => {
      const packageInfoApi: any = {
        updateState(params) {
          const { _id, meta, type } = params;
          expect(Object.keys(params)).toEqual([ '_id', 'meta', 'type' ]);
          expect(_id).toEqual('123456789');
          expect(meta).toEqual({ error: 'Error: error' });
          expect(type).toEqual(StateType.FAILED);
        }
      };

      const evaluationsApi: any = {
        get(params) {
          const { cid } = params;
          expect(Object.keys(params)).toEqual([ 'cid' ]);
          expect(cid).toEqual('1');

          return { cid, packageInfoId: '123456789' };
        }
      };

      const res = await complete.handle('1', _, 'Error: error', packageInfoApi, evaluationsApi, _);
      expect(res).toEqual(undefined);
    });
  });

  describe('progress', () => {
    let progress: Progress = null;
    beforeAll(() => {
      progress = container.resolve(Progress);
    });

    it('no params', async () => {
      const res = await progress.handle(_, _, _, _);
      expect(res).toEqual(undefined);
    });

    it('missing message', async () => {
      const res = await progress.handle('1', _, _, _);
      expect(res).toEqual(undefined);
    });

    it('missing cid', async () => {
      let counter = 0;
      const evaluationsApi: any = {
        get(params) {
          const { cid } = params;
          expect(Object.keys(params)).toEqual([ 'cid' ]);
          expect(cid).toEqual(undefined);
          counter++;

          return null;
        }
      };

      const res = await progress.handle(_, 'message', _, evaluationsApi);
      expect(res).toEqual(undefined);
      expect(counter).toEqual(1);
    });

    it('setProgress', async () => {
      let counter = 0;

      const evaluationsApi: any = {
        async get(params) {
          const { cid } = params;
          expect(Object.keys(params)).toEqual([ 'cid' ]);
          expect(cid).toEqual('1');
          counter++;

          return {
            packageInfoId: '123'
          };
        }
      };

      const packageInfoApi: any = {
        async setProgress(params) {
          const { _id, message } = params;
          expect(Object.keys(params)).toEqual([ '_id', 'message' ]);
          expect(_id).toEqual('123');
          expect(message).toEqual('message');
          counter++;
        }
      };

      const res = await progress.handle('1', 'message', packageInfoApi, evaluationsApi);
      expect(res).toEqual(undefined);
      expect(counter).toEqual(2);
    });
  });

  describe('CreateCacheItems', () => {
    let createCacheItem: CreateCacheItems = null;
    beforeAll(() => {
      createCacheItem = container.resolve(CreateCacheItems);
    });

    it('no params', async () => {
      try {
        const res = await createCacheItem.handle(_, _);
        expect(res).toEqual(undefined);
      } catch (e) {
        expect(typeof e.message).toBe('string');
      }
    });

    it('empty meta', async () => {
      const res = await createCacheItem.handle(_, _);
      expect(res).toEqual(undefined);
    });

    it('1 meta', async () => {
      let counter = 0;
      const moduleMetadataCache: any = {
        async update(filter, update, options) {
          expect(update.$set.prop).toEqual('p1');
          expect(update.$set._id).toEqual(filter._id);
          expect(typeof update.$set.date).toEqual('number');
          counter++;
        }
      };

      const res = await createCacheItem.handle(
        {
          key: { prop: 'p1' }
        },
        moduleMetadataCache
      );
      expect(res).toEqual(undefined);
      expect(counter).toEqual(1);
    });

    it('2 meta', async () => {
      let counter = 0;
      const moduleMetadataCache: any = {
        async update(filter, update, options) {
          expect(update.$set.prop).toEqual('p1');
          expect(update.$set._id).toEqual(filter._id);
          expect(typeof update.$set.date).toEqual('number');
          counter++;
        }
      };

      const res = await createCacheItem.handle(
        {
          key: { prop: 'p1' },
          key2: { prop: 'p1' }
        },
        moduleMetadataCache
      );
      expect(res).toEqual(undefined);
      expect(counter).toEqual(2);
    });

    it('3 meta - one with date', async () => {
      let counter = 0;
      const moduleMetadataCache: any = {
        async update(filter, update, options) {
          expect(update.$set.prop).toEqual('p1');
          expect(update.$set._id).toEqual(filter._id);
          expect(typeof update.$set.date).toEqual('number');
          counter++;
        }
      };

      const res = await createCacheItem.handle(
        {
          key: { prop: 'p1' },
          key2: { prop: 'p3', date: 1234 },
          key3: { prop: 'p1' }
        },
        moduleMetadataCache
      );
      expect(res).toEqual(undefined);
      expect(counter).toEqual(2);
    });
  });

  describe('GetModuleMeta', () => {
    let getModuleMeta: GetModuleMeta = null;
    beforeAll(() => {
      getModuleMeta = container.resolve(GetModuleMeta);
    });

    it('no param', async () => {
      const moduleMetadataCache: any = {
        find(filter) {
          expect(filter._id.$in).toEqual([]);

          return {
            async toArray() {
              return [];
            }
          };
        }
      };

      const res = await getModuleMeta.handle(_, moduleMetadataCache);
      expect(res).toEqual({});
    });

    it('1 module', async () => {
      const now = Date.now();
      const moduleMetadataCache: any = {
        find(filter) {
          expect(filter._id.$in).toEqual([ 'module1' ]);

          return {
            async toArray() {
              return [ { date: now, _id: 'module1' } ];
            }
          };
        }
      };

      const res = await getModuleMeta.handle([ 'module1' ], moduleMetadataCache);
      expect(res).toEqual({
        module1: { date: now, _id: 'module1' }
      });
    });

    it('2 modules', async () => {
      const now = Date.now();
      const moduleMetadataCache: any = {
        find(filter) {
          expect(filter._id.$in).toEqual([ 'module1', 'module2' ]);

          return {
            async toArray() {
              return [ { date: now, _id: 'module1' }, { date: now, _id: 'module2' } ];
            }
          };
        }
      };

      const res = await getModuleMeta.handle([ 'module1', 'module2' ], moduleMetadataCache);
      expect(res).toEqual({
        module1: { date: now, _id: 'module1' },
        module2: { date: now, _id: 'module2' }
      });
    });

    it('3 modules - one expired', async () => {
      const now = Date.now();
      const moduleMetadataCache: any = {
        find(filter) {
          expect(filter._id.$in).toEqual([ 'module1', 'module2', 'module3' ]);

          return {
            async toArray() {
              return [ { date: now, _id: 'module1' }, { date: 0, _id: 'module2' }, { date: now, _id: 'module3' } ];
            }
          };
        }
      };

      const res = await getModuleMeta.handle([ 'module1', 'module2', 'module3' ], moduleMetadataCache);
      expect(res).toEqual({
        module1: { date: now, _id: 'module1' },
        module3: { date: now, _id: 'module3' }
      });
    });

    it('3 modules - expiration default', async () => {
      const now = Date.now();
      const moduleMetadataCache: any = {
        find(filter) {
          expect(filter._id.$in).toEqual([ 'module1', 'module2', 'module3' ]);

          return {
            async toArray() {
              return [
                { date: now, _id: 'module1' },
                { date: now - (2 * 24 * 60 * 60 * 1000 + 1000), _id: 'module2' },
                { date: now - (2 * 24 * 60 * 60 * 1000 - 1000), _id: 'module3' }
              ];
            }
          };
        }
      };

      const res = await getModuleMeta.handle([ 'module1', 'module2', 'module3' ], moduleMetadataCache);
      expect(res).toEqual({
        module1: { date: now, _id: 'module1' },
        module3: { date: now - (2 * 24 * 60 * 60 * 1000 - 1000), _id: 'module3' }
      });
    });

    it('3 modules - expiration custom', async () => {
      const hours = 7 * 24;
      expect(process.env.MODULE_META_EXPIRATION_IN_HOURS).toBe(undefined);
      process.env.MODULE_META_EXPIRATION_IN_HOURS = hours;
      const now = Date.now();
      const moduleMetadataCache: any = {
        find(filter) {
          expect(filter._id.$in).toEqual([ 'module1', 'module2', 'module3' ]);

          return {
            async toArray() {
              return [
                { date: now, _id: 'module1' },
                { date: now - (hours * 60 * 60 * 1000 + 1000), _id: 'module2' },
                { date: now - (hours * 60 * 60 * 1000 - 1000), _id: 'module3' }
              ];
            }
          };
        }
      };

      const res = await getModuleMeta.handle([ 'module1', 'module2', 'module3' ], moduleMetadataCache);
      expect(res).toEqual({
        module1: { date: now, _id: 'module1' },
        module3: { date: now - (hours * 60 * 60 * 1000 - 1000), _id: 'module3' }
      });

      delete process.env.MODULE_META_EXPIRATION_IN_HOURS;
      expect(process.env.MODULE_META_EXPIRATION_IN_HOURS).toBe(undefined);
    });
  });
});
