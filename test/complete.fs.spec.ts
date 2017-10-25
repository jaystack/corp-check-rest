import 'jest';
import { Complete } from '../src/functionalServices/workerComplete';
import { StateType } from '../src/types';
import { container } from 'functionly';

const _ = undefined;

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
