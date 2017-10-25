import 'jest';
import { container } from 'functionly';
import { Qualification } from 'corp-check-core';
import { StateType } from '../src/types';

import { Badge } from '../src/services/badge';

describe('services', () => {
  describe('Badge', () => {
    let badge: Badge = null;
    beforeAll(() => {
      badge = container.resolve(Badge);
    });

    it('no params', async () => {
      const res = await badge.handle(undefined, undefined, undefined);
      expect(res).toEqual(null);
    });

    it('pending', async () => {
      const files: any = {
        async getObject({ Key }) {
          expect(Key).toEqual('/images/status/corp-check-inprogress.svg');

          return {
            Body: 'resultContent'
          };
        }
      };
      const packageInfo: any = { state: { type: StateType.PENDING } };

      const res = await badge.handle(packageInfo, undefined, files);
      expect(res).toEqual('resultContent');
    });

    it('failed', async () => {
      const files: any = {
        async getObject({ Key }) {
          expect(Key).toEqual('/images/status/corp-check-failed.svg');

          return {
            Body: 'resultContent'
          };
        }
      };
      const packageInfo: any = { state: { type: StateType.FAILED } };

      const res = await badge.handle(packageInfo, undefined, files);
      expect(res).toEqual('resultContent');
    });

    it('succeeded - no result', async () => {
      const files: any = {
        async getObject({ Key }) {
          expect(Key).toEqual('/images/status/corp-check-failed.svg');

          return {
            Body: 'resultContent'
          };
        }
      };
      const packageInfo: any = { state: { type: StateType.SUCCEEDED } };
      const evaluationInfo: any = { result: null };

      const res = await badge.handle(packageInfo, evaluationInfo, files);
      expect(res).toEqual('resultContent');
    });

    it('succeeded - accepted', async () => {
      const files: any = {
        async getObject({ Key }) {
          expect(Key).toEqual('/images/status/corp-check-accepted.svg');

          return {
            Body: 'resultContent'
          };
        }
      };
      const packageInfo: any = { state: { type: StateType.SUCCEEDED } };
      const evaluationInfo: any = { result: { qualification: Qualification.ACCEPTED } };

      const res = await badge.handle(packageInfo, evaluationInfo, files);
      expect(res).toEqual('resultContent');
    });

    it('succeeded - recommended', async () => {
      const files: any = {
        async getObject({ Key }) {
          expect(Key).toEqual('/images/status/corp-check-recommended.svg');

          return {
            Body: 'resultContent'
          };
        }
      };
      const packageInfo: any = { state: { type: StateType.SUCCEEDED } };
      const evaluationInfo: any = { result: { qualification: Qualification.RECOMMENDED } };

      const res = await badge.handle(packageInfo, evaluationInfo, files);
      expect(res).toEqual('resultContent');
    });

    it('succeeded - rejected', async () => {
      const files: any = {
        async getObject({ Key }) {
          expect(Key).toEqual('/images/status/corp-check-rejected.svg');

          return {
            Body: 'resultContent'
          };
        }
      };
      const packageInfo: any = { state: { type: StateType.SUCCEEDED } };
      const evaluationInfo: any = { result: { qualification: Qualification.REJECTED } };

      const res = await badge.handle(packageInfo, evaluationInfo, files);
      expect(res).toEqual('resultContent');
    });

    it('succeeded - default', async () => {
      const files: any = {
        async getObject({ Key }) {
          expect(Key).toEqual('/images/status/corp-check-failed.svg');

          return {
            Body: 'resultContent'
          };
        }
      };
      const packageInfo: any = { state: { type: StateType.SUCCEEDED } };
      const evaluationInfo: any = { result: {} };

      const res = await badge.handle(packageInfo, evaluationInfo, files);
      expect(res).toEqual('resultContent');
    });
  });
});
