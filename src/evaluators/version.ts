import { Service, param, injectable, InjectionScope } from 'functionly';
import { Info as Data, VersionRule, Node, Evaluation, Log, Evaluator } from '../types';

const getLogs = (node: Node, { minVersion }: VersionRule) => {
  return minVersion && node.version < minVersion
    ? [
        {
          message: `Unstable version: ${node.version}`,
          type: 'ERROR'
        } as Log
      ]
    : [];
};

export default (({ node, rule, depth }) => {
  const logs = getLogs(node, rule);
  return {
    name: 'version',
    description: '',
    score: logs.length > 0 ? 0 : 1,
    logs
  };
}) as Evaluator<VersionRule>;
