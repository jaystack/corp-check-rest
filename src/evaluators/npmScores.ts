import { Service, param, injectable, InjectionScope } from 'functionly';
import { Node, NpmScoresRule, PackageMeta, Evaluation, Log } from '../types';

const getPercentage = (score: number): string => (Number.isFinite(score) ? Math.round(score * 100) + '%' : 'unknown');

@injectable(InjectionScope.Singleton)
export default class NpmScores extends Service {
  public async handle(
    @param node: Node,
    @param packageMeta: PackageMeta,
    @param rule: NpmScoresRule
  ): Promise<Evaluation> {
    const { npmScores: { quality = null, popularity = null, maintenance = null } = {} } = packageMeta;
    const { qualityWeight = 1, popularityWeight = 1, maintenanceWeight = 1 } = rule;
    return {
      name: 'npm-scores',
      description: '',
      score:
        (qualityWeight * quality + popularityWeight * popularity + maintenanceWeight * maintenance) /
        (qualityWeight + popularityWeight + maintenanceWeight),
      logs: [
        { type: 'INFO', message: `Quality: ${getPercentage(quality)}` },
        { type: 'INFO', message: `Popularity: ${getPercentage(popularity)}` },
        { type: 'INFO', message: `Maintenance: ${getPercentage(maintenance)}` }
      ]
    };
  }
}
