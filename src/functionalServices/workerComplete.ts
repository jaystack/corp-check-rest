import { rest, param, inject } from 'functionly';

import { CorpCheckRestService } from './corpCheckRestService';

import { PackageInfoApi } from '../api/packageInfo';
import { EvaluationsApi } from '../api/evaluations';
import { CreateCacheItems } from './moduleMEtaCache';

//TODO remove
@rest({ path: '/complete', methods: [ 'post' ] })
export class Complete extends CorpCheckRestService {
  public async handle(
    @param cid,
    @param data,
    @param error,
    @inject(PackageInfoApi) packageInfoApi: PackageInfoApi,
    @inject(EvaluationsApi) evaluationsApi: EvaluationsApi,
    @inject(CreateCacheItems) createCacheItems
  ) {
    const evaluationInfo = await evaluationsApi.get({ cid });
    if (!evaluationInfo) return;

    if (error) {
      await packageInfoApi.updateState({
        _id: evaluationInfo.packageInfoId,
        meta: error,
        type: 'FAILED'
      });
      return;
    }

    await evaluationsApi.evaluate({
      evaluationInfo,
      data
    });

    if (data.meta) {
      await createCacheItems({ meta: data.meta });
    }
  }
}

export const complete = Complete.createInvoker();
