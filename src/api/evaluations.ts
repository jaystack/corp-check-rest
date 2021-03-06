import { Api, inject, injectable, InjectionScope } from 'functionly';
import { Evaluations } from '../stores/mongoCollections';
import { GetNpmInfo } from '../services/npm';
import { generate } from 'shortid';
import * as getHash from 'hash-sum';
import { EvaluationInfo, StateType } from '../types';
import { PackageInfoApi } from './packageInfo';
import { Evaluate } from '../services/evaluate';
import { GetRuleSet } from '../services/defaultRuleSet';

@injectable(InjectionScope.Singleton)
export class EvaluationsApi extends Api {
  constructor(
    @inject(GetNpmInfo) private getNPMInfo,
    @inject(Evaluations) private evaluations: Evaluations,
    @inject(PackageInfoApi) private packageInfoApi: PackageInfoApi,
    @inject(Evaluate) private evaluateService,
    @inject(GetRuleSet) private getRuleSet
  ) {
    super();
  }

  public async fromRuleSet({ packageInfoId, ruleSet }) {
    const ruleSetHash = getHash(ruleSet);

    return await this.evaluations.findOne<EvaluationInfo>({ packageInfoId, ruleSetHash });
  }

  public async get({ cid }) {
    return await this.evaluations.findOne<EvaluationInfo>({ _id: cid });
  }

  public async getByNames(names: string[]): Promise<EvaluationInfo[]> {
    return await this.evaluations
      .find<EvaluationInfo>({ 'result.rootEvaluation.nodeName': { $in: names }, ruleSet: null })
      .toArray();
  }

  public async create({ packageInfoId, ruleSet }) {
    const ruleSetHash = getHash(ruleSet);
    const date = Date.now();
    const cid = generate();
    const item = await this.evaluations.insertOne({
      _id: cid,
      packageInfoId,
      date,
      ruleSet,
      ruleSetHash,
      result: null
    });

    return await this.get({ cid });
  }

  public async updateResult({ cid, result }): Promise<any> {
    const updated = await this.evaluations.updateOne(
      { _id: cid },
      {
        $set: {
          result
        }
      }
    );

    return { updated };
  }

  public async evaluate({ evaluationInfo, data }) {
    try {
      const result = await this.evaluateService({
        data,
        ruleSet: await this.getRuleSet({ ruleSet: JSON.parse(evaluationInfo.ruleSet) })
      });

      await this.updateResult({
        cid: evaluationInfo._id,
        result
      });

      await this.packageInfoApi.updateState({
        _id: evaluationInfo.packageInfoId,
        meta: data,
        type: StateType.SUCCEEDED
      });

      evaluationInfo.result = result;
    } catch (e) {
      await this.packageInfoApi.updateState({
        _id: evaluationInfo.packageInfoId,
        meta: { error: 'error in evaluate' },
        type: StateType.FAILED
      });
      throw e;
    }
  }
}
