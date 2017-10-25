import 'jest';
import { BadgeService } from '../src/functionalServices/rest';
import { container } from 'functionly';

const _ = undefined;

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
