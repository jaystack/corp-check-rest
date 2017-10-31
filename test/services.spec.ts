import 'jest';
jest.mock('request-promise-native');
jest.mock('../src/evaluators/license');
jest.mock('../src/evaluators/version');
jest.mock('../src/evaluators/npmScores');
const request = require('request-promise-native');
const license = require('../src/evaluators/license').default;
const version = require('../src/evaluators/version').default;
const npmScores = require('../src/evaluators/npmScores').default;

import { container } from 'functionly';
import { Qualification } from 'corp-check-core';
import { StateType } from '../src/types';

import { Badge } from '../src/services/badge';
import { IsExpiredResult, StartPackageValidation } from '../src/services/checker';
import { Evaluate } from '../src/services/evaluate';
import { GetNpmInfo } from '../src/services/npm';
import { ValidationStart } from '../src/services/validationStart';
import { AssertQueue, PublishToQueue } from '../src/services/rabbitMQ';

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

  describe('IsExpiredResult', () => {
    let isExpiredResult: IsExpiredResult = null;
    beforeAll(() => {
      isExpiredResult = container.resolve(IsExpiredResult);
    });

    it('no params', async () => {
      try {
        const res = await isExpiredResult.handle(undefined, undefined, undefined, undefined);
        expect(false).toEqual(true);
      } catch (e) {
        expect(true).toEqual(true);
      }
    });

    it('pending', async () => {
      const packageInfo: any = { hash: '1', date: Date.now(), state: { type: StateType.PENDING } };

      const res = await isExpiredResult.handle(packageInfo, false, false, undefined);
      expect(res).toEqual(false);
    });

    it('failed', async () => {
      const packageInfo: any = { hash: '1', date: Date.now(), state: { type: StateType.FAILED } };

      const res = await isExpiredResult.handle(packageInfo, false, false, undefined);
      expect(res).toEqual(true);
    });

    it('succeeded', async () => {
      const packageInfo: any = { hash: '1', date: Date.now(), state: { type: StateType.SUCCEEDED } };

      const res = await isExpiredResult.handle(packageInfo, false, false, undefined);
      expect(res).toEqual(false);
    });

    it('pending force', async () => {
      let counter = 0;
      const packageInfoApi: any = {
        async updateMany(filter, update) {
          expect(filter).toEqual({ hash: '1' });
          expect(update).toEqual({ latest: false });
          counter++;
        }
      };
      const packageInfo: any = { hash: '1', date: Date.now(), state: { type: StateType.PENDING } };

      const res = await isExpiredResult.handle(packageInfo, false, true, packageInfoApi);
      expect(res).toEqual(true);
      expect(counter).toEqual(1);
    });

    it('failed force', async () => {
      let counter = 0;
      const packageInfoApi: any = {
        async updateMany(filter, update) {
          expect(filter).toEqual({ hash: '1' });
          expect(update).toEqual({ latest: false });
          counter++;
        }
      };
      const packageInfo: any = { hash: '1', date: Date.now(), state: { type: StateType.FAILED } };

      const res = await isExpiredResult.handle(packageInfo, false, true, packageInfoApi);
      expect(res).toEqual(true);
      expect(counter).toEqual(1);
    });

    it('succeeded force', async () => {
      let counter = 0;
      const packageInfoApi: any = {
        async updateMany(filter, update) {
          expect(filter).toEqual({ hash: '1' });
          expect(update).toEqual({ latest: false });
          counter++;
        }
      };
      const packageInfo: any = { hash: '1', date: Date.now(), state: { type: StateType.SUCCEEDED } };

      const res = await isExpiredResult.handle(packageInfo, false, true, packageInfoApi);
      expect(res).toEqual(true);
      expect(counter).toEqual(1);
    });

    it('pending update', async () => {
      const packageInfo: any = { hash: '1', date: Date.now(), state: { type: StateType.PENDING } };

      const res = await isExpiredResult.handle(packageInfo, true, false, undefined);
      expect(res).toEqual(false);
    });

    it('failed update', async () => {
      let counter = 0;
      const packageInfoApi: any = {
        async updateMany(filter, update) {
          expect(filter).toEqual({ hash: '1' });
          expect(update).toEqual({ latest: false });
          counter++;
        }
      };
      const packageInfo: any = { hash: '1', date: Date.now(), state: { type: StateType.FAILED } };

      const res = await isExpiredResult.handle(packageInfo, true, false, packageInfoApi);
      expect(res).toEqual(true);
      expect(counter).toEqual(1);
    });

    it('succeeded update', async () => {
      const packageInfo: any = { hash: '1', date: Date.now(), state: { type: StateType.SUCCEEDED } };

      const res = await isExpiredResult.handle(packageInfo, true, false, undefined);
      expect(res).toEqual(false);
    });

    it('succeeded expired', async () => {
      const packageInfo: any = {
        hash: '1',
        date: Date.now() - (24 * 60 * 60 * 1000 + 1000),
        state: { type: StateType.SUCCEEDED }
      };

      const res = await isExpiredResult.handle(packageInfo, false, false, undefined);
      expect(res).toEqual(true);
    });

    it('succeeded expired update', async () => {
      let counter = 0;
      const packageInfoApi: any = {
        async updateMany(filter, update) {
          expect(filter).toEqual({ hash: '1' });
          expect(update).toEqual({ latest: false });
          counter++;
        }
      };
      const packageInfo: any = {
        hash: '1',
        date: Date.now() - (24 * 60 * 60 * 1000 + 1000),
        state: { type: StateType.SUCCEEDED }
      };

      const res = await isExpiredResult.handle(packageInfo, false, true, packageInfoApi);
      expect(res).toEqual(true);
      expect(counter).toEqual(1);
    });

    it('succeeded expired force', async () => {
      let counter = 0;
      const packageInfoApi: any = {
        async updateMany(filter, update) {
          expect(filter).toEqual({ hash: '1' });
          expect(update).toEqual({ latest: false });
          counter++;
        }
      };
      const packageInfo: any = {
        hash: '1',
        date: Date.now() - (24 * 60 * 60 * 1000 + 1000),
        state: { type: StateType.SUCCEEDED }
      };

      const res = await isExpiredResult.handle(packageInfo, true, false, packageInfoApi);
      expect(res).toEqual(true);
      expect(counter).toEqual(1);
    });

    it('succeeded custom expiration', async () => {
      const days = 3;
      expect(process.env.PACKAGE_VALIDATION_EXPIRATION_IN_DAYS).toEqual(undefined);
      process.env.PACKAGE_VALIDATION_EXPIRATION_IN_DAYS = days;

      const packageInfo: any = {
        hash: '1',
        date: Date.now() - (days * 24 * 60 * 60 * 1000 - 1000),
        state: { type: StateType.SUCCEEDED }
      };

      const res = await isExpiredResult.handle(packageInfo, true, false, undefined);
      expect(res).toEqual(false);

      delete process.env.PACKAGE_VALIDATION_EXPIRATION_IN_DAYS;
      expect(process.env.PACKAGE_VALIDATION_EXPIRATION_IN_DAYS).toEqual(undefined);
    });

    it('succeeded expired custom expiration', async () => {
      const days = 3;
      expect(process.env.PACKAGE_VALIDATION_EXPIRATION_IN_DAYS).toEqual(undefined);
      process.env.PACKAGE_VALIDATION_EXPIRATION_IN_DAYS = days;

      let counter = 0;
      const packageInfoApi: any = {
        async updateMany(filter, update) {
          expect(filter).toEqual({ hash: '1' });
          expect(update).toEqual({ latest: false });
          counter++;
        }
      };
      const packageInfo: any = {
        hash: '1',
        date: Date.now() - (days * 24 * 60 * 60 * 1000 + 1000),
        state: { type: StateType.SUCCEEDED }
      };

      const res = await isExpiredResult.handle(packageInfo, true, false, packageInfoApi);
      expect(res).toEqual(true);
      expect(counter).toEqual(1);

      delete process.env.PACKAGE_VALIDATION_EXPIRATION_IN_DAYS;
      expect(process.env.PACKAGE_VALIDATION_EXPIRATION_IN_DAYS).toEqual(undefined);
    });
  });

  describe('StartPackageValidation', () => {
    let startPackageValidation: StartPackageValidation = null;
    beforeAll(() => {
      startPackageValidation = container.resolve(StartPackageValidation);
    });

    it('no params', async () => {
      const taskName = 'tasks';
      const stage = 'test';
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
      process.env.RABBITMQ_QUEUE_NAME = taskName;

      let counter = 0;

      const assertQueue: any = params => {
        counter++;
        expect(params).toEqual({ queue: `${taskName}-${stage}` });
      };

      const publishToQueue: any = params => {
        counter++;
        expect(params).toEqual({ queue: `${taskName}-${stage}`, payload: '{}' });
      };

      const res = await startPackageValidation.handle(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        assertQueue,
        publishToQueue,
        stage
      );
      expect(res).toEqual(undefined);
      expect(counter).toEqual(2);

      delete process.env.RABBITMQ_QUEUE_NAME;
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
    });

    it('packageName', async () => {
      const taskName = 'tasks';
      const stage = 'test';
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
      process.env.RABBITMQ_QUEUE_NAME = taskName;

      let counter = 0;

      const assertQueue: any = params => {
        counter++;
        expect(params).toEqual({ queue: `${taskName}-${stage}` });
      };

      const publishToQueue: any = params => {
        counter++;
        expect(params).toEqual({
          queue: `${taskName}-${stage}`,
          payload: JSON.stringify({
            cid: '1',
            pkg: 'packageName'
          })
        });
      };

      const res = await startPackageValidation.handle(
        '1',
        'packageName',
        undefined,
        undefined,
        undefined,
        undefined,
        assertQueue,
        publishToQueue,
        stage
      );
      expect(res).toEqual(undefined);
      expect(counter).toEqual(2);

      delete process.env.RABBITMQ_QUEUE_NAME;
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
    });

    it('packageJSON', async () => {
      const taskName = 'tasks';
      const stage = 'test';
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
      process.env.RABBITMQ_QUEUE_NAME = taskName;

      let counter = 0;

      const assertQueue: any = params => {
        counter++;
        expect(params).toEqual({ queue: `${taskName}-${stage}` });
      };

      const publishToQueue: any = params => {
        counter++;
        expect(params).toEqual({
          queue: `${taskName}-${stage}`,
          payload: JSON.stringify({
            cid: '1',
            pkg: 'packageJSONstring'
          })
        });
      };

      const res = await startPackageValidation.handle(
        '1',
        undefined,
        'packageJSONstring',
        undefined,
        undefined,
        undefined,
        assertQueue,
        publishToQueue,
        stage
      );
      expect(res).toEqual(undefined);
      expect(counter).toEqual(2);

      delete process.env.RABBITMQ_QUEUE_NAME;
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
    });

    it('packageName and packageJSON', async () => {
      const taskName = 'tasks';
      const stage = 'test';
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
      process.env.RABBITMQ_QUEUE_NAME = taskName;

      let counter = 0;

      const assertQueue: any = params => {
        counter++;
        expect(params).toEqual({ queue: `${taskName}-${stage}` });
      };

      const publishToQueue: any = params => {
        counter++;
        expect(params).toEqual({
          queue: `${taskName}-${stage}`,
          payload: JSON.stringify({
            cid: '1',
            pkg: 'packageJSONstring'
          })
        });
      };

      const res = await startPackageValidation.handle(
        '1',
        'name',
        'packageJSONstring',
        undefined,
        undefined,
        undefined,
        assertQueue,
        publishToQueue,
        stage
      );
      expect(res).toEqual(undefined);
      expect(counter).toEqual(2);

      delete process.env.RABBITMQ_QUEUE_NAME;
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
    });

    it('packageLock', async () => {
      const taskName = 'tasks';
      const stage = 'test';
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
      process.env.RABBITMQ_QUEUE_NAME = taskName;

      let counter = 0;

      const assertQueue: any = params => {
        counter++;
        expect(params).toEqual({ queue: `${taskName}-${stage}` });
      };

      const publishToQueue: any = params => {
        counter++;
        expect(params).toEqual({
          queue: `${taskName}-${stage}`,
          payload: JSON.stringify({
            cid: '1',
            pkg: 'packageJSONstring',
            packageLock: 'packageLockContent'
          })
        });
      };

      const res = await startPackageValidation.handle(
        '1',
        undefined,
        'packageJSONstring',
        'packageLockContent',
        undefined,
        undefined,
        assertQueue,
        publishToQueue,
        stage
      );
      expect(res).toEqual(undefined);
      expect(counter).toEqual(2);

      delete process.env.RABBITMQ_QUEUE_NAME;
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
    });

    it('yarnLock', async () => {
      const taskName = 'tasks';
      const stage = 'test';
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
      process.env.RABBITMQ_QUEUE_NAME = taskName;

      let counter = 0;

      const assertQueue: any = params => {
        counter++;
        expect(params).toEqual({ queue: `${taskName}-${stage}` });
      };

      const publishToQueue: any = params => {
        counter++;
        expect(params).toEqual({
          queue: `${taskName}-${stage}`,
          payload: JSON.stringify({
            cid: '1',
            pkg: 'packageJSONstring',
            yarnLock: 'yarnLockContent'
          })
        });
      };

      const res = await startPackageValidation.handle(
        '1',
        undefined,
        'packageJSONstring',
        undefined,
        'yarnLockContent',
        undefined,
        assertQueue,
        publishToQueue,
        stage
      );
      expect(res).toEqual(undefined);
      expect(counter).toEqual(2);

      delete process.env.RABBITMQ_QUEUE_NAME;
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
    });

    it('isProduction true', async () => {
      const taskName = 'tasks';
      const stage = 'test';
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
      process.env.RABBITMQ_QUEUE_NAME = taskName;

      let counter = 0;

      const assertQueue: any = params => {
        counter++;
        expect(params).toEqual({ queue: `${taskName}-${stage}` });
      };

      const publishToQueue: any = params => {
        counter++;
        expect(params).toEqual({
          queue: `${taskName}-${stage}`,
          payload: JSON.stringify({
            cid: '1',
            pkg: 'packageJSONstring',
            production: true
          })
        });
      };

      const res = await startPackageValidation.handle(
        '1',
        undefined,
        'packageJSONstring',
        undefined,
        undefined,
        true,
        assertQueue,
        publishToQueue,
        stage
      );
      expect(res).toEqual(undefined);
      expect(counter).toEqual(2);

      delete process.env.RABBITMQ_QUEUE_NAME;
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
    });

    it('isProduction false', async () => {
      const taskName = 'tasks';
      const stage = 'test';
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
      process.env.RABBITMQ_QUEUE_NAME = taskName;

      let counter = 0;

      const assertQueue: any = params => {
        counter++;
        expect(params).toEqual({ queue: `${taskName}-${stage}` });
      };

      const publishToQueue: any = params => {
        counter++;
        expect(params).toEqual({
          queue: `${taskName}-${stage}`,
          payload: JSON.stringify({
            cid: '1',
            pkg: 'packageJSONstring',
            production: false
          })
        });
      };

      const res = await startPackageValidation.handle(
        '1',
        undefined,
        'packageJSONstring',
        undefined,
        undefined,
        false,
        assertQueue,
        publishToQueue,
        stage
      );
      expect(res).toEqual(undefined);
      expect(counter).toEqual(2);

      delete process.env.RABBITMQ_QUEUE_NAME;
      expect(process.env.RABBITMQ_QUEUE_NAME).toEqual(undefined);
    });
  });

  describe('Evaluate', () => {
    let evaluate: Evaluate = null;
    beforeAll(() => {
      evaluate = container.resolve(Evaluate);
    });

    beforeEach(() => {
      license.mockClear();
      version.mockClear();
      npmScores.mockClear();
    });

    it('no params', async () => {
      try {
        const res = await evaluate.handle(undefined, undefined);
        expect(false).toEqual(true);
      } catch (e) {
        expect(true).toEqual(true);
      }
    });

    it('no data', async () => {
      try {
        const res = await evaluate.handle(undefined, {});
        expect(false).toEqual(true);
      } catch (e) {
        expect(true).toEqual(true);
      }
    });

    it('no ruleSet', async () => {
      try {
        const res = await evaluate.handle({}, undefined);
        expect(false).toEqual(true);
      } catch (e) {
        expect(true).toEqual(true);
      }
    });

    it('evaluation', async () => {
      license.mockReturnValue({ score: 1 });
      version.mockReturnValue({ score: 1 });
      npmScores.mockReturnValue({ score: 1 });

      const data = {
        meta: {
          name: { npmScores: { quality: 1, popularity: 1, maintenance: 1 } }
        },
        tree: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: []
        },
        unknownPackages: []
      };
      const ruleSet = { license: { license: 1 }, version: { version: 1 }, npmScores: { npmScores: 1 } };

      const res = await evaluate.handle(data, ruleSet);
      expect(res).toEqual({
        rootEvaluation: {
          nodeName: 'name',
          nodeVersion: 'version',
          evaluations: [ { score: 1 }, { score: 1 }, { score: 1 } ],
          nodeScore: 1,
          dependencies: []
        },
        qualification: Qualification.RECOMMENDED
      });

      expect(license).toBeCalledWith({
        node: data.tree,
        packageMeta: data.meta.name,
        rule: ruleSet.license,
        unknownPackages: [],
        depth: 0
      });

      expect(version).toBeCalledWith({
        node: data.tree,
        packageMeta: data.meta.name,
        rule: ruleSet.version,
        unknownPackages: [],
        depth: 0
      });

      expect(npmScores).toBeCalledWith({
        node: data.tree,
        packageMeta: data.meta.name,
        rule: ruleSet.npmScores,
        unknownPackages: [],
        depth: 0
      });
    });

    it('self score', async () => {
      license.mockReturnValue({ score: 1 });
      version.mockReturnValue({ score: 1 });
      npmScores.mockReturnValue({ score: 0.9 });

      const data = {
        meta: {
          name: { npmScores: { quality: 1, popularity: 1, maintenance: 1 } }
        },
        tree: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: []
        },
        unknownPackages: []
      };
      const ruleSet = { license: { license: 1 }, version: { version: 1 }, npmScores: { npmScores: 1 } };

      const res = await evaluate.handle(data, ruleSet);
      expect(res).toEqual({
        rootEvaluation: {
          nodeName: 'name',
          nodeVersion: 'version',
          evaluations: [ { score: 1 }, { score: 1 }, { score: 0.9 } ],
          nodeScore: 0.9,
          dependencies: []
        },
        qualification: Qualification.RECOMMENDED
      });

      expect(license).toBeCalledWith({
        node: data.tree,
        packageMeta: data.meta.name,
        rule: ruleSet.license,
        unknownPackages: [],
        depth: 0
      });

      expect(version).toBeCalledWith({
        node: data.tree,
        packageMeta: data.meta.name,
        rule: ruleSet.version,
        unknownPackages: [],
        depth: 0
      });

      expect(npmScores).toBeCalledWith({
        node: data.tree,
        packageMeta: data.meta.name,
        rule: ruleSet.npmScores,
        unknownPackages: [],
        depth: 0
      });
    });

    it('accepted', async () => {
      license.mockReturnValue({ score: 0.5 });
      version.mockReturnValue({ score: 0.5 });
      npmScores.mockReturnValue({ score: 0.5 });

      const data = {
        meta: {
          name: { npmScores: { quality: 1, popularity: 1, maintenance: 1 } }
        },
        tree: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: []
        },
        unknownPackages: []
      };
      const ruleSet = { license: { license: 1 }, version: { version: 1 }, npmScores: { npmScores: 1 } };

      const res = await evaluate.handle(data, ruleSet);
      expect(res).toEqual({
        rootEvaluation: {
          nodeName: 'name',
          nodeVersion: 'version',
          evaluations: [ { score: 0.5 }, { score: 0.5 }, { score: 0.5 } ],
          nodeScore: 0.125,
          dependencies: []
        },
        qualification: Qualification.ACCEPTED
      });

      expect(license).toBeCalledWith({
        node: data.tree,
        packageMeta: data.meta.name,
        rule: ruleSet.license,
        unknownPackages: [],
        depth: 0
      });

      expect(version).toBeCalledWith({
        node: data.tree,
        packageMeta: data.meta.name,
        rule: ruleSet.version,
        unknownPackages: [],
        depth: 0
      });

      expect(npmScores).toBeCalledWith({
        node: data.tree,
        packageMeta: data.meta.name,
        rule: ruleSet.npmScores,
        unknownPackages: [],
        depth: 0
      });
    });

    it('rejected', async () => {
      license.mockReturnValue({ score: 1 });
      version.mockReturnValue({ score: 1 });
      npmScores.mockReturnValue({ score: 0 });

      const data = {
        meta: {
          name: { npmScores: { quality: 1, popularity: 1, maintenance: 1 } }
        },
        tree: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: []
        },
        unknownPackages: []
      };
      const ruleSet = { license: { license: 1 }, version: { version: 1 }, npmScores: { npmScores: 1 } };

      const res = await evaluate.handle(data, ruleSet);
      expect(res).toEqual({
        rootEvaluation: {
          nodeName: 'name',
          nodeVersion: 'version',
          evaluations: [ { score: 1 }, { score: 1 }, { score: 0 } ],
          nodeScore: 0,
          dependencies: []
        },
        qualification: Qualification.REJECTED
      });

      expect(license).toBeCalledWith({
        node: data.tree,
        packageMeta: data.meta.name,
        rule: ruleSet.license,
        unknownPackages: [],
        depth: 0
      });

      expect(version).toBeCalledWith({
        node: data.tree,
        packageMeta: data.meta.name,
        rule: ruleSet.version,
        unknownPackages: [],
        depth: 0
      });

      expect(npmScores).toBeCalledWith({
        node: data.tree,
        packageMeta: data.meta.name,
        rule: ruleSet.npmScores,
        unknownPackages: [],
        depth: 0
      });
    });

    it('evaluation with dependencies', async () => {
      license.mockReturnValue({ score: 1 });
      version.mockReturnValue({ score: 1 });
      npmScores.mockReturnValue({ score: 1 });

      const data = {
        meta: {
          name: { npmScores: { props: 1 } },
          name0: { npmScores: { props: 2 } },
          name1: { npmScores: { props: 3 } }
        },
        tree: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: [
            {
              name: 'name0',
              version: 'version0',
              license: undefined,
              dependencies: []
            },
            {
              name: 'name1',
              version: 'version1',
              license: undefined,
              dependencies: []
            }
          ]
        },
        unknownPackages: []
      };
      const ruleSet = { license: { license: 1 }, version: { version: 1 }, npmScores: { npmScores: 1 } };

      const res = await evaluate.handle(data, ruleSet);
      expect(res).toEqual({
        rootEvaluation: {
          nodeName: 'name',
          nodeVersion: 'version',
          evaluations: [ { score: 1 }, { score: 1 }, { score: 1 } ],
          nodeScore: 1,
          dependencies: [
            {
              nodeName: 'name0',
              nodeVersion: 'version0',
              evaluations: [ { score: 1 }, { score: 1 }, { score: 1 } ],
              nodeScore: 1,
              dependencies: []
            },
            {
              nodeName: 'name1',
              nodeVersion: 'version1',
              evaluations: [ { score: 1 }, { score: 1 }, { score: 1 } ],
              nodeScore: 1,
              dependencies: []
            }
          ]
        },
        qualification: Qualification.RECOMMENDED
      });

      expect(license.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[1],
            packageMeta: data.meta.name1,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 1
          }
        ]
      ]);

      expect(version.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[1],
            packageMeta: data.meta.name1,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 1
          }
        ]
      ]);

      expect(npmScores.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[1],
            packageMeta: data.meta.name1,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 1
          }
        ]
      ]);
    });

    it('deep recommended', async () => {
      license.mockReturnValue({ score: 1 });
      license.mockReturnValueOnce({ score: 1 });
      license.mockReturnValueOnce({ score: 1 });
      license.mockReturnValueOnce({ score: 0.36 });
      version.mockReturnValue({ score: 1 });
      npmScores.mockReturnValue({ score: 1 });

      const data = {
        meta: {
          name: { npmScores: { props: 1 } },
          name0: { npmScores: { props: 2 } },
          name1: { npmScores: { props: 3 } }
        },
        tree: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: [
            {
              name: 'name0',
              version: 'version0',
              license: undefined,
              dependencies: []
            },
            {
              name: 'name1',
              version: 'version1',
              license: undefined,
              dependencies: []
            }
          ]
        },
        unknownPackages: []
      };
      const ruleSet = { license: { license: 1 }, version: { version: 1 }, npmScores: { npmScores: 1 } };

      const res = await evaluate.handle(data, ruleSet);
      expect(res).toEqual({
        rootEvaluation: {
          nodeName: 'name',
          nodeVersion: 'version',
          evaluations: [ { score: 1 }, { score: 1 }, { score: 1 } ],
          nodeScore: 0.6,
          dependencies: [
            {
              nodeName: 'name0',
              nodeVersion: 'version0',
              evaluations: [ { score: 1 }, { score: 1 }, { score: 1 } ],
              nodeScore: 1,
              dependencies: []
            },
            {
              nodeName: 'name1',
              nodeVersion: 'version1',
              evaluations: [ { score: 0.36 }, { score: 1 }, { score: 1 } ],
              nodeScore: 0.36,
              dependencies: []
            }
          ]
        },
        qualification: Qualification.RECOMMENDED
      });

      expect(license.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[1],
            packageMeta: data.meta.name1,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 1
          }
        ]
      ]);

      expect(version.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[1],
            packageMeta: data.meta.name1,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 1
          }
        ]
      ]);

      expect(npmScores.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[1],
            packageMeta: data.meta.name1,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 1
          }
        ]
      ]);
    });

    it('deep accepted', async () => {
      license.mockReturnValue({ score: 1 });
      license.mockReturnValueOnce({ score: 1 });
      license.mockReturnValueOnce({ score: 1 });
      license.mockReturnValueOnce({ score: 0.16 });
      version.mockReturnValue({ score: 1 });
      npmScores.mockReturnValue({ score: 1 });

      const data = {
        meta: {
          name: { npmScores: { props: 1 } },
          name0: { npmScores: { props: 2 } },
          name1: { npmScores: { props: 3 } }
        },
        tree: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: [
            {
              name: 'name0',
              version: 'version0',
              license: undefined,
              dependencies: []
            },
            {
              name: 'name1',
              version: 'version1',
              license: undefined,
              dependencies: []
            }
          ]
        },
        unknownPackages: []
      };
      const ruleSet = { license: { license: 1 }, version: { version: 1 }, npmScores: { npmScores: 1 } };

      const res = await evaluate.handle(data, ruleSet);
      expect(res).toEqual({
        rootEvaluation: {
          nodeName: 'name',
          nodeVersion: 'version',
          evaluations: [ { score: 1 }, { score: 1 }, { score: 1 } ],
          nodeScore: 0.4,
          dependencies: [
            {
              nodeName: 'name0',
              nodeVersion: 'version0',
              evaluations: [ { score: 1 }, { score: 1 }, { score: 1 } ],
              nodeScore: 1,
              dependencies: []
            },
            {
              nodeName: 'name1',
              nodeVersion: 'version1',
              evaluations: [ { score: 0.16 }, { score: 1 }, { score: 1 } ],
              nodeScore: 0.16,
              dependencies: []
            }
          ]
        },
        qualification: Qualification.ACCEPTED
      });

      expect(license.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[1],
            packageMeta: data.meta.name1,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 1
          }
        ]
      ]);

      expect(version.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[1],
            packageMeta: data.meta.name1,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 1
          }
        ]
      ]);

      expect(npmScores.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[1],
            packageMeta: data.meta.name1,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 1
          }
        ]
      ]);
    });

    it('deep rejected', async () => {
      license.mockReturnValue({ score: 1 });
      license.mockReturnValueOnce({ score: 1 });
      license.mockReturnValueOnce({ score: 1 });
      license.mockReturnValueOnce({ score: 0 });
      version.mockReturnValue({ score: 1 });
      npmScores.mockReturnValue({ score: 1 });

      const data = {
        meta: {
          name: { npmScores: { props: 1 } },
          name0: { npmScores: { props: 2 } },
          name1: { npmScores: { props: 3 } }
        },
        tree: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: [
            {
              name: 'name0',
              version: 'version0',
              license: undefined,
              dependencies: []
            },
            {
              name: 'name1',
              version: 'version1',
              license: undefined,
              dependencies: []
            }
          ]
        },
        unknownPackages: []
      };
      const ruleSet = { license: { license: 1 }, version: { version: 1 }, npmScores: { npmScores: 1 } };

      const res = await evaluate.handle(data, ruleSet);
      expect(res).toEqual({
        rootEvaluation: {
          nodeName: 'name',
          nodeVersion: 'version',
          evaluations: [ { score: 1 }, { score: 1 }, { score: 1 } ],
          nodeScore: 0,
          dependencies: [
            {
              nodeName: 'name0',
              nodeVersion: 'version0',
              evaluations: [ { score: 1 }, { score: 1 }, { score: 1 } ],
              nodeScore: 1,
              dependencies: []
            },
            {
              nodeName: 'name1',
              nodeVersion: 'version1',
              evaluations: [ { score: 0 }, { score: 1 }, { score: 1 } ],
              nodeScore: 0,
              dependencies: []
            }
          ]
        },
        qualification: Qualification.REJECTED
      });

      expect(license.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[1],
            packageMeta: data.meta.name1,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 1
          }
        ]
      ]);

      expect(version.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[1],
            packageMeta: data.meta.name1,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 1
          }
        ]
      ]);

      expect(npmScores.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[1],
            packageMeta: data.meta.name1,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 1
          }
        ]
      ]);
    });

    it('accepted - deep recommended', async () => {
      license.mockReturnValue({ score: 1 });
      license.mockReturnValueOnce({ score: 0.4 });
      version.mockReturnValue({ score: 1 });
      npmScores.mockReturnValue({ score: 1 });

      const data = {
        meta: {
          name: { npmScores: { props: 1 } },
          name0: { npmScores: { props: 2 } },
          name1: { npmScores: { props: 3 } }
        },
        tree: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: [
            {
              name: 'name0',
              version: 'version0',
              license: undefined,
              dependencies: []
            },
            {
              name: 'name1',
              version: 'version1',
              license: undefined,
              dependencies: []
            }
          ]
        },
        unknownPackages: []
      };
      const ruleSet = { license: { license: 1 }, version: { version: 1 }, npmScores: { npmScores: 1 } };

      const res = await evaluate.handle(data, ruleSet);
      expect(res).toEqual({
        rootEvaluation: {
          nodeName: 'name',
          nodeVersion: 'version',
          evaluations: [ { score: 0.4 }, { score: 1 }, { score: 1 } ],
          nodeScore: 0.4,
          dependencies: [
            {
              nodeName: 'name0',
              nodeVersion: 'version0',
              evaluations: [ { score: 1 }, { score: 1 }, { score: 1 } ],
              nodeScore: 1,
              dependencies: []
            },
            {
              nodeName: 'name1',
              nodeVersion: 'version1',
              evaluations: [ { score: 1 }, { score: 1 }, { score: 1 } ],
              nodeScore: 1,
              dependencies: []
            }
          ]
        },
        qualification: Qualification.ACCEPTED
      });

      expect(license.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[1],
            packageMeta: data.meta.name1,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 1
          }
        ]
      ]);

      expect(version.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[1],
            packageMeta: data.meta.name1,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 1
          }
        ]
      ]);

      expect(npmScores.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[1],
            packageMeta: data.meta.name1,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 1
          }
        ]
      ]);
    });

    it('deep accepted - depth 2', async () => {
      license.mockReturnValue({ score: 1 });
      license.mockReturnValueOnce({ score: 1 });
      license.mockReturnValueOnce({ score: 1 });
      license.mockReturnValueOnce({ score: 0.0256 });
      version.mockReturnValue({ score: 1 });
      npmScores.mockReturnValue({ score: 1 });

      const data = {
        meta: {
          name: { npmScores: { props: 1 } },
          name0: { npmScores: { props: 2 } },
          name00: { npmScores: { props: 3 } }
        },
        tree: {
          name: 'name',
          version: 'version',
          license: undefined,
          dependencies: [
            {
              name: 'name0',
              version: 'version0',
              license: undefined,
              dependencies: [
                {
                  name: 'name00',
                  version: 'version00',
                  license: undefined,
                  dependencies: []
                }
              ]
            }
          ]
        },
        unknownPackages: []
      };
      const ruleSet = { license: { license: 1 }, version: { version: 1 }, npmScores: { npmScores: 1 } };

      const res = await evaluate.handle(data, ruleSet);
      expect(res).toEqual({
        rootEvaluation: {
          nodeName: 'name',
          nodeVersion: 'version',
          evaluations: [ { score: 1 }, { score: 1 }, { score: 1 } ],
          nodeScore: 0.4,
          dependencies: [
            {
              nodeName: 'name0',
              nodeVersion: 'version0',
              evaluations: [ { score: 1 }, { score: 1 }, { score: 1 } ],
              nodeScore: 0.16,
              dependencies: [
                {
                  nodeName: 'name00',
                  nodeVersion: 'version00',
                  evaluations: [ { score: 0.0256 }, { score: 1 }, { score: 1 } ],
                  nodeScore: 0.0256,
                  dependencies: []
                }
              ]
            }
          ]
        },
        qualification: Qualification.ACCEPTED
      });

      expect(license.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[0].dependencies[0],
            packageMeta: data.meta.name00,
            rule: ruleSet.license,
            unknownPackages: [],
            depth: 2
          }
        ]
      ]);

      expect(version.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[0].dependencies[0],
            packageMeta: data.meta.name00,
            rule: ruleSet.version,
            unknownPackages: [],
            depth: 2
          }
        ]
      ]);

      expect(npmScores.mock.calls).toEqual([
        [
          {
            node: data.tree,
            packageMeta: data.meta.name,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 0
          }
        ],
        [
          {
            node: data.tree.dependencies[0],
            packageMeta: data.meta.name0,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 1
          }
        ],
        [
          {
            node: data.tree.dependencies[0].dependencies[0],
            packageMeta: data.meta.name00,
            rule: ruleSet.npmScores,
            unknownPackages: [],
            depth: 2
          }
        ]
      ]);
    });
  });

  describe('GetNpmInfo', () => {
    let getNpmInfo: any = null;
    beforeAll(() => {
      getNpmInfo = container.resolve(GetNpmInfo);
    });

    beforeEach(() => {
      request.mockClear();
    });

    it('no params', async () => {
      try {
        const res = await getNpmInfo.handle(undefined, undefined);
        expect(false).toEqual(true);
      } catch (e) {
        expect(true).toEqual(true);
      }
    });

    it('request error', async () => {
      const mockResult = {};
      request.mockReturnValue(Promise.reject(mockResult));

      try {
        const res = await getNpmInfo.handle('name');
        expect(false).toEqual(true);
      } catch (e) {
        expect(e.message).toEqual("'name' npm package not exists");
      }
    });

    it('missing package', async () => {
      const mockResult = {};
      request.mockReturnValue(Promise.resolve(mockResult));

      try {
        const res = await getNpmInfo.handle('name');
        expect(false).toEqual(true);
      } catch (e) {
        expect(e.message).toEqual("'name' npm package not exists");
      }
    });

    it('missing package version', async () => {
      const mockResult = {
        name: 'name',
        'dist-tags': { latest: 'latestVersion' },
        versions: { latestVersion: { versionData: 1 } }
      };
      request.mockReturnValue(Promise.resolve(mockResult));

      try {
        const res = await getNpmInfo.handle('name', 'someVersion');
        expect(false).toEqual(true);
      } catch (e) {
        expect(e.message).toEqual("'someVersion' version not exists for package 'name'");
      }
    });

    it('name', async () => {
      const mockResult = {
        name: 'name',
        'dist-tags': { latest: 'latestVersion' },
        versions: { latestVersion: { versionData: 1 } }
      };
      request.mockReturnValue(Promise.resolve(mockResult));

      const res = await getNpmInfo.handle('name');
      expect(res).toEqual({
        name: 'name',
        version: 'latestVersion',
        latestVersion: 'latestVersion',
        versionJSON: { versionData: 1 },
        raw: mockResult
      });
    });

    it('name changed registry', async () => {
      const npm_registry_url = 'customUrl'
      expect(process.env.NPM_REGISTRY_URL).toEqual(undefined)
      process.env.NPM_REGISTRY_URL = npm_registry_url

      const mockResult = {
        name: 'name',
        'dist-tags': { latest: 'latestVersion' },
        versions: { latestVersion: { versionData: 1 } }
      };
      request.mockReturnValue(Promise.resolve(mockResult));

      const res = await getNpmInfo.handle('name');
      expect(res).toEqual({
        name: 'name',
        version: 'latestVersion',
        latestVersion: 'latestVersion',
        versionJSON: { versionData: 1 },
        raw: mockResult
      });
      expect(request).lastCalledWith({
        uri: 'customUrl/name',
        json: true
      })

      delete process.env.NPM_REGISTRY_URL
      expect(process.env.NPM_REGISTRY_URL).toEqual(undefined)
    });

    it('name@version', async () => {
      const mockResult = {
        name: 'name',
        'dist-tags': { latest: 'latestVersion' },
        versions: { latestVersion: { versionData: 1 } }
      };
      request.mockReturnValue(Promise.resolve(mockResult));

      const res = await getNpmInfo.handle('name', 'latestVersion');
      expect(res).toEqual({
        name: 'name',
        version: 'latestVersion',
        latestVersion: 'latestVersion',
        versionJSON: { versionData: 1 },
        raw: mockResult
      });
    });

    it('name@notLatestVersion', async () => {
      const mockResult = {
        name: 'name',
        'dist-tags': { latest: 'latestVersion' },
        versions: { latestVersion: { versionData: 1 }, notLatestVersion: { versionData: 2 } }
      };
      request.mockReturnValue(Promise.resolve(mockResult));

      const res = await getNpmInfo.handle('name', 'notLatestVersion');
      expect(res).toEqual({
        name: 'name',
        version: 'notLatestVersion',
        latestVersion: 'latestVersion',
        versionJSON: { versionData: 2 },
        raw: mockResult
      });
    });

    it('@scope/name', async () => {
      const mockResult = {
        name: '@scope/name',
        'dist-tags': { latest: 'latestVersion' },
        versions: { latestVersion: { versionData: 1 } }
      };
      request.mockReturnValue(Promise.resolve(mockResult));

      const res = await getNpmInfo.handle('@scope/name');
      expect(res).toEqual({
        name: '@scope/name',
        version: 'latestVersion',
        latestVersion: 'latestVersion',
        versionJSON: { versionData: 1 },
        raw: mockResult
      });

      expect(request).lastCalledWith({
        uri: 'https://registry.npmjs.org/@scope%2Fname',
        json: true
      });
    });
  });

  describe('ValidationStart', () => {
    let validationStart: ValidationStart = null;
    beforeAll(() => {
      validationStart = container.resolve(ValidationStart);
    });

    it('no params', async () => {
      try {
        const res = await validationStart.handle(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined
        );
        expect(false).toEqual(true);
      } catch (e) {
        expect(true).toEqual(true);
      }
    });

    it('has evaluationInfo with result', async () => {
      const evaluationInfo: any = { result: {} };

      const packageInfoFromResult: any = {
        packageInfo: {
          _id: '321',
          packageName: 'asd',
          isProduction: true,
          state: {
            type: StateType.SUCCEEDED
          }
        },
        created: false
      };
      const evaluationsApi: any = {
        fromRuleSet(params) {
          const { packageInfoId, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSet' ]);
          expect(packageInfoId).toEqual('321');
          expect(ruleSet).toEqual(null);

          return evaluationInfo;
        }
      };

      const isExpiredResult: any = async params => {
        const { packageInfo, update, force } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfo', 'update', 'force' ]);
        expect(packageInfo).toEqual(packageInfoFromResult.packageInfo);
        expect(update).toEqual(true);
        expect(force).toEqual(false);

        return false;
      };

      const res = await validationStart.handle(
        false,
        null,
        packageInfoFromResult,
        undefined,
        undefined,
        undefined,
        undefined,
        evaluationsApi,
        isExpiredResult,
        undefined
      );
      expect(res).toEqual(evaluationInfo);
    });

    it('has evaluationInfo without result', async () => {
      const evaluationInfo: any = {};

      const packageInfoFromResult: any = {
        packageInfo: {
          _id: '321',
          packageName: 'asd',
          isProduction: true,
          state: {
            type: StateType.SUCCEEDED
          },
          meta: { meta: 1 }
        },
        created: false
      };
      const evaluationsApi: any = {
        fromRuleSet(params) {
          const { packageInfoId, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSet' ]);
          expect(packageInfoId).toEqual('321');
          expect(ruleSet).toEqual(null);

          return evaluationInfo;
        },
        evaluate(params) {
          const { evaluationInfo, data } = params;
          expect(Object.keys(params)).toEqual([ 'evaluationInfo', 'data' ]);
          expect(evaluationInfo).toEqual(evaluationInfo);
          expect(data).toEqual({ meta: 1 });
        }
      };

      const isExpiredResult: any = async params => {
        const { packageInfo, update, force } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfo', 'update', 'force' ]);
        expect(packageInfo).toEqual(packageInfoFromResult.packageInfo);
        expect(update).toEqual(true);
        expect(force).toEqual(false);

        return false;
      };

      const res = await validationStart.handle(
        false,
        null,
        packageInfoFromResult,
        undefined,
        undefined,
        undefined,
        undefined,
        evaluationsApi,
        isExpiredResult,
        undefined
      );
      expect(res).toEqual(evaluationInfo);
    });

    it('created packageInfo', async () => {
      const evaluationInfo: any = { _id: '1' };

      const packageInfoFromResult: any = {
        packageInfo: {
          _id: '321',
          packageName: 'asd',
          isProduction: true,
          state: {
            type: StateType.PENDING
          }
        },
        created: true
      };
      const evaluationsApi: any = {
        fromRuleSet(params) {
          const { packageInfoId, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSet' ]);
          expect(packageInfoId).toEqual('321');
          expect(ruleSet).toEqual(null);

          return null;
        },
        create(params) {
          const { packageInfoId, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSet' ]);
          expect(packageInfoId).toEqual('321');
          expect(ruleSet).toEqual(null);

          return evaluationInfo;
        }
      };

      const isExpiredResult: any = async params => {
        const { packageInfo, update, force } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfo', 'update', 'force' ]);
        expect(packageInfo).toEqual(packageInfoFromResult.packageInfo);
        expect(update).toEqual(true);
        expect(force).toEqual(false);

        return false;
      };

      const startPackageValidation: any = async params => {
        const { packageName, packageJSON, packageLock, yarnLock, cid, isProduction } = params;
        expect(Object.keys(params)).toEqual([
          'packageName',
          'packageJSON',
          'packageLock',
          'yarnLock',
          'cid',
          'isProduction'
        ]);
        expect(packageName).toEqual(packageInfoFromResult.packageInfo.packageName);
        expect(packageJSON).toEqual(undefined);
        expect(packageLock).toEqual(undefined);
        expect(yarnLock).toEqual(undefined);
        expect(cid).toEqual(evaluationInfo._id);
        expect(isProduction).toEqual(packageInfoFromResult.packageInfo.isProduction);
      };

      const res = await validationStart.handle(
        false,
        null,
        packageInfoFromResult,
        undefined,
        undefined,
        undefined,
        undefined,
        evaluationsApi,
        isExpiredResult,
        startPackageValidation
      );
      expect(res).toEqual(evaluationInfo);
    });

    it('created packageInfo with force', async () => {
      const evaluationInfo: any = { _id: '1' };

      const packageInfoFromResult: any = {
        packageInfo: {
          _id: '321',
          packageName: 'asd',
          isProduction: true,
          state: {
            type: StateType.PENDING
          }
        },
        created: true
      };
      const evaluationsApi: any = {
        fromRuleSet(params) {
          const { packageInfoId, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSet' ]);
          expect(packageInfoId).toEqual('321');
          expect(ruleSet).toEqual(null);

          return null;
        },
        create(params) {
          const { packageInfoId, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSet' ]);
          expect(packageInfoId).toEqual('321');
          expect(ruleSet).toEqual(null);

          return evaluationInfo;
        }
      };

      const isExpiredResult: any = async params => {
        const { packageInfo, update, force } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfo', 'update', 'force' ]);
        expect(packageInfo).toEqual(packageInfoFromResult.packageInfo);
        expect(update).toEqual(true);
        expect(force).toEqual(false);

        return false;
      };

      const startPackageValidation: any = async params => {
        const { packageName, packageJSON, packageLock, yarnLock, cid, isProduction } = params;
        expect(Object.keys(params)).toEqual([
          'packageName',
          'packageJSON',
          'packageLock',
          'yarnLock',
          'cid',
          'isProduction'
        ]);
        expect(packageName).toEqual(packageInfoFromResult.packageInfo.packageName);
        expect(packageJSON).toEqual(undefined);
        expect(packageLock).toEqual(undefined);
        expect(yarnLock).toEqual(undefined);
        expect(cid).toEqual(evaluationInfo._id);
        expect(isProduction).toEqual(packageInfoFromResult.packageInfo.isProduction);
      };

      const res = await validationStart.handle(
        true,
        null,
        packageInfoFromResult,
        undefined,
        undefined,
        undefined,
        undefined,
        evaluationsApi,
        isExpiredResult,
        startPackageValidation
      );
      expect(res).toEqual(evaluationInfo);
    });

    it('packageJSON', async () => {
      const evaluationInfo: any = { _id: '1' };

      const packageInfoFromResult: any = {
        packageInfo: {
          _id: '321',
          packageName: 'asd',
          isProduction: true,
          state: {
            type: StateType.PENDING
          }
        },
        created: true
      };
      const evaluationsApi: any = {
        fromRuleSet(params) {
          const { packageInfoId, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSet' ]);
          expect(packageInfoId).toEqual('321');
          expect(ruleSet).toEqual(null);

          return null;
        },
        create(params) {
          const { packageInfoId, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSet' ]);
          expect(packageInfoId).toEqual('321');
          expect(ruleSet).toEqual(null);

          return evaluationInfo;
        }
      };

      const isExpiredResult: any = async params => {
        const { packageInfo, update, force } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfo', 'update', 'force' ]);
        expect(packageInfo).toEqual(packageInfoFromResult.packageInfo);
        expect(update).toEqual(true);
        expect(force).toEqual(false);

        return false;
      };

      const startPackageValidation: any = async params => {
        const { packageName, packageJSON, packageLock, yarnLock, cid, isProduction } = params;
        expect(Object.keys(params)).toEqual([
          'packageName',
          'packageJSON',
          'packageLock',
          'yarnLock',
          'cid',
          'isProduction'
        ]);
        expect(packageName).toEqual(packageInfoFromResult.packageInfo.packageName);
        expect(packageJSON).toEqual('packageJSONContent');
        expect(packageLock).toEqual(undefined);
        expect(yarnLock).toEqual(undefined);
        expect(cid).toEqual(evaluationInfo._id);
        expect(isProduction).toEqual(packageInfoFromResult.packageInfo.isProduction);
      };

      const res = await validationStart.handle(
        false,
        null,
        packageInfoFromResult,
        'packageJSONContent',
        undefined,
        undefined,
        undefined,
        evaluationsApi,
        isExpiredResult,
        startPackageValidation
      );
      expect(res).toEqual(evaluationInfo);
    });

    it('packageLock', async () => {
      const evaluationInfo: any = { _id: '1' };

      const packageInfoFromResult: any = {
        packageInfo: {
          _id: '321',
          packageName: 'asd',
          isProduction: true,
          state: {
            type: StateType.PENDING
          }
        },
        created: true
      };
      const evaluationsApi: any = {
        fromRuleSet(params) {
          const { packageInfoId, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSet' ]);
          expect(packageInfoId).toEqual('321');
          expect(ruleSet).toEqual(null);

          return null;
        },
        create(params) {
          const { packageInfoId, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSet' ]);
          expect(packageInfoId).toEqual('321');
          expect(ruleSet).toEqual(null);

          return evaluationInfo;
        }
      };

      const isExpiredResult: any = async params => {
        const { packageInfo, update, force } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfo', 'update', 'force' ]);
        expect(packageInfo).toEqual(packageInfoFromResult.packageInfo);
        expect(update).toEqual(true);
        expect(force).toEqual(false);

        return false;
      };

      const startPackageValidation: any = async params => {
        const { packageName, packageJSON, packageLock, yarnLock, cid, isProduction } = params;
        expect(Object.keys(params)).toEqual([
          'packageName',
          'packageJSON',
          'packageLock',
          'yarnLock',
          'cid',
          'isProduction'
        ]);
        expect(packageName).toEqual(packageInfoFromResult.packageInfo.packageName);
        expect(packageJSON).toEqual('packageJSONContent');
        expect(packageLock).toEqual('packageLockContent');
        expect(yarnLock).toEqual(undefined);
        expect(cid).toEqual(evaluationInfo._id);
        expect(isProduction).toEqual(packageInfoFromResult.packageInfo.isProduction);
      };

      const res = await validationStart.handle(
        false,
        null,
        packageInfoFromResult,
        'packageJSONContent',
        'packageLockContent',
        undefined,
        undefined,
        evaluationsApi,
        isExpiredResult,
        startPackageValidation
      );
      expect(res).toEqual(evaluationInfo);
    });

    it('yarnLock', async () => {
      const evaluationInfo: any = { _id: '1' };

      const packageInfoFromResult: any = {
        packageInfo: {
          _id: '321',
          packageName: 'asd',
          isProduction: true,
          state: {
            type: StateType.PENDING
          }
        },
        created: true
      };
      const evaluationsApi: any = {
        fromRuleSet(params) {
          const { packageInfoId, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSet' ]);
          expect(packageInfoId).toEqual('321');
          expect(ruleSet).toEqual(null);

          return null;
        },
        create(params) {
          const { packageInfoId, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSet' ]);
          expect(packageInfoId).toEqual('321');
          expect(ruleSet).toEqual(null);

          return evaluationInfo;
        }
      };

      const isExpiredResult: any = async params => {
        const { packageInfo, update, force } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfo', 'update', 'force' ]);
        expect(packageInfo).toEqual(packageInfoFromResult.packageInfo);
        expect(update).toEqual(true);
        expect(force).toEqual(false);

        return false;
      };

      const startPackageValidation: any = async params => {
        const { packageName, packageJSON, packageLock, yarnLock, cid, isProduction } = params;
        expect(Object.keys(params)).toEqual([
          'packageName',
          'packageJSON',
          'packageLock',
          'yarnLock',
          'cid',
          'isProduction'
        ]);
        expect(packageName).toEqual(packageInfoFromResult.packageInfo.packageName);
        expect(packageJSON).toEqual('packageJSONContent');
        expect(packageLock).toEqual(undefined);
        expect(yarnLock).toEqual('yarnLockContent');
        expect(cid).toEqual(evaluationInfo._id);
        expect(isProduction).toEqual(packageInfoFromResult.packageInfo.isProduction);
      };

      const res = await validationStart.handle(
        false,
        null,
        packageInfoFromResult,
        'packageJSONContent',
        undefined,
        'yarnLockContent',
        undefined,
        evaluationsApi,
        isExpiredResult,
        startPackageValidation
      );
      expect(res).toEqual(evaluationInfo);
    });

    it('expired', async () => {
      const evaluationInfo: any = { _id: '1' };

      const packageInfoFromResult: any = {
        packageInfo: {
          _id: '321',
          packageName: 'asd',
          isProduction: true,
          state: {
            type: StateType.SUCCEEDED
          }
        },
        created: false
      };

      const packageInfoNew = {
        _id: '321',
        packageName: 'qwe',
        isProduction: true,
        state: {
          type: StateType.PENDING
        }
      };

      const evaluationsApi: any = {
        fromRuleSet(params) {
          const { packageInfoId, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSet' ]);
          expect(packageInfoId).toEqual('321');
          expect(ruleSet).toEqual(null);

          return null;
        },
        create(params) {
          const { packageInfoId, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSet' ]);
          expect(packageInfoId).toEqual('321');
          expect(ruleSet).toEqual(null);

          return evaluationInfo;
        }
      };

      const isExpiredResult: any = async params => {
        const { packageInfo, update, force } = params;
        expect(Object.keys(params)).toEqual([ 'packageInfo', 'update', 'force' ]);
        expect(packageInfo).toEqual(packageInfoFromResult.packageInfo);
        expect(update).toEqual(true);
        expect(force).toEqual(false);

        return true;
      };

      const startPackageValidation: any = async params => {
        const { packageName, packageJSON, packageLock, yarnLock, cid, isProduction } = params;
        expect(Object.keys(params)).toEqual([
          'packageName',
          'packageJSON',
          'packageLock',
          'yarnLock',
          'cid',
          'isProduction'
        ]);
        expect(packageName).toEqual(packageInfoNew.packageName);
        expect(packageJSON).toEqual(undefined);
        expect(packageLock).toEqual(undefined);
        expect(yarnLock).toEqual(undefined);
        expect(cid).toEqual(evaluationInfo._id);
        expect(isProduction).toEqual(packageInfoNew.isProduction);
      };

      const packageInfoApi: any = {
        async create(pi) {
          expect(pi).toEqual(packageInfoFromResult.packageInfo);

          return packageInfoNew;
        }
      };

      const res = await validationStart.handle(
        false,
        null,
        packageInfoFromResult,
        undefined,
        undefined,
        undefined,
        packageInfoApi,
        evaluationsApi,
        isExpiredResult,
        startPackageValidation
      );
      expect(res).toEqual(evaluationInfo);
    });
  });

  describe('AssertQueue', () => {
    let assertQueue: AssertQueue = null;
    beforeAll(() => {
      assertQueue = container.resolve(AssertQueue);
    });

    beforeEach(() => {
      request.mockClear();
    });

    it('no params', async () => {
      try {
        const res = await assertQueue.handle(undefined, undefined);
        expect(false).toEqual(true);
      } catch (e) {
        expect(true).toEqual(true);
      }
    });

    it('assert queue', async () => {
      request.mockReturnValue(Promise.resolve());

      const kmsServiceUrl: any = {
        async getUrl() {
          return 'rabbitURL';
        }
      };

      const res = await assertQueue.handle('queue', kmsServiceUrl);
      expect(res).toEqual(undefined);
      expect(request).lastCalledWith({
        uri: 'rabbitURL/api/queues/%2F/queue',
        method: 'PUT',
        json: true,
        body: { vhost: '/', name: 'queue', durable: 'true', auto_delete: 'false', arguments: {} }
      });
    });

    it('assert queue http error', async () => {
      request.mockReturnValue(Promise.reject(new Error('assert error')));

      const kmsServiceUrl: any = {
        async getUrl() {
          return 'rabbitURL';
        }
      };

      try {
        const res = await assertQueue.handle('queue', kmsServiceUrl);
      } catch (e) {
        expect(e.message).toEqual('RabbitApiError');
      }

      expect(request).lastCalledWith({
        uri: 'rabbitURL/api/queues/%2F/queue',
        method: 'PUT',
        json: true,
        body: { vhost: '/', name: 'queue', durable: 'true', auto_delete: 'false', arguments: {} }
      });
    });
  });

  describe('PublishToQueue', () => {
    let publishToQueue: PublishToQueue = null;
    beforeAll(() => {
      publishToQueue = container.resolve(PublishToQueue);
    });

    beforeEach(() => {
      request.mockClear();
    });

    it('no params', async () => {
      try {
        const res = await publishToQueue.handle(undefined, undefined, undefined);
        expect(false).toEqual(true);
      } catch (e) {
        expect(true).toEqual(true);
      }
    });

    it('assert queue', async () => {
      request.mockReturnValue(Promise.resolve({ routed: true }));

      const kmsServiceUrl: any = {
        async getUrl() {
          return 'rabbitURL';
        }
      };

      const res = await publishToQueue.handle('queue', 'payload', kmsServiceUrl);
      expect(res).toEqual(undefined);
      expect(request).lastCalledWith({
        uri: 'rabbitURL/api/exchanges/%2f/amq.default/publish',
        method: 'POST',
        json: true,
        body: {
          properties: {},
          routing_key: 'queue',
          payload: 'payload',
          payload_encoding: 'string'
        }
      });
    });

    it('assert queue http error', async () => {
      request.mockReturnValue(Promise.reject(new Error('http error')));

      const kmsServiceUrl: any = {
        async getUrl() {
          return 'rabbitURL';
        }
      };

      try {
        const res = await publishToQueue.handle('queue', 'payload', kmsServiceUrl);
      } catch (e) {
        expect(e.message).toEqual('RabbitApiError');
      }

      expect(request).lastCalledWith({
        uri: 'rabbitURL/api/exchanges/%2f/amq.default/publish',
        method: 'POST',
        json: true,
        body: {
          properties: {},
          routing_key: 'queue',
          payload: 'payload',
          payload_encoding: 'string'
        }
      });
    });

    it('assert queue not routed', async () => {
      request.mockReturnValue(Promise.resolve({ routed: false }));

      const kmsServiceUrl: any = {
        async getUrl() {
          return 'rabbitURL';
        }
      };

      try {
        const res = await publishToQueue.handle('queue', 'payload', kmsServiceUrl);
      } catch (e) {
        expect(e.message).toEqual('RabbitMessageToQueue');
      }

      expect(request).lastCalledWith({
        uri: 'rabbitURL/api/exchanges/%2f/amq.default/publish',
        method: 'POST',
        json: true,
        body: {
          properties: {},
          routing_key: 'queue',
          payload: 'payload',
          payload_encoding: 'string'
        }
      });
    });
  });
});
