import { Service, param, inject, injectable, InjectionScope } from 'functionly';
import { StartPackageValidation, IsExpiredResult } from '../services/checker';

import { NodeEvaluation } from '../types';

import { PackageInfoApi } from '../api/packageInfo';
import { EvaluationsApi } from '../api/evaluations';

@injectable(InjectionScope.Singleton)
export class ValidationStart extends Service {
  public async handle(
    @param force,
    @param ruleSet,
    @param packageInfoFromResult,
    @inject(PackageInfoApi) packageInfoApi: PackageInfoApi,
    @inject(EvaluationsApi) evaluationsApi: EvaluationsApi,
    @inject(IsExpiredResult) isExpiredResult,
    @inject(StartPackageValidation) startPackageValidation
  ) {
    let { packageInfo, created } = packageInfoFromResult;

    if (await isExpiredResult({ packageInfo, update: true, force: !created && typeof force !== 'undefined' })) {
      packageInfo = await packageInfoApi.create(packageInfo);
    }

    const packageInfoId = packageInfo._id;
    let evaluationInfo = await evaluationsApi.fromRuleSet({ packageInfoId, ruleSet });
    if (!evaluationInfo) {
      evaluationInfo = await evaluationsApi.create({ packageInfoId, ruleSet });

      if (packageInfo.state.type === 'PENDING' && process.env.FUNCTIONAL_ENVIRONMENT !== 'local') {
        await startPackageValidation({
          packageName: packageInfo.packageName,
          packageJSON: packageInfo.packageJSON,
          cid: evaluationInfo._id,
          isProduction: packageInfo.isProduction
        });
      }
    }

    if (packageInfo.state.type === 'SUCCEEDED' && !evaluationInfo.result) {
      await evaluationsApi.evaluate({
        evaluationInfo,
        data: packageInfo.meta
      });
    }

    return evaluationInfo;
  }
}
