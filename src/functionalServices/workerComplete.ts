import { rest, param, inject } from 'functionly';
import { aws, FunctionalService } from 'functionly';

import { CorpCheckRestService } from './corpCheckRestService';

import { PackageInfoApi } from '../api/packageInfo';
import { EvaluationsApi } from '../api/evaluations';
import { CreateCacheItems } from './moduleMetaCache';

import { StateType } from '../types';

@rest({ path: '/complete', methods: [ 'post' ] })
@aws({ type: 'nodejs6.10', memorySize: 512, timeout: 10 })
export class Complete extends FunctionalService {
	public async handle(
		@param cid,
		@param data,
    @param error,
    @param message,
		@inject(PackageInfoApi) packageInfoApi: PackageInfoApi,
		@inject(EvaluationsApi) evaluationsApi: EvaluationsApi,
		@inject(CreateCacheItems) createCacheItems
	) {
		console.time('createCacheItems');
		try {
			if (data && data.meta) {
				await createCacheItems({ meta: data.meta });
			}
		} catch (e) {
			console.log('cache save failed');
			console.log(e);
		}
		console.timeEnd('createCacheItems');

		const evaluationInfo = await evaluationsApi.get({ cid });
		if (!evaluationInfo) return;
		if (error) {
			await packageInfoApi.updateState({
				_id: evaluationInfo.packageInfoId,
				meta: { error, message },
				type: StateType.FAILED
			});
			return;
		}
		console.time('evaluate');
		await evaluationsApi.evaluate({
			evaluationInfo,
			data
		});
		console.timeEnd('evaluate');
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
