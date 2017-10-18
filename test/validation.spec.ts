process.env.FUNCTIONAL_ENVIRONMENT = 'local';
import 'jest';
import { Validation } from '../src/functionalServices/rest';
import { container } from 'functionly';
import { PackageInfoApi } from '../src/api/packageInfo';

process.env.NODE_ENV = 'test';

const sleep = t => new Promise(r => setTimeout(r, t));
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

  it('packageName', async () => {
    const __packageName = 'react';

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
      expect(force).toEqual(false);
      expect(ruleSet).toEqual(undefined);
      expect(packageInfoFromResult).toEqual(packageInfoApiResult);

      return { _id: 'xyz' };
    };

    const res = await validation.handle(__packageName, _, _, _, _, _, _, packageInfoApi, validationStart);
    expect(res).toEqual({ state: 'state', cid: 'xyz' });
  });
});
