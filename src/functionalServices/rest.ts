import { rest, aws, param, inject, use, injectable, InjectionScope, environment } from 'functionly';
import { stringify } from 'querystring';
import request = require('request-promise-native');
import { StartPackageValidation, IsExpiredResult } from '../services/checker';
import { ValidationStart } from '../services/validationStart';
import { Badge } from '../services/badge';
import { FileStorage } from '../stores/s3filestorages';

import { PackageInfoApi } from '../api/packageInfo';
import { EvaluationsApi } from '../api/evaluations';
import { PopularPackageNames } from '../services/popularPackageNames';
import { PackageInfo, EvaluationInfo, StateType } from '../types';

import { CorpCheckRestService } from './corpCheckRestService';

export class MissingPackageParameters extends Error {}

@injectable(InjectionScope.Singleton)
@rest({ path: '/validation', methods: [ 'post' ], anonymous: true, cors: true })
@environment('PERSIST_VALIDATION_BINARIES', '0')
export class Validation extends CorpCheckRestService {
	public async handle(
		@param packageName,
		@param force,
		@param packageJSON,
		@param packageLock,
		@param yarnLock,
		@param isProduction,
		@param ruleSet,
		@inject(PackageInfoApi) packageInfoApi: PackageInfoApi,
		@inject(ValidationStart) validationStart
	) {
		let packageInfoFromResult: { packageInfo: PackageInfo; created: boolean };
		if (packageJSON) {
			packageInfoFromResult = await packageInfoApi.fromPackageJSON({
				packageJSON,
				packageLock,
				yarnLock,
				isProduction: !!isProduction,
				persistBinaries: process.env.PERSIST_VALIDATION_BINARIES === '1'
			});
		} else if (packageName) {
			packageInfoFromResult = await packageInfoApi.fromPackageName({ packageName });
		} else {
			throw new MissingPackageParameters('packageJSON or packageName');
		}

		const evaluationInfo = await validationStart({
			force: !!force,
			ruleSet,
			packageInfoFromResult,
			packageJSON,
			packageLock,
			yarnLock
		});

		return { state: packageInfoFromResult.packageInfo.state, cid: evaluationInfo._id };
	}
}

@rest({ path: '/package', methods: [ 'get' ], anonymous: true, cors: true })
export class Package extends CorpCheckRestService {
	public async handle(
		@param cid,
		@inject(PackageInfoApi) packageInfoApi: PackageInfoApi,
		@inject(EvaluationsApi) evaluationsApi: EvaluationsApi,
		@inject(IsExpiredResult) isExpiredResult
	) {
		const result = {
			cid,
			name: undefined,
			state: { type: 'NOTEXISTS', date: Date.now(), message: undefined },
			expired: true,
			result: null,
			ruleSet: null
		};

		const evaluationInfo = await evaluationsApi.get({ cid });
		if (evaluationInfo) {
			result.result = evaluationInfo.result;
			result.ruleSet = evaluationInfo.ruleSet;

			const packageInfo = await packageInfoApi.getById({ _id: evaluationInfo.packageInfoId });
			if (packageInfo) {
				result.name = packageInfo.packageName || 'undefined';
				result.state = <any>packageInfo.state;
				result.expired = await isExpiredResult({ packageInfo, update: false, force: false });
				if (packageInfo.meta && packageInfo.meta['message'] && result.state) {
					result.state.message = packageInfo.meta['message'];
				}
			}
		}

		return result;
	}
}

@rest({ path: '/popular-packages', methods: [ 'get' ], anonymous: true, cors: true })
export class PopularPackages extends CorpCheckRestService {
	public async handle(
		@inject(PopularPackageNames) popularPackageNameService,
		@inject(PackageInfoApi) packageInfoApi: PackageInfoApi,
		@inject(EvaluationsApi) evaluationsApi: EvaluationsApi
	) {
		const popularPackageNames = await popularPackageNameService();
		const evaluations = await evaluationsApi.getByNames(popularPackageNames);
		const duplicateFilteredEvaluations = evaluations.reduce((acc, evaluation) => {
			const precedent = acc.find(
				(precedent) => precedent.result.rootEvaluation.nodeName === evaluation.result.rootEvaluation.nodeName
			);
			if (!precedent) return [ ...acc, evaluation ];
			return precedent.result.rootEvaluation.nodeVersion > evaluation.result.rootEvaluation.nodeVersion
				? acc
				: [
						...acc.filter(
							(precedent) =>
								precedent.result.rootEvaluation.nodeName !== evaluation.result.rootEvaluation.nodeName
						),
						evaluation
					];
		}, []);
		const packageInfoIds = duplicateFilteredEvaluations.map(({ packageInfoId }) => packageInfoId);
		const packageInfos = await packageInfoApi.getByIds(packageInfoIds);
		const getRelatedPackageInfo = (packageInfoId) =>
			packageInfos.find((packageInfo) => packageInfo._id.toHexString() === packageInfoId.toHexString()) || {
				state: null
			};
		return duplicateFilteredEvaluations
			.map(
				(
					{
						_id: cid,
						packageInfoId,
						result: {
							qualification,
							rootEvaluation: { nodeName: name, nodeVersion: version, nodeScore: score }
						}
					},
					i
				) => ({
					cid,
					name,
					version,
					state: getRelatedPackageInfo(packageInfoId).state,
					qualification,
					score: Math.round(100 * score) / 100
				})
			)
			.sort((a, b) => b.score - a.score);
	}
}

@rest({ path: '/badge', methods: [ 'get' ], anonymous: true, cors: true })
export class BadgeService extends CorpCheckRestService {
	public async handle(
		@param scope,
		@param name,
		@param version,
		@inject(PackageInfoApi) packageInfoApi: PackageInfoApi,
		@inject(ValidationStart) validationStart,
		@inject(Badge) badge
	) {
		const packageName = `${scope ? `@${scope}/` : ''}${name}@${version || 'latest'}`;
		const packageInfoFromResult = await packageInfoApi.fromPackageName({ packageName });

		const evaluationInfo: EvaluationInfo = await validationStart({ packageInfoFromResult });

		const content = await badge({ packageInfo: packageInfoFromResult.packageInfo, evaluationInfo });
		if (!content) throw new Error('missing badge');

		return {
			status: 200,
			headers: {
				'content-type': 'image/svg+xml'
			},
			data: content
		};
	}
}

@rest({ path: '/suggestions', methods: [ 'get' ], anonymous: true, cors: true })
export class Suggestion extends CorpCheckRestService {
	public async handle(@param name, @param version): Promise<{ title: string; description?: string }[]> {
		if (!name) return [];
		if (version === undefined) {
			const { objects } = await request
				.get(`https://registry.npmjs.org/-/v1/search?${stringify({ text: name, size: 5 })}`, {
					json: true
				})
				.catch((err) => ({ objects: [] }));
			return objects.map(({ package: { name, description } }) => ({ title: name, description }));
		} else {
			const { versions } = await request.get(`https://registry.npmjs.org/${name.replace('/', '%2F')}`, {
				json: true
			});
			const pattern = new RegExp(`^${version.replace(/\./g, '\\.')}`);
			return [ ...Object.keys(versions || {}) ]
				.reverse()
				.filter((version) => pattern.test(version))
				.slice(0, 10)
				.map((version) => ({ title: `${name}@${version}` }));
		}
	}
}

@rest({ path: '/stresstest', methods: [ 'post' ] })
export class StressTest extends CorpCheckRestService {
	public async handle(@param count, @param packageName, @inject(StartPackageValidation) startPackageValidation) {
		const _count = count || 10;
		for (let i = 0; i < _count; i++) {
			await startPackageValidation({
				packageName: packageName || 'express',
				cid: '1'
			});
			console.log(i);
		}

		return {
			status: 200,
			data: {
				started: true,
				count,
				packageName
			}
		};
	}
}
