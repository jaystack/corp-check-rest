import { rest, param, inject } from 'functionly';

import { CorpCheckRestService } from './corpCheckRestService';

import { PackageInfoApi } from '../api/packageInfo';
import { EvaluationsApi } from '../api/evaluations';
import { CreateCacheItems } from './moduleMetaCache';

import { StateType } from '../types';

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
        meta: { error },
        type: StateType.FAILED
      });
      return;
    }
    await evaluationsApi.evaluate({
      evaluationInfo,
      data
    });
    if (data && data.meta) {
      await createCacheItems({ meta: data.meta });
    }
  }
}

@rest({ path: '/progress', methods: [ 'post' ] })
export class Progress extends CorpCheckRestService {
  public async handle(
    @param cid,
    @param message,
    @inject(PackageInfoApi) packageInfoApi: PackageInfoApi,
    @inject(EvaluationsApi) evaluationsApi: EvaluationsApi
  ) {
    if (message) {
      const evaluationInfo = await evaluationsApi.get({ cid });
      if (!evaluationInfo) return;

      await packageInfoApi.setProgress({ _id: evaluationInfo.packageInfoId, message });
    }
  }
}
