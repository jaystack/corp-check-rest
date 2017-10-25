import 'jest';
import { CreateCacheItems, GetModuleMeta } from '../src/functionalServices/moduleMetaCache';
import { StateType } from '../src/types';
import { container } from 'functionly';

const _ = undefined;

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
