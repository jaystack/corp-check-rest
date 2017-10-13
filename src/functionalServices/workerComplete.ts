import { rest, param, inject } from 'functionly';

import { CorpCheckRestService } from './corpCheckRestService';

import { PackageInfoApi } from '../api/packageInfo';
import { EvaluationsApi } from '../api/evaluations';
import { CreateCacheItems } from './moduleMetaCache';

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
    console.log('cid', cid);
    console.log('data', data);
    console.log('error', error);

    console.log('1', new Date().toISOString());
    const evaluationInfo = await evaluationsApi.get({ cid });
    if (!evaluationInfo) return;
    console.log('2', new Date().toISOString());
    if (error) {
      await packageInfoApi.updateState({
        _id: evaluationInfo.packageInfoId,
        meta: error,
        type: 'FAILED'
      });
      return;
    }
    console.log('3', new Date().toISOString());
    console.log('evaluationInfo.ruleSet:', evaluationInfo.ruleSet);
    await evaluationsApi.evaluate({
      evaluationInfo,
      data
    });
    console.log('4', new Date().toISOString());
    if (data.meta) {
      await createCacheItems({ meta: data.meta });
    }
    console.log('5', new Date().toISOString());
  }
}

export const complete = Complete.createInvoker();
