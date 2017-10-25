import { Service } from 'functionly';
import { environment, rest, param, inject, injectable, InjectionScope } from 'functionly';

import { CorpCheckRestService } from './corpCheckRestService';
import { ModuleMetadata } from '../types';

import { ModuleMetadataCache } from '../stores/mongoCollections';
import { PackageInfoApi } from '../api/packageInfo';
import { EvaluationsApi } from '../api/evaluations';

export type MetaObject = { [key: string]: Object };

@injectable(InjectionScope.Singleton)
export class CreateCacheItems extends Service {
  public async handle(@param meta: MetaObject, @inject(ModuleMetadataCache) moduleMetadataCache: ModuleMetadataCache) {
    for (const key in meta) {
      const item: any = meta[key];
      if (!item.date) {
        item._id = key;
        item.date = Date.now();
        await moduleMetadataCache.update({ _id: key }, { $set: item }, { upsert: true });
      }
    }
  }
}

@rest({ path: '/getmodulemeta', methods: [ 'post' ] })
@environment('MODULE_META_EXPIRATION_IN_HOURS', '168')
export class GetModuleMeta extends CorpCheckRestService {
  public async handle(@param modules, @inject(ModuleMetadataCache) moduleMetadataCache: ModuleMetadataCache) {
    const result: MetaObject = {};
    const cacheResult: ModuleMetadata[] = await moduleMetadataCache
      .find<ModuleMetadata>({ _id: { $in: modules || [] } })
      .toArray();

    const expirationGap = process.env.MODULE_META_EXPIRATION_IN_HOURS * 60 * 60 * 1000 || 2 * 24 * 60 * 60 * 1000;

    for (const item of cacheResult) {
      if (item.date && item.date > Date.now() - expirationGap) result[item._id] = item;
    }

    return result;
  }
}
