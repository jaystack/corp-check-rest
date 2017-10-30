import 'jest';
jest.mock('hash-sum');
jest.mock('shortid');
const getHash = require('hash-sum');
const { generate } = require('shortid');

import { container } from 'functionly';
import { StateType } from '../src/types';

import { PackageInfoApi } from '../src/api/packageInfo';
import { EvaluationsApi } from '../src/api/evaluations';

describe('apis', () => {
  describe('PackageInfoApi', () => {
    it('setProgress', async () => {
      let counter = 0;
      const packageInfoCollection: any = {
        async updateOne(filter, update) {
          expect(filter).toEqual({
            _id: '123456789',
            'state.type': StateType.PENDING
          });

          expect(Object.keys(update)).toEqual([ '$set' ]);

          expect(update.$set['state.message']).toEqual('message');
          expect(typeof update.$set['state.date']).toEqual('number');
          expect(Math.abs(Date.now() - update.$set['state.date']) < 10).toEqual(true);

          counter++;

          return { result: 1 };
        }
      };

      const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

      const result = await packageInfoApi.setProgress({
        _id: '123456789',
        message: 'message'
      });
      expect(result).toEqual({ updated: { result: 1 } });
      expect(counter).toEqual(1);
    });

    it('updateState', async () => {
      let counter = 0;
      const packageInfoCollection: any = {
        async updateOne(filter, update) {
          const { _id } = filter;
          expect(Object.keys(filter)).toEqual([ '_id' ]);
          expect(_id).toEqual('123456789');

          expect(Object.keys(update)).toEqual([ '$set' ]);

          expect(update.$set.meta).toEqual({ metaValue: 1 });
          expect(update.$set.state.type).toEqual(StateType.SUCCEEDED);
          expect(typeof update.$set.state.date).toEqual('number');
          expect(Math.abs(Date.now() - update.$set.state.date) < 10).toEqual(true);

          counter++;

          return { result: 1 };
        }
      };

      const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

      const result = await packageInfoApi.updateState({
        _id: '123456789',
        type: StateType.SUCCEEDED,
        meta: { metaValue: 1 }
      });
      expect(result).toEqual({ updated: { result: 1 } });
      expect(counter).toEqual(1);
    });

    it('updateMany', async () => {
      let counter = 0;

      const filter = { filter: 1 };
      const update = { update: 2 };

      const packageInfoCollection: any = {
        async updateMany(_filter, _update) {
          expect(_filter).toEqual(filter);
          expect(_update).toEqual({ $set: update });

          counter++;

          return { result: 1 };
        }
      };

      const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

      const result = await packageInfoApi.updateMany(filter, update);
      expect(result).toEqual({ result: 1 });
      expect(counter).toEqual(1);
    });

    describe('get', () => {
      it('no result', async () => {
        let counter = 0;
        const packageInfoCollection: any = {
          async findOne(params) {
            const { hash, latest } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
            expect(hash).toEqual('123321');
            expect(latest).toEqual(true);
            counter++;

            return null;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.get({ hash: '123321' });
        expect(result).toEqual(null);
        expect(counter).toEqual(1);
      });

      it('failed result', async () => {
        let counter = 0;
        const packageInfo: any = {
          state: {
            type: StateType.FAILED
          }
        };

        const packageInfoCollection: any = {
          async findOne(params) {
            const { hash, latest } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
            expect(hash).toEqual('123321');
            expect(latest).toEqual(true);
            counter++;

            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.get({ hash: '123321' });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(1);
      });

      it('succeeded result', async () => {
        let counter = 0;
        const packageInfo: any = {
          state: {
            type: StateType.SUCCEEDED
          }
        };

        const packageInfoCollection: any = {
          async findOne(params) {
            const { hash, latest } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
            expect(hash).toEqual('123321');
            expect(latest).toEqual(true);
            counter++;

            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.get({ hash: '123321' });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(1);
      });

      it('pending result', async () => {
        let counter = 0;
        const packageInfo: any = {
          state: {
            type: StateType.PENDING
          },
          date: Date.now()
        };

        const packageInfoCollection: any = {
          async findOne(params) {
            const { hash, latest } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
            expect(hash).toEqual('123321');
            expect(latest).toEqual(true);
            counter++;

            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.get({ hash: '123321' });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(1);
      });

      it('pending result expired', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.FAILED
          },
          date: Date.now()
        };

        const packageInfoCollection: any = {
          async findOne(params) {
            counter++;
            if (counter === 1) {
              const { hash, latest } = params;
              expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
              expect(hash).toEqual('123321');
              expect(latest).toEqual(true);
              return {
                _id: '123456789',
                state: {
                  type: StateType.PENDING
                },
                date: 0
              };
            } else {
              const { _id } = params;
              expect(Object.keys(params)).toEqual([ '_id' ]);
              expect(_id).toEqual('123456789');
              return packageInfo;
            }
          },
          async updateOne(filter, update) {
            const { _id } = filter;
            expect(Object.keys(filter)).toEqual([ '_id' ]);
            expect(_id).toEqual('123456789');

            expect(Object.keys(update)).toEqual([ '$set' ]);

            expect(update.$set.meta).toEqual({ error: 'timeout' });
            expect(update.$set.state.type).toEqual(StateType.FAILED);
            expect(typeof update.$set.state.date).toEqual('number');
            expect(Math.abs(Date.now() - update.$set.state.date) < 10).toEqual(true);

            counter++;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.get({ hash: '123321' });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(3);
      });

      it('custom expiration expired', async () => {
        const minutes = 1;
        expect(process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES).toEqual(undefined);
        process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES = 1;

        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.FAILED
          },
          date: Date.now()
        };

        const packageInfoCollection: any = {
          async findOne(params) {
            counter++;
            if (counter === 1) {
              const { hash, latest } = params;
              expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
              expect(hash).toEqual('123321');
              expect(latest).toEqual(true);
              return {
                _id: '123456789',
                state: {
                  type: StateType.PENDING
                },
                date: Date.now() - 61 * 1000
              };
            } else {
              const { _id } = params;
              expect(Object.keys(params)).toEqual([ '_id' ]);
              expect(_id).toEqual('123456789');
              return packageInfo;
            }
          },
          async updateOne(filter, update) {
            const { _id } = filter;
            expect(Object.keys(filter)).toEqual([ '_id' ]);
            expect(_id).toEqual('123456789');

            expect(Object.keys(update)).toEqual([ '$set' ]);

            expect(update.$set.meta).toEqual({ error: 'timeout' });
            expect(update.$set.state.type).toEqual(StateType.FAILED);
            expect(typeof update.$set.state.date).toEqual('number');
            expect(Math.abs(Date.now() - update.$set.state.date) < 10).toEqual(true);

            counter++;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.get({ hash: '123321' });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(3);

        delete process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES;
        expect(process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES).toEqual(undefined);
      });

      it('custom expiration not expired', async () => {
        const minutes = 1;
        expect(process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES).toEqual(undefined);
        process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES = 1;

        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.PENDING
          },
          date: Date.now() - 59 * 1000
        };

        const packageInfoCollection: any = {
          async findOne(params) {
            counter++;
            const { hash, latest } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
            expect(hash).toEqual('123321');
            expect(latest).toEqual(true);
            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.get({ hash: '123321' });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(1);

        delete process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES;
        expect(process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES).toEqual(undefined);
      });
    });

    describe('getById', () => {
      it('no result', async () => {
        let counter = 0;
        const packageInfoCollection: any = {
          async findOne(params) {
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual('123456789');
            counter++;

            return null;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.getById({ _id: '123456789' });
        expect(result).toEqual(null);
        expect(counter).toEqual(1);
      });

      it('failed result', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.FAILED
          }
        };

        const packageInfoCollection: any = {
          async findOne(params) {
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual('123456789');
            counter++;

            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.getById({ _id: '123456789' });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(1);
      });

      it('succeeded result', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.SUCCEEDED
          }
        };

        const packageInfoCollection: any = {
          async findOne(params) {
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual('123456789');
            counter++;

            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.getById({ _id: '123456789' });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(1);
      });

      it('pending result', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.PENDING
          },
          date: Date.now()
        };

        const packageInfoCollection: any = {
          async findOne(params) {
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual('123456789');
            counter++;

            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.getById({ _id: '123456789' });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(1);
      });

      it('pending result expired', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.FAILED
          },
          date: Date.now()
        };

        const packageInfoCollection: any = {
          async findOne(params) {
            counter++;
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual('123456789');
            if (counter === 1) {
              return {
                _id: '123456789',
                state: {
                  type: StateType.PENDING
                },
                date: 0
              };
            } else {
              return packageInfo;
            }
          },
          async updateOne(filter, update) {
            const { _id } = filter;
            expect(Object.keys(filter)).toEqual([ '_id' ]);
            expect(_id).toEqual('123456789');

            expect(Object.keys(update)).toEqual([ '$set' ]);

            expect(update.$set.meta).toEqual({ error: 'timeout' });
            expect(update.$set.state.type).toEqual(StateType.FAILED);
            expect(typeof update.$set.state.date).toEqual('number');
            expect(Math.abs(Date.now() - update.$set.state.date) < 10).toEqual(true);

            counter++;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.getById({ _id: '123456789' });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(3);
      });

      it('custom expiration expired', async () => {
        const minutes = 1;
        expect(process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES).toEqual(undefined);
        process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES = 1;

        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.FAILED
          },
          date: Date.now()
        };

        const packageInfoCollection: any = {
          async findOne(params) {
            counter++;
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual('123456789');
            if (counter === 1) {
              return {
                _id: '123456789',
                state: {
                  type: StateType.PENDING
                },
                date: Date.now() - 61 * 1000
              };
            } else {
              return packageInfo;
            }
          },
          async updateOne(filter, update) {
            const { _id } = filter;
            expect(Object.keys(filter)).toEqual([ '_id' ]);
            expect(_id).toEqual('123456789');

            expect(Object.keys(update)).toEqual([ '$set' ]);

            expect(update.$set.meta).toEqual({ error: 'timeout' });
            expect(update.$set.state.type).toEqual(StateType.FAILED);
            expect(typeof update.$set.state.date).toEqual('number');
            expect(Math.abs(Date.now() - update.$set.state.date) < 10).toEqual(true);

            counter++;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.getById({ _id: '123456789' });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(3);

        delete process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES;
        expect(process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES).toEqual(undefined);
      });

      it('custom expiration not expired', async () => {
        const minutes = 1;
        expect(process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES).toEqual(undefined);
        process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES = 1;

        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.PENDING
          },
          date: Date.now() - 59 * 1000
        };

        const packageInfoCollection: any = {
          async findOne(params) {
            counter++;
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual('123456789');
            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.getById({ _id: '123456789' });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(1);

        delete process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES;
        expect(process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES).toEqual(undefined);
      });
    });

    describe('getByIds', () => {
      it('no result', async () => {
        let counter = 0;
        const packageInfoCollection: any = {
          find(params) {
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual({ $in: [ '123456789' ] });
            counter++;

            return {
              async toArray() {
                return [];
              }
            };
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.getByIds([ '123456789' ]);
        expect(result).toEqual([]);
        expect(counter).toEqual(1);
      });

      it('failed result', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.FAILED
          }
        };

        const packageInfoCollection: any = {
          find(params) {
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual({ $in: [ '123456789' ] });
            counter++;

            return {
              async toArray() {
                return [ packageInfo ];
              }
            };
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.getByIds([ '123456789' ]);
        expect(result).toEqual([ packageInfo ]);
        expect(counter).toEqual(1);
      });

      it('succeeded result', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.SUCCEEDED
          }
        };

        const packageInfoCollection: any = {
          find(params) {
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual({ $in: [ '123456789' ] });
            counter++;

            return {
              async toArray() {
                return [ packageInfo ];
              }
            };
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.getByIds([ '123456789' ]);
        expect(result).toEqual([ packageInfo ]);
        expect(counter).toEqual(1);
      });

      it('pending result', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.PENDING
          },
          date: Date.now()
        };

        const packageInfoCollection: any = {
          find(params) {
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual({ $in: [ '123456789' ] });
            counter++;

            return {
              async toArray() {
                return [ packageInfo ];
              }
            };
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.getByIds([ '123456789' ]);
        expect(result).toEqual([ packageInfo ]);
        expect(counter).toEqual(1);
      });

      it('pending result expired', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.FAILED
          },
          date: Date.now()
        };

        const packageInfoCollection: any = {
          async findOne(params) {
            counter++;
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual('123456789');
            return packageInfo;
          },
          find(params) {
            counter++;
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual({ $in: [ '123456789' ] });

            return {
              async toArray() {
                return [
                  {
                    _id: '123456789',
                    state: {
                      type: StateType.PENDING
                    },
                    date: 0
                  }
                ];
              }
            };
          },
          async updateOne(filter, update) {
            const { _id } = filter;
            expect(Object.keys(filter)).toEqual([ '_id' ]);
            expect(_id).toEqual('123456789');

            expect(Object.keys(update)).toEqual([ '$set' ]);

            expect(update.$set.meta).toEqual({ error: 'timeout' });
            expect(update.$set.state.type).toEqual(StateType.FAILED);
            expect(typeof update.$set.state.date).toEqual('number');
            expect(Math.abs(Date.now() - update.$set.state.date) < 10).toEqual(true);

            counter++;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.getByIds([ '123456789' ]);
        expect(result).toEqual([ packageInfo ]);
        expect(counter).toEqual(3);
      });

      it('custom expiration expired', async () => {
        const minutes = 1;
        expect(process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES).toEqual(undefined);
        process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES = 1;

        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.FAILED
          },
          date: Date.now()
        };

        const packageInfoCollection: any = {
          async findOne(params) {
            counter++;
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual('123456789');
            return packageInfo;
          },
          find(params) {
            counter++;
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual({ $in: [ '123456789' ] });

            return {
              async toArray() {
                return [
                  {
                    _id: '123456789',
                    state: {
                      type: StateType.PENDING
                    },
                    date: Date.now() - 61 * 1000
                  }
                ];
              }
            };
          },
          async updateOne(filter, update) {
            const { _id } = filter;
            expect(Object.keys(filter)).toEqual([ '_id' ]);
            expect(_id).toEqual('123456789');

            expect(Object.keys(update)).toEqual([ '$set' ]);

            expect(update.$set.meta).toEqual({ error: 'timeout' });
            expect(update.$set.state.type).toEqual(StateType.FAILED);
            expect(typeof update.$set.state.date).toEqual('number');
            expect(Math.abs(Date.now() - update.$set.state.date) < 10).toEqual(true);

            counter++;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.getByIds([ '123456789' ]);
        expect(result).toEqual([ packageInfo ]);
        expect(counter).toEqual(3);

        delete process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES;
        expect(process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES).toEqual(undefined);
      });

      it('custom expiration not expired', async () => {
        const minutes = 1;
        expect(process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES).toEqual(undefined);
        process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES = 1;

        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.PENDING
          },
          date: Date.now() - 59 * 1000
        };

        const packageInfoCollection: any = {
          find(params) {
            counter++;
            const { _id } = params;
            expect(Object.keys(params)).toEqual([ '_id' ]);
            expect(_id).toEqual({ $in: [ '123456789' ] });

            return {
              async toArray() {
                return [ packageInfo ];
              }
            };
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.getByIds([ '123456789' ]);
        expect(result).toEqual([ packageInfo ]);
        expect(counter).toEqual(1);

        delete process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES;
        expect(process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES).toEqual(undefined);
      });
    });

    describe('create', () => {
      it('packageName', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.SUCCEEDED
          }
        };

        const packageInfoCollection: any = {
          async insertOne(params) {
            counter++;
            const {
              hash,
              packageName,
              packageJSONS3Key,
              packageLockS3Key,
              yarnLockS3Key,
              isProduction,
              date,
              state,
              latest,
              isNpmModule
            } = params;
            expect(Object.keys(params)).toEqual([
              'hash',
              'packageName',
              'packageJSONS3Key',
              'packageLockS3Key',
              'yarnLockS3Key',
              'isProduction',
              'date',
              'state',
              'latest',
              'isNpmModule'
            ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName');
            expect(packageJSONS3Key).toEqual(undefined);
            expect(packageLockS3Key).toEqual(undefined);
            expect(yarnLockS3Key).toEqual(undefined);
            expect(isProduction).toEqual(false);
            expect(typeof date).toEqual('number');
            expect(state.type).toEqual(StateType.PENDING);
            expect(typeof state.date).toEqual('number');
            expect(state.date).toEqual(date);
            expect(latest).toEqual(true);
            expect(isNpmModule).toEqual(true);

            return { result: 1 };
          },
          async findOne(params) {
            counter++;
            const { hash, latest } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
            expect(hash).toEqual('123');
            expect(latest).toEqual(true);

            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.create({
          hash: '123',
          packageName: 'packageName',
          isProduction: false,
          isNpmModule: true
        });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(2);
      });

      it('packageJSON', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.SUCCEEDED
          }
        };

        const packageInfoCollection: any = {
          async insertOne(params) {
            counter++;
            const {
              hash,
              packageName,
              packageJSONS3Key,
              packageLockS3Key,
              yarnLockS3Key,
              isProduction,
              date,
              state,
              latest,
              isNpmModule
            } = params;
            expect(Object.keys(params)).toEqual([
              'hash',
              'packageName',
              'packageJSONS3Key',
              'packageLockS3Key',
              'yarnLockS3Key',
              'isProduction',
              'date',
              'state',
              'latest',
              'isNpmModule'
            ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName');
            expect(packageJSONS3Key).toEqual(undefined);
            expect(packageLockS3Key).toEqual(undefined);
            expect(yarnLockS3Key).toEqual(undefined);
            expect(isProduction).toEqual(true);
            expect(typeof date).toEqual('number');
            expect(state.type).toEqual(StateType.PENDING);
            expect(typeof state.date).toEqual('number');
            expect(state.date).toEqual(date);
            expect(latest).toEqual(true);
            expect(isNpmModule).toEqual(true);

            return { result: 1 };
          },
          async findOne(params) {
            counter++;
            const { hash, latest } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
            expect(hash).toEqual('123');
            expect(latest).toEqual(true);

            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.create({
          hash: '123',
          packageName: 'packageName',
          packageJSON: '{"name":"packageName"}',
          isProduction: true,
          isNpmModule: true
        });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(2);
      });

      it('packageJSONS3Key', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.SUCCEEDED
          }
        };

        const packageInfoCollection: any = {
          async insertOne(params) {
            counter++;
            const {
              hash,
              packageName,
              packageJSONS3Key,
              packageLockS3Key,
              yarnLockS3Key,
              isProduction,
              date,
              state,
              latest,
              isNpmModule
            } = params;
            expect(Object.keys(params)).toEqual([
              'hash',
              'packageName',
              'packageJSONS3Key',
              'packageLockS3Key',
              'yarnLockS3Key',
              'isProduction',
              'date',
              'state',
              'latest',
              'isNpmModule'
            ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName');
            expect(packageJSONS3Key).toEqual('packageJSONS3Key');
            expect(packageLockS3Key).toEqual(undefined);
            expect(yarnLockS3Key).toEqual(undefined);
            expect(isProduction).toEqual(true);
            expect(typeof date).toEqual('number');
            expect(state.type).toEqual(StateType.PENDING);
            expect(typeof state.date).toEqual('number');
            expect(state.date).toEqual(date);
            expect(latest).toEqual(true);
            expect(isNpmModule).toEqual(true);

            return { result: 1 };
          },
          async findOne(params) {
            counter++;
            const { hash, latest } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
            expect(hash).toEqual('123');
            expect(latest).toEqual(true);

            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.create({
          hash: '123',
          packageName: 'packageName',
          packageJSON: '{"name":"packageName"}',
          packageJSONS3Key: 'packageJSONS3Key',
          isProduction: true,
          isNpmModule: true
        });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(2);
      });

      it('packageLock', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.SUCCEEDED
          }
        };

        const packageInfoCollection: any = {
          async insertOne(params) {
            counter++;
            const {
              hash,
              packageName,
              packageJSONS3Key,
              packageLockS3Key,
              yarnLockS3Key,
              isProduction,
              date,
              state,
              latest,
              isNpmModule
            } = params;
            expect(Object.keys(params)).toEqual([
              'hash',
              'packageName',
              'packageJSONS3Key',
              'packageLockS3Key',
              'yarnLockS3Key',
              'isProduction',
              'date',
              'state',
              'latest',
              'isNpmModule'
            ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName');
            expect(packageJSONS3Key).toEqual('packageJSONS3Key');
            expect(packageLockS3Key).toEqual(undefined);
            expect(yarnLockS3Key).toEqual(undefined);
            expect(isProduction).toEqual(true);
            expect(typeof date).toEqual('number');
            expect(state.type).toEqual(StateType.PENDING);
            expect(typeof state.date).toEqual('number');
            expect(state.date).toEqual(date);
            expect(latest).toEqual(true);
            expect(isNpmModule).toEqual(true);

            return { result: 1 };
          },
          async findOne(params) {
            counter++;
            const { hash, latest } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
            expect(hash).toEqual('123');
            expect(latest).toEqual(true);

            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.create({
          hash: '123',
          packageName: 'packageName',
          packageJSON: '{"name":"packageName"}',
          packageJSONS3Key: 'packageJSONS3Key',
          packageLock: '{"packageLock":1}',
          isProduction: true,
          isNpmModule: true
        });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(2);
      });

      it('packageLockS3Key', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.SUCCEEDED
          }
        };

        const packageInfoCollection: any = {
          async insertOne(params) {
            counter++;
            const {
              hash,
              packageName,
              packageJSONS3Key,
              packageLockS3Key,
              yarnLockS3Key,
              isProduction,
              date,
              state,
              latest,
              isNpmModule
            } = params;
            expect(Object.keys(params)).toEqual([
              'hash',
              'packageName',
              'packageJSONS3Key',
              'packageLockS3Key',
              'yarnLockS3Key',
              'isProduction',
              'date',
              'state',
              'latest',
              'isNpmModule'
            ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName');
            expect(packageJSONS3Key).toEqual('packageJSONS3Key');
            expect(packageLockS3Key).toEqual('packageLockS3Key');
            expect(yarnLockS3Key).toEqual(undefined);
            expect(isProduction).toEqual(true);
            expect(typeof date).toEqual('number');
            expect(state.type).toEqual(StateType.PENDING);
            expect(typeof state.date).toEqual('number');
            expect(state.date).toEqual(date);
            expect(latest).toEqual(true);
            expect(isNpmModule).toEqual(true);

            return { result: 1 };
          },
          async findOne(params) {
            counter++;
            const { hash, latest } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
            expect(hash).toEqual('123');
            expect(latest).toEqual(true);

            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.create({
          hash: '123',
          packageName: 'packageName',
          packageJSON: '{"name":"packageName"}',
          packageJSONS3Key: 'packageJSONS3Key',
          packageLock: '{"packageLock":1}',
          packageLockS3Key: 'packageLockS3Key',
          isProduction: true,
          isNpmModule: true
        });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(2);
      });

      it('yarnLock', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.SUCCEEDED
          }
        };

        const packageInfoCollection: any = {
          async insertOne(params) {
            counter++;
            const {
              hash,
              packageName,
              packageJSONS3Key,
              packageLockS3Key,
              yarnLockS3Key,
              isProduction,
              date,
              state,
              latest,
              isNpmModule
            } = params;
            expect(Object.keys(params)).toEqual([
              'hash',
              'packageName',
              'packageJSONS3Key',
              'packageLockS3Key',
              'yarnLockS3Key',
              'isProduction',
              'date',
              'state',
              'latest',
              'isNpmModule'
            ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName');
            expect(packageJSONS3Key).toEqual('packageJSONS3Key');
            expect(packageLockS3Key).toEqual('packageLockS3Key');
            expect(yarnLockS3Key).toEqual(undefined);
            expect(isProduction).toEqual(true);
            expect(typeof date).toEqual('number');
            expect(state.type).toEqual(StateType.PENDING);
            expect(typeof state.date).toEqual('number');
            expect(state.date).toEqual(date);
            expect(latest).toEqual(true);
            expect(isNpmModule).toEqual(true);

            return { result: 1 };
          },
          async findOne(params) {
            counter++;
            const { hash, latest } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
            expect(hash).toEqual('123');
            expect(latest).toEqual(true);

            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.create({
          hash: '123',
          packageName: 'packageName',
          packageJSON: '{"name":"packageName"}',
          packageJSONS3Key: 'packageJSONS3Key',
          packageLock: '{"packageLock":1}',
          packageLockS3Key: 'packageLockS3Key',
          yarnLock: 'yarnLock',
          isProduction: true,
          isNpmModule: true
        });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(2);
      });

      it('yarnLockS3Key', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.SUCCEEDED
          }
        };

        const packageInfoCollection: any = {
          async insertOne(params) {
            counter++;
            const {
              hash,
              packageName,
              packageJSONS3Key,
              packageLockS3Key,
              yarnLockS3Key,
              isProduction,
              date,
              state,
              latest,
              isNpmModule
            } = params;
            expect(Object.keys(params)).toEqual([
              'hash',
              'packageName',
              'packageJSONS3Key',
              'packageLockS3Key',
              'yarnLockS3Key',
              'isProduction',
              'date',
              'state',
              'latest',
              'isNpmModule'
            ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName');
            expect(packageJSONS3Key).toEqual('packageJSONS3Key');
            expect(packageLockS3Key).toEqual('packageLockS3Key');
            expect(yarnLockS3Key).toEqual('yarnLockS3Key');
            expect(isProduction).toEqual(true);
            expect(typeof date).toEqual('number');
            expect(state.type).toEqual(StateType.PENDING);
            expect(typeof state.date).toEqual('number');
            expect(state.date).toEqual(date);
            expect(latest).toEqual(true);
            expect(isNpmModule).toEqual(true);

            return { result: 1 };
          },
          async findOne(params) {
            counter++;
            const { hash, latest } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
            expect(hash).toEqual('123');
            expect(latest).toEqual(true);

            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.create({
          hash: '123',
          packageName: 'packageName',
          packageJSON: '{"name":"packageName"}',
          packageJSONS3Key: 'packageJSONS3Key',
          packageLock: '{"packageLock":1}',
          packageLockS3Key: 'packageLockS3Key',
          yarnLock: 'yarnLock',
          yarnLockS3Key: 'yarnLockS3Key',
          isProduction: true,
          isNpmModule: true
        });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(2);
      });

      it('persistBinaries has keys', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.SUCCEEDED
          }
        };

        const packageInfoCollection: any = {
          async insertOne(params) {
            counter++;
            const {
              hash,
              packageName,
              packageJSONS3Key,
              packageLockS3Key,
              yarnLockS3Key,
              isProduction,
              date,
              state,
              latest,
              isNpmModule
            } = params;
            expect(Object.keys(params)).toEqual([
              'hash',
              'packageName',
              'packageJSONS3Key',
              'packageLockS3Key',
              'yarnLockS3Key',
              'isProduction',
              'date',
              'state',
              'latest',
              'isNpmModule'
            ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName');
            expect(packageJSONS3Key).toEqual('packageJSONS3Key');
            expect(packageLockS3Key).toEqual('packageLockS3Key');
            expect(yarnLockS3Key).toEqual('yarnLockS3Key');
            expect(isProduction).toEqual(true);
            expect(typeof date).toEqual('number');
            expect(state.type).toEqual(StateType.PENDING);
            expect(typeof state.date).toEqual('number');
            expect(state.date).toEqual(date);
            expect(latest).toEqual(true);
            expect(isNpmModule).toEqual(true);

            return { result: 1 };
          },
          async findOne(params) {
            counter++;
            const { hash, latest } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
            expect(hash).toEqual('123');
            expect(latest).toEqual(true);

            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, undefined);

        const result = await packageInfoApi.create({
          hash: '123',
          packageName: 'packageName',
          packageJSON: '{"name":"packageName"}',
          packageJSONS3Key: 'packageJSONS3Key',
          packageLock: '{"packageLock":1}',
          packageLockS3Key: 'packageLockS3Key',
          yarnLock: 'yarnLock',
          yarnLockS3Key: 'yarnLockS3Key',
          isProduction: true,
          isNpmModule: true,
          persistBinaries: true
        });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(2);
      });

      it('persistBinaries upload', async () => {
        let counter = 0;
        const packageInfo: any = {
          _id: '123456789',
          state: {
            type: StateType.SUCCEEDED
          }
        };

        const files: any = {
          async putObject(params) {
            counter++;
            const { Key, Body } = params;
            expect(Object.keys(params)).toEqual([ 'Body', 'Key' ]);

            switch (counter) {
              case 1:
                expect(Key).toEqual('packages/123/package.json');
                expect(Body).toEqual('{"name":"packageName"}');
                break;
              case 2:
                expect(Key).toEqual('packages/123/package-lock.json');
                expect(Body).toEqual('{"packageLock":1}');
                break;
              case 3:
                expect(Key).toEqual('packages/123/yarn.lock');
                expect(Body).toEqual('yarnLock');
                break;
              default:
                expect(false).toEqual(true);
                break;
            }

            return Key;
          }
        };

        const packageInfoCollection: any = {
          async insertOne(params) {
            counter++;
            const {
              hash,
              packageName,
              packageJSONS3Key,
              packageLockS3Key,
              yarnLockS3Key,
              isProduction,
              date,
              state,
              latest,
              isNpmModule
            } = params;
            expect(Object.keys(params)).toEqual([
              'hash',
              'packageName',
              'packageJSONS3Key',
              'packageLockS3Key',
              'yarnLockS3Key',
              'isProduction',
              'date',
              'state',
              'latest',
              'isNpmModule'
            ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName');
            expect(packageJSONS3Key).toEqual('packages/123/package.json');
            expect(packageLockS3Key).toEqual('packages/123/package-lock.json');
            expect(yarnLockS3Key).toEqual('packages/123/yarn.lock');
            expect(isProduction).toEqual(true);
            expect(typeof date).toEqual('number');
            expect(state.type).toEqual(StateType.PENDING);
            expect(typeof state.date).toEqual('number');
            expect(state.date).toEqual(date);
            expect(latest).toEqual(true);
            expect(isNpmModule).toEqual(true);

            return { result: 1 };
          },
          async findOne(params) {
            counter++;
            const { hash, latest } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'latest' ]);
            expect(hash).toEqual('123');
            expect(latest).toEqual(true);

            return packageInfo;
          }
        };

        const packageInfoApi = new PackageInfoApi(undefined, packageInfoCollection, files);

        const result = await packageInfoApi.create({
          hash: '123',
          packageName: 'packageName',
          packageJSON: '{"name":"packageName"}',
          packageLock: '{"packageLock":1}',
          yarnLock: 'yarnLock',
          isProduction: true,
          isNpmModule: true,
          persistBinaries: true
        });
        expect(result).toEqual(packageInfo);
        expect(counter).toEqual(5);
      });
    });

    describe('fromPackageJSON', () => {
      beforeEach(() => {
        getHash.mockClear();
      });

      it('invalid package.json', async () => {
        try {
          const packageInfoApi = new PackageInfoApi(undefined, undefined, undefined);
          const result = await packageInfoApi.fromPackageJSON({
            packageJSON: '{...}',
            isProduction: false
          });
          expect(false).toEqual(true);
        } catch (e) {
          expect(e.message).toEqual('Invalid package.json');
        }
      });

      it('exists by hash', async () => {
        let counter = 0;
        getHash.mockReturnValue('123');

        class PackageInfoApiMock extends PackageInfoApi {
          public async get(params): Promise<any> {
            const { hash } = params;
            expect(Object.keys(params)).toEqual([ 'hash' ]);
            expect(hash).toEqual('123');

            counter++;
            return { packageInfo: 1 };
          }
        }

        const packageInfoApi = new PackageInfoApiMock(undefined, undefined, undefined);

        const result = await packageInfoApi.fromPackageJSON({
          packageJSON: '{"name":"packageName","version":"version"}',
          isProduction: false
        });
        expect(result).toEqual({ packageInfo: { packageInfo: 1 }, created: false });
        expect(getHash).lastCalledWith('false{"name":"packageName","version":"version"}undefinedundefined');
        expect(counter).toEqual(1);
      });

      it('created', async () => {
        let counter = 0;
        getHash.mockReturnValue('123');

        class PackageInfoApiMock extends PackageInfoApi {
          public async get(params): Promise<any> {
            const { hash } = params;
            expect(Object.keys(params)).toEqual([ 'hash' ]);
            expect(hash).toEqual('123');

            counter++;
            return null;
          }
          public async create(params): Promise<any> {
            const {
              hash,
              packageName,
              packageJSON,
              packageLock,
              yarnLock,
              isProduction,
              isNpmModule,
              persistBinaries
            } = params;
            expect(Object.keys(params)).toEqual([
              'hash',
              'packageName',
              'packageJSON',
              'packageLock',
              'yarnLock',
              'isProduction',
              'isNpmModule',
              'persistBinaries'
            ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName@version');
            expect(packageJSON).toEqual('{"name":"packageName","version":"version"}');
            expect(packageLock).toEqual(undefined);
            expect(yarnLock).toEqual(undefined);
            expect(isProduction).toEqual(false);
            expect(isNpmModule).toEqual(false);
            expect(persistBinaries).toEqual(undefined);

            counter++;
            return { packageInfo: 1 };
          }
        }

        const packageInfoApi = new PackageInfoApiMock(undefined, undefined, undefined);

        const result = await packageInfoApi.fromPackageJSON({
          packageJSON: '{"name":"packageName","version":"version"}',
          isProduction: false
        });
        expect(result).toEqual({ packageInfo: { packageInfo: 1 }, created: true });
        expect(getHash).lastCalledWith('false{"name":"packageName","version":"version"}undefinedundefined');
        expect(counter).toEqual(2);
      });

      it('packageLock', async () => {
        let counter = 0;
        getHash.mockReturnValue('123');

        class PackageInfoApiMock extends PackageInfoApi {
          public async get(params): Promise<any> {
            const { hash } = params;
            expect(Object.keys(params)).toEqual([ 'hash' ]);
            expect(hash).toEqual('123');

            counter++;
            return null;
          }
          public async create(params): Promise<any> {
            const {
              hash,
              packageName,
              packageJSON,
              packageLock,
              yarnLock,
              isProduction,
              isNpmModule,
              persistBinaries
            } = params;
            expect(Object.keys(params)).toEqual([
              'hash',
              'packageName',
              'packageJSON',
              'packageLock',
              'yarnLock',
              'isProduction',
              'isNpmModule',
              'persistBinaries'
            ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName@version');
            expect(packageJSON).toEqual('{"name":"packageName","version":"version"}');
            expect(packageLock).toEqual('{packageLock}');
            expect(yarnLock).toEqual(undefined);
            expect(isProduction).toEqual(false);
            expect(isNpmModule).toEqual(false);
            expect(persistBinaries).toEqual(undefined);

            counter++;
            return { packageInfo: 1 };
          }
        }

        const packageInfoApi = new PackageInfoApiMock(undefined, undefined, undefined);

        const result = await packageInfoApi.fromPackageJSON({
          packageJSON: '{"name":"packageName","version":"version"}',
          packageLock: '{packageLock}',
          isProduction: false
        });
        expect(result).toEqual({ packageInfo: { packageInfo: 1 }, created: true });
        expect(getHash).lastCalledWith('false{"name":"packageName","version":"version"}{packageLock}undefined');
        expect(counter).toEqual(2);
      });

      it('yarnLock', async () => {
        let counter = 0;
        getHash.mockReturnValue('123');

        class PackageInfoApiMock extends PackageInfoApi {
          public async get(params): Promise<any> {
            const { hash } = params;
            expect(Object.keys(params)).toEqual([ 'hash' ]);
            expect(hash).toEqual('123');

            counter++;
            return null;
          }
          public async create(params): Promise<any> {
            const {
              hash,
              packageName,
              packageJSON,
              packageLock,
              yarnLock,
              isProduction,
              isNpmModule,
              persistBinaries
            } = params;
            expect(Object.keys(params)).toEqual([
              'hash',
              'packageName',
              'packageJSON',
              'packageLock',
              'yarnLock',
              'isProduction',
              'isNpmModule',
              'persistBinaries'
            ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName@version');
            expect(packageJSON).toEqual('{"name":"packageName","version":"version"}');
            expect(packageLock).toEqual(undefined);
            expect(yarnLock).toEqual('{yarnLock}');
            expect(isProduction).toEqual(false);
            expect(isNpmModule).toEqual(false);
            expect(persistBinaries).toEqual(undefined);

            counter++;
            return { packageInfo: 1 };
          }
        }

        const packageInfoApi = new PackageInfoApiMock(undefined, undefined, undefined);

        const result = await packageInfoApi.fromPackageJSON({
          packageJSON: '{"name":"packageName","version":"version"}',
          yarnLock: '{yarnLock}',
          isProduction: false
        });
        expect(result).toEqual({ packageInfo: { packageInfo: 1 }, created: true });
        expect(getHash).lastCalledWith('false{"name":"packageName","version":"version"}undefined{yarnLock}');
        expect(counter).toEqual(2);
      });

      it('isProduction', async () => {
        let counter = 0;
        getHash.mockReturnValue('123');

        class PackageInfoApiMock extends PackageInfoApi {
          public async get(params): Promise<any> {
            const { hash } = params;
            expect(Object.keys(params)).toEqual([ 'hash' ]);
            expect(hash).toEqual('123');

            counter++;
            return null;
          }
          public async create(params): Promise<any> {
            const {
              hash,
              packageName,
              packageJSON,
              packageLock,
              yarnLock,
              isProduction,
              isNpmModule,
              persistBinaries
            } = params;
            expect(Object.keys(params)).toEqual([
              'hash',
              'packageName',
              'packageJSON',
              'packageLock',
              'yarnLock',
              'isProduction',
              'isNpmModule',
              'persistBinaries'
            ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName@version');
            expect(packageJSON).toEqual('{"name":"packageName","version":"version"}');
            expect(packageLock).toEqual(undefined);
            expect(yarnLock).toEqual(undefined);
            expect(isProduction).toEqual(true);
            expect(isNpmModule).toEqual(false);
            expect(persistBinaries).toEqual(undefined);

            counter++;
            return { packageInfo: 1 };
          }
        }

        const packageInfoApi = new PackageInfoApiMock(undefined, undefined, undefined);

        const result = await packageInfoApi.fromPackageJSON({
          packageJSON: '{"name":"packageName","version":"version"}',
          isProduction: true
        });
        expect(result).toEqual({ packageInfo: { packageInfo: 1 }, created: true });
        expect(getHash).lastCalledWith('true{"name":"packageName","version":"version"}undefinedundefined');
        expect(counter).toEqual(2);
      });

      it('persistBinaries', async () => {
        let counter = 0;
        getHash.mockReturnValue('123');

        class PackageInfoApiMock extends PackageInfoApi {
          public async get(params): Promise<any> {
            const { hash } = params;
            expect(Object.keys(params)).toEqual([ 'hash' ]);
            expect(hash).toEqual('123');

            counter++;
            return null;
          }
          public async create(params): Promise<any> {
            const {
              hash,
              packageName,
              packageJSON,
              packageLock,
              yarnLock,
              isProduction,
              isNpmModule,
              persistBinaries
            } = params;
            expect(Object.keys(params)).toEqual([
              'hash',
              'packageName',
              'packageJSON',
              'packageLock',
              'yarnLock',
              'isProduction',
              'isNpmModule',
              'persistBinaries'
            ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName@version');
            expect(packageJSON).toEqual('{"name":"packageName","version":"version"}');
            expect(packageLock).toEqual(undefined);
            expect(yarnLock).toEqual(undefined);
            expect(isProduction).toEqual(false);
            expect(isNpmModule).toEqual(false);
            expect(persistBinaries).toEqual(true);

            counter++;
            return { packageInfo: 1 };
          }
        }

        const packageInfoApi = new PackageInfoApiMock(undefined, undefined, undefined);

        const result = await packageInfoApi.fromPackageJSON({
          packageJSON: '{"name":"packageName","version":"version"}',
          isProduction: false,
          persistBinaries: true
        });
        expect(result).toEqual({ packageInfo: { packageInfo: 1 }, created: true });
        expect(getHash).lastCalledWith('false{"name":"packageName","version":"version"}undefinedundefined');
        expect(counter).toEqual(2);
      });
    });

    describe('fromPackageName', () => {
      beforeEach(() => {
        getHash.mockClear();
      });

      it('invalid package.json', async () => {
        try {
          const packageInfoApi = new PackageInfoApi(undefined, undefined, undefined);
          const result = await packageInfoApi.fromPackageName({
            packageName: '@@@'
          });
          expect(false).toEqual(true);
        } catch (e) {
          expect(e.message).toEqual("Cannot read property 'Symbol(Symbol.iterator)' of null");
        }
      });

      it('exists by hash', async () => {
        let counter = 0;
        getHash.mockReturnValue('123');

        const getNPMInfo: any = params => {
          counter++;
          const { name, version } = params;
          expect(Object.keys(params)).toEqual([ 'name', 'version' ]);
          expect(name).toEqual('packageName');
          expect(version).toEqual(undefined);

          return {
            name,
            version: 'version'
          };
        };

        class PackageInfoApiMock extends PackageInfoApi {
          public async get(params): Promise<any> {
            const { hash } = params;
            expect(Object.keys(params)).toEqual([ 'hash' ]);
            expect(hash).toEqual('123');

            counter++;
            return { packageInfo: 1 };
          }
        }

        const packageInfoApi = new PackageInfoApiMock(getNPMInfo, undefined, undefined);

        const result = await packageInfoApi.fromPackageName({
          packageName: 'packageName'
        });
        expect(result).toEqual({ packageInfo: { packageInfo: 1 }, created: false });
        expect(getHash).lastCalledWith('packageName@version');
        expect(counter).toEqual(2);
      });

      it('created', async () => {
        let counter = 0;
        getHash.mockReturnValue('123');

        const getNPMInfo: any = params => {
          counter++;
          const { name, version } = params;
          expect(Object.keys(params)).toEqual([ 'name', 'version' ]);
          expect(name).toEqual('packageName');
          expect(version).toEqual(undefined);

          return {
            name,
            version: 'version'
          };
        };

        class PackageInfoApiMock extends PackageInfoApi {
          public async get(params): Promise<any> {
            const { hash } = params;
            expect(Object.keys(params)).toEqual([ 'hash' ]);
            expect(hash).toEqual('123');

            counter++;
            return null;
          }

          public async create(params): Promise<any> {
            const { hash, packageName, isProduction, isNpmModule } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'packageName', 'isProduction', 'isNpmModule' ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName@version');
            expect(isProduction).toEqual(false);
            expect(isNpmModule).toEqual(true);

            counter++;
            return { packageInfo: 1 };
          }
        }

        const packageInfoApi = new PackageInfoApiMock(getNPMInfo, undefined, undefined);

        const result = await packageInfoApi.fromPackageName({
          packageName: 'packageName'
        });
        expect(result).toEqual({ packageInfo: { packageInfo: 1 }, created: true });
        expect(getHash).lastCalledWith('packageName@version');
        expect(counter).toEqual(3);
      });

      it('packageName@version', async () => {
        let counter = 0;
        getHash.mockReturnValue('123');

        const getNPMInfo: any = params => {
          counter++;
          const { name, version } = params;
          expect(Object.keys(params)).toEqual([ 'name', 'version' ]);
          expect(name).toEqual('packageName');
          expect(version).toEqual('version');

          return {
            name,
            version
          };
        };

        class PackageInfoApiMock extends PackageInfoApi {
          public async get(params): Promise<any> {
            const { hash } = params;
            expect(Object.keys(params)).toEqual([ 'hash' ]);
            expect(hash).toEqual('123');

            counter++;
            return null;
          }

          public async create(params): Promise<any> {
            const { hash, packageName, isProduction, isNpmModule } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'packageName', 'isProduction', 'isNpmModule' ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('packageName@version');
            expect(isProduction).toEqual(false);
            expect(isNpmModule).toEqual(true);

            counter++;
            return { packageInfo: 1 };
          }
        }

        const packageInfoApi = new PackageInfoApiMock(getNPMInfo, undefined, undefined);

        const result = await packageInfoApi.fromPackageName({
          packageName: 'packageName@version'
        });
        expect(result).toEqual({ packageInfo: { packageInfo: 1 }, created: true });
        expect(getHash).lastCalledWith('packageName@version');
        expect(counter).toEqual(3);
      });

      it('@scope/packageName@version', async () => {
        let counter = 0;
        getHash.mockReturnValue('123');

        const getNPMInfo: any = params => {
          counter++;
          const { name, version } = params;
          expect(Object.keys(params)).toEqual([ 'name', 'version' ]);
          expect(name).toEqual('@scope/packageName');
          expect(version).toEqual('version');

          return {
            name,
            version
          };
        };

        class PackageInfoApiMock extends PackageInfoApi {
          public async get(params): Promise<any> {
            const { hash } = params;
            expect(Object.keys(params)).toEqual([ 'hash' ]);
            expect(hash).toEqual('123');

            counter++;
            return null;
          }

          public async create(params): Promise<any> {
            const { hash, packageName, isProduction, isNpmModule } = params;
            expect(Object.keys(params)).toEqual([ 'hash', 'packageName', 'isProduction', 'isNpmModule' ]);
            expect(hash).toEqual('123');
            expect(packageName).toEqual('@scope/packageName@version');
            expect(isProduction).toEqual(false);
            expect(isNpmModule).toEqual(true);

            counter++;
            return { packageInfo: 1 };
          }
        }

        const packageInfoApi = new PackageInfoApiMock(getNPMInfo, undefined, undefined);

        const result = await packageInfoApi.fromPackageName({
          packageName: '@scope/packageName@version'
        });
        expect(result).toEqual({ packageInfo: { packageInfo: 1 }, created: true });
        expect(getHash).lastCalledWith('@scope/packageName@version');
        expect(counter).toEqual(3);
      });
    });
  });

  describe('EvaluationsApi', () => {
    beforeEach(() => {
      getHash.mockClear();
      generate.mockClear();
    });

    it('fromRuleSet ruleSet', async () => {
      let counter = 0;
      getHash.mockReturnValue('123');

      const evaluations: any = {
        async findOne(params) {
          const { packageInfoId, ruleSetHash } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSetHash' ]);
          expect(packageInfoId).toEqual('123456789');
          expect(ruleSetHash).toEqual('123');

          counter++;

          return { result: 1 };
        }
      };

      const evaluationsApi = new EvaluationsApi(undefined, evaluations, undefined, undefined, undefined);

      const result = await evaluationsApi.fromRuleSet({
        packageInfoId: '123456789',
        ruleSet: '{ ruleSetValue: {} }'
      });
      expect(result).toEqual({ result: 1 });
      expect(getHash).lastCalledWith('{ ruleSetValue: {} }');
      expect(counter).toEqual(1);
    });

    it('fromRuleSet ruleSet null', async () => {
      let counter = 0;
      getHash.mockReturnValue('123');

      const evaluations: any = {
        async findOne(params) {
          const { packageInfoId, ruleSetHash } = params;
          expect(Object.keys(params)).toEqual([ 'packageInfoId', 'ruleSetHash' ]);
          expect(packageInfoId).toEqual('123456789');
          expect(ruleSetHash).toEqual('123');

          counter++;

          return { result: 1 };
        }
      };

      const evaluationsApi = new EvaluationsApi(undefined, evaluations, undefined, undefined, undefined);

      const result = await evaluationsApi.fromRuleSet({
        packageInfoId: '123456789',
        ruleSet: null
      });
      expect(result).toEqual({ result: 1 });
      expect(getHash).lastCalledWith(null);
      expect(counter).toEqual(1);
    });

    it('get', async () => {
      let counter = 0;

      const evaluations: any = {
        async findOne(params) {
          const { _id } = params;
          expect(Object.keys(params)).toEqual([ '_id' ]);
          expect(_id).toEqual('1');

          counter++;

          return { result: 1 };
        }
      };

      const evaluationsApi = new EvaluationsApi(undefined, evaluations, undefined, undefined, undefined);

      const result = await evaluationsApi.get({ cid: '1' });
      expect(result).toEqual({ result: 1 });
      expect(counter).toEqual(1);
    });

    it('getByNames', async () => {
      let counter = 0;

      const evaluations: any = {
        find(params) {
          expect(Object.keys(params)).toEqual([ 'result.rootEvaluation.nodeName', 'ruleSet' ]);
          expect(params['result.rootEvaluation.nodeName']).toEqual({ $in: [ 'packageName' ] });
          expect(params.ruleSet).toEqual(null);

          counter++;

          return {
            async toArray() {
              return [ { result: 1 } ];
            }
          };
        }
      };

      const evaluationsApi = new EvaluationsApi(undefined, evaluations, undefined, undefined, undefined);

      const result = await evaluationsApi.getByNames([ 'packageName' ]);
      expect(result).toEqual([ { result: 1 } ]);
      expect(counter).toEqual(1);
    });

    it('create', async () => {
      let counter = 0;
      generate.mockReturnValue('1');
      getHash.mockReturnValue('123');

      const evaluations: any = {
        async insertOne(item) {
          const { _id, packageInfoId, date, ruleSet, ruleSetHash, result } = item;
          expect(Object.keys(item)).toEqual([ '_id', 'packageInfoId', 'date', 'ruleSet', 'ruleSetHash', 'result' ]);
          expect(_id).toEqual('1');
          expect(packageInfoId).toEqual('123456789');
          expect(typeof date).toEqual('number');
          expect(ruleSet).toEqual('{ ruleSetValue: 1 }');
          expect(ruleSetHash).toEqual('123');
          expect(result).toEqual(null);

          counter++;
          return { result: 1 };
        },
        async findOne(params) {
          const { _id } = params;
          expect(Object.keys(params)).toEqual([ '_id' ]);
          expect(_id).toEqual('1');

          counter++;
          return { result: 1 };
        }
      };

      const evaluationsApi = new EvaluationsApi(undefined, evaluations, undefined, undefined, undefined);

      const result = await evaluationsApi.create({
        packageInfoId: '123456789',
        ruleSet: '{ ruleSetValue: 1 }'
      });
      expect(result).toEqual({ result: 1 });
      expect(getHash).lastCalledWith('{ ruleSetValue: 1 }');
      expect(counter).toEqual(2);
    });

    it('updateState', async () => {
      let counter = 0;
      const evaluations: any = {
        async updateOne(filter, update) {
          const { _id } = filter;
          expect(Object.keys(filter)).toEqual([ '_id' ]);
          expect(_id).toEqual('1');

          expect(Object.keys(update)).toEqual([ '$set' ]);
          expect(update).toEqual({
            $set: {
              result: { resultValue: 1 }
            }
          });

          counter++;

          return { result: 1 };
        }
      };

      const evaluationsApi = new EvaluationsApi(undefined, evaluations, undefined, undefined, undefined);

      const result = await evaluationsApi.updateResult({
        cid: '1',
        result: { resultValue: 1 }
      });
      expect(result).toEqual({ updated: { result: 1 } });
      expect(counter).toEqual(1);
    });

    describe('evaluate', () => {
      it('invalid ruleSet', async () => {
        const evaluationInfo: any = {
          ruleSet: '{asd: 1}',
          packageInfoId: '123456789',
          _id: '1'
        };

        try {
          const evaluationsApi = new EvaluationsApi(undefined, undefined, undefined, undefined, undefined);

          const result = await evaluationsApi.evaluate({
            evaluationInfo,
            data: { dataValue: 1 }
          });
          expect(false).toEqual(true);
        } catch (e) {
          expect(true).toEqual(true);
        }
      });

      it('object ruleSet', async () => {
        const evaluationInfo: any = {
          ruleSet: {},
          packageInfoId: '123456789',
          _id: '1'
        };

        try {
          const evaluationsApi = new EvaluationsApi(undefined, undefined, undefined, undefined, undefined);

          const result = await evaluationsApi.evaluate({
            evaluationInfo,
            data: { dataValue: 1 }
          });
          expect(false).toEqual(true);
        } catch (e) {
          expect(true).toEqual(true);
        }
      });

      it('undefined ruleSet', async () => {
        const evaluationInfo: any = {
          ruleSet: undefined,
          packageInfoId: '123456789',
          _id: '1'
        };

        try {
          const evaluationsApi = new EvaluationsApi(undefined, undefined, undefined, undefined, undefined);

          const result = await evaluationsApi.evaluate({
            evaluationInfo,
            data: { dataValue: 1 }
          });
          expect(false).toEqual(true);
        } catch (e) {
          expect(true).toEqual(true);
        }
      });

      it('ruleSet null', async () => {
        let counter = 0;

        const evaluationInfo: any = {
          ruleSet: null,
          packageInfoId: '123456789',
          _id: '1'
        };

        const evaluations: any = {
          async updateOne(filter, update) {
            counter++;
            expect(filter).toEqual({ _id: '1' });
            expect(update).toEqual({ $set: { result: { evaluationResult: 1 } } });
          }
        };

        const packageInfoApi: any = {
          async updateState(params) {
            counter++;
            const { _id, meta, type } = params;
            expect(Object.keys(params)).toEqual([ '_id', 'meta', 'type' ]);
            expect(_id).toEqual('123456789');
            expect(meta).toEqual({ dataValue: 1 });
            expect(type).toEqual(StateType.SUCCEEDED);
          }
        };

        const evaluateService: any = params => {
          counter++;
          const { data, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'data', 'ruleSet' ]);
          expect(data).toEqual({ dataValue: 1 });
          expect(ruleSet).toEqual({ mergedRuleSet: 1 });

          return { evaluationResult: 1 };
        };

        const getRuleSet: any = params => {
          counter++;
          const { ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'ruleSet' ]);
          expect(ruleSet).toEqual(null);

          return { mergedRuleSet: 1 };
        };

        const evaluationsApi = new EvaluationsApi(undefined, evaluations, packageInfoApi, evaluateService, getRuleSet);

        const result = await evaluationsApi.evaluate({
          evaluationInfo,
          data: { dataValue: 1 }
        });
        expect(result).toEqual(undefined);
        expect(evaluationInfo.result).toEqual({ evaluationResult: 1 });
        expect(counter).toEqual(4);
      });

      it('ruleSet data', async () => {
        let counter = 0;

        const evaluationInfo: any = {
          ruleSet: '{"ruleSet":1}',
          packageInfoId: '123456789',
          _id: '1'
        };

        const evaluations: any = {
          async updateOne(filter, update) {
            counter++;
            expect(filter).toEqual({ _id: '1' });
            expect(update).toEqual({ $set: { result: { evaluationResult: 1 } } });
          }
        };

        const packageInfoApi: any = {
          async updateState(params) {
            counter++;
            const { _id, meta, type } = params;
            expect(Object.keys(params)).toEqual([ '_id', 'meta', 'type' ]);
            expect(_id).toEqual('123456789');
            expect(meta).toEqual({ dataValue: 1 });
            expect(type).toEqual(StateType.SUCCEEDED);
          }
        };

        const evaluateService: any = params => {
          counter++;
          const { data, ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'data', 'ruleSet' ]);
          expect(data).toEqual({ dataValue: 1 });
          expect(ruleSet).toEqual({ mergedRuleSet: 1 });

          return { evaluationResult: 1 };
        };

        const getRuleSet: any = params => {
          counter++;
          const { ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'ruleSet' ]);
          expect(ruleSet).toEqual({ ruleSet: 1 });

          return { mergedRuleSet: 1 };
        };

        const evaluationsApi = new EvaluationsApi(undefined, evaluations, packageInfoApi, evaluateService, getRuleSet);

        const result = await evaluationsApi.evaluate({
          evaluationInfo,
          data: { dataValue: 1 }
        });
        expect(result).toEqual(undefined);
        expect(evaluationInfo.result).toEqual({ evaluationResult: 1 });
        expect(counter).toEqual(4);
      });

      it('error in evaluate', async () => {
        let counter = 0;

        const evaluationInfo: any = {
          ruleSet: '{"ruleSet":1}',
          packageInfoId: '123456789',
          _id: '1'
        };

        const packageInfoApi: any = {
          async updateState(params) {
            counter++;
            const { _id, meta, type } = params;
            expect(Object.keys(params)).toEqual([ '_id', 'meta', 'type' ]);
            expect(_id).toEqual('123456789');
            expect(meta).toEqual({ error: 'error in evaluate' });
            expect(type).toEqual(StateType.FAILED);
          }
        };

        const evaluateService: any = params => {
          counter++;
          throw new Error('error');
        };

        const getRuleSet: any = params => {
          counter++;
          const { ruleSet } = params;
          expect(Object.keys(params)).toEqual([ 'ruleSet' ]);
          expect(ruleSet).toEqual({ ruleSet: 1 });

          return { mergedRuleSet: 1 };
        };

        const evaluationsApi = new EvaluationsApi(undefined, undefined, packageInfoApi, evaluateService, getRuleSet);

        try {
          const result = await evaluationsApi.evaluate({
            evaluationInfo,
            data: { dataValue: 1 }
          });
        } catch (e) {
          expect(evaluationInfo.result).toEqual(undefined);
          expect(counter).toEqual(3);
        }
      });
    });
  });
});
