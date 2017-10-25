import 'jest';
import { Package } from '../src/functionalServices/rest';
import { container } from 'functionly';

const _ = undefined;

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
