import { Service, param, injectable, InjectionScope } from 'functionly';
import { Info as Data, Node, Evaluation, Log, LogType } from 'corp-check-core';
import { Evaluator, VersionRule } from '../types';

const getVersionLogs = (node: Node, depth: number, { minVersion, isRigorous, rigorousDepth }: VersionRule): Log[] => {
  if (!minVersion) return [];
  if (minVersion && node.version >= minVersion) return [];
  return [
    {
      message: `Unstable version: ${node.version}`,
      type: isRigorous && (!Number.isFinite(rigorousDepth) || depth <= rigorousDepth) ? LogType.ERROR : LogType.WARNING
    }
  ];
};

const getUnknownPackageLogs = (unknownPackages: string[]): Log[] =>
  unknownPackages.map(name => ({
    type: LogType.WARNING,
    message: `Unknown package: ${name}`
  }));

const getLogs = (node: Node, unknownPackages: string[], depth: number, rule: VersionRule): Log[] => {
  const versionLogs = getVersionLogs(node, depth, rule);
  return depth === 0 ? [ ...getUnknownPackageLogs(unknownPackages), ...versionLogs ] : versionLogs;
};

export default (({ node, rule, unknownPackages, depth }) => {
  const logs = getLogs(node, unknownPackages, depth, rule);
  return {
    name: 'version',
    description: '',
    score: logs.length > 0 ? (logs[0].type === LogType.ERROR ? 0 : rule.retributionScore || 0) : 1,
    logs
  };
}) as Evaluator<VersionRule>;
