import { Service } from 'functionly';
import { PackageMeta } from 'corp-check-core';
import { environment, rest, param, inject, injectable, InjectionScope } from 'functionly';

import { CorpCheckRestService } from './corpCheckRestService';
import { ModuleMetadata } from '../types';

import { ModuleMetadataCache } from '../stores/mongoCollections';
import { PackageInfoApi } from '../api/packageInfo';
import { EvaluationsApi } from '../api/evaluations';
import { Package } from './rest';

export type PackageMetaCache = PackageMeta & { _id?: string; date?: number };

@injectable(InjectionScope.Singleton)
export class CreateCacheItems extends Service {
  public async handle(
    @param meta: PackageMetaCache[],
    @inject(ModuleMetadataCache) moduleMetadataCache: ModuleMetadataCache
  ) {
    for (const item of meta) {
      if (!item.date) {
        item._id = item.name;
        item.date = Date.now();
        await moduleMetadataCache.update({ _id: item.name }, { $set: item }, { upsert: true });
      }
    }
  }
}

@rest({ path: '/getmodulemeta', methods: [ 'post' ] })
@environment('MODULE_META_EXPIRATION_IN_HOURS', '168')
export class GetModuleMeta extends CorpCheckRestService {
  public async handle(@param modules, @inject(ModuleMetadataCache) moduleMetadataCache: ModuleMetadataCache) {
    const cacheResult: ModuleMetadata[] = await moduleMetadataCache
      .find<ModuleMetadata>({ _id: { $in: modules || [] } })
      .toArray();

    const expirationGap = process.env.MODULE_META_EXPIRATION_IN_HOURS * 60 * 60 * 1000 || 2 * 24 * 60 * 60 * 1000;

    return cacheResult.filter(item => item.date && item.date > Date.now() - expirationGap);
  }
}
