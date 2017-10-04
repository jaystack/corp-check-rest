import { Service, param, injectable, InjectionScope } from 'functionly';
import { Info as Data, VersionRule, Node, Evaluation, Log, Evaluator, LogType } from '../types';

const getLogs = (node: Node, depth: number, { minVersion, isRigorous, rigorousDepth }: VersionRule) => {
  if (!minVersion) return [];
  if (minVersion && node.version >= minVersion) return [];
  return [
    {
      message: `Unstable version: ${node.version}`,
      type: isRigorous && depth <= rigorousDepth ? LogType.ERROR : LogType.WARNING
    } as Log
  ];
};

export default (({ node, rule, depth }) => {
  const logs = getLogs(node, depth, rule);
  return {
    name: 'version',
    description: '',
    score: logs.length > 0 ? (logs[0].type === LogType.ERROR ? 0 : rule.retributionScore) : 1,
    logs
  };
}) as Evaluator<VersionRule>;
