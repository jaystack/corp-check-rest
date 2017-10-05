import { Service, param, injectable, InjectionScope } from 'functionly';
import { Node, NpmScoresRule, PackageMeta, Evaluation, Log, LogType, Evaluator } from '../types';

const getPercentage = (score: number): string => (Number.isFinite(score) ? Math.round(score * 100) + '%' : 'unknown');
const getLogType = (value: number): LogType => (value < 0.5 ? LogType.WARNING : LogType.INFO);

export default (({ node, packageMeta, rule, depth }) => {
  const { npmScores: { quality = null, popularity = null, maintenance = null } = {} } = packageMeta;
  const { qualityWeight = 1, popularityWeight = 1, maintenanceWeight = 1 } = rule;
  return {
    name: 'npm-scores',
    description: '',
    score:
      (qualityWeight * quality + popularityWeight * popularity + maintenanceWeight * maintenance) /
      (qualityWeight + popularityWeight + maintenanceWeight),
    logs: [
      { type: getLogType(quality), message: `Quality: ${getPercentage(quality)}` },
      { type: getLogType(popularity), message: `Popularity: ${getPercentage(popularity)}` },
      { type: getLogType(maintenance), message: `Maintenance: ${getPercentage(maintenance)}` }
    ]
  };
}) as Evaluator<NpmScoresRule>;
