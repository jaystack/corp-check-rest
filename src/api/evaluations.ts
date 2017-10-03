import { Api, inject, injectable, InjectionScope } from 'functionly';
import { Evaluations } from '../stores/dynamoTables';
import { GetNpmInfo } from '../services/npm';
import { generate } from 'shortid';
import * as getHash from 'hash-sum';
import { EvaluationInfo } from '../types';
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

  public async fromRuleSet({ packageInfoId, ruleSet }): Promise<EvaluationInfo> {
    const ruleSetHash = getHash(JSON.stringify(ruleSet));

    const item = (await this.evaluations.scan({
      FilterExpression: 'packageInfoId = :packageInfoId and ruleSetHash = :ruleSetHash',
      ExpressionAttributeValues: {
        ':packageInfoId': packageInfoId,
        ':ruleSetHash': ruleSetHash
      }
    })).Items[0];

    if (!item) return null;
    return <EvaluationInfo>{
      ...item,
      ruleSet: typeof item.ruleSet === 'string' ? JSON.parse(item.ruleSet) : item.ruleSet,
      result: typeof item.result === 'string' ? JSON.parse(item.result) : item.result
    };
  }

  public async get({ cid }) {
    const item = <EvaluationInfo>(await this.evaluations.get({ Key: { id: cid } })).Item;

    return {
      ...item,
      ruleSet: typeof item.ruleSet === 'string' ? JSON.parse(item.ruleSet) : item.ruleSet,
      result: typeof item.result === 'string' ? JSON.parse(item.result) : item.result
    };
  }

  public async create({ packageInfoId, ruleSet }) {
    const ruleSetHash = getHash(JSON.stringify(ruleSet));
    const date = Date.now();
    const cid = generate();
    const item = await this.evaluations.put({
      Item: {
        id: cid,
        packageInfoId,
        date,
        ruleSet: ruleSet ? JSON.stringify(ruleSet) : ruleSet,
        ruleSetHash,
        result: null
      }
    });

    return await this.get({ cid });
  }

  public async updateResult({ cid, result }): Promise<any> {
    const updated = await this.evaluations.update({
      Key: { id: cid },
      UpdateExpression: 'set result = :r',
      ExpressionAttributeValues: {
        ':r': JSON.stringify(result)
      }
    });

    return { updated };
  }

  public async evaluate({ evaluationInfo, data }) {
    const result = await this.evaluateService({
      data,
      ruleSet: await this.getRuleSet({ ruleSet: evaluationInfo.ruleSet })
    });

    try {
      await this.packageInfoApi.updateState({
        id: evaluationInfo.packageInfoId,
        meta: data,
        type: 'SUCCEEDED'
      });

      await this.updateResult({
        cid: evaluationInfo.id,
        result
      });
    } catch (e) {
      await this.packageInfoApi.updateState({
        id: evaluationInfo.packageInfoId,
        meta: { message: 'error in evaluate' },
        type: 'FAILED'
      });
      throw e;
    }
  }
}
