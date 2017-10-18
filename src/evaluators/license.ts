import { Service, param, injectable, InjectionScope } from 'functionly';
import { Node, PackageMeta, Evaluation, Log, Evaluator, LogType } from 'corp-check-core';
import { LicenseRule } from '../types';

const getLogs = (node: Node, { include, exclude, licenseRequired }: LicenseRule): Log[] => {
  if (licenseRequired && !node.license.type)
    return [
      {
        message: `Missing license`,
        type: LogType.ERROR
      } as Log
    ];

  if (!licenseRequired && !node.license.type) {
    return [];
  }

  const license = node.license.type.toLowerCase();

  if (exclude && exclude.map(l => l.toLowerCase()).includes(license))
    return [
      {
        message: `Forbidden license: ${node.license.type}`,
        type: LogType.ERROR
      } as Log
    ];

  if (include && !include.map(l => l.toLowerCase()).includes(license))
    return [
      {
        message: `Not allowed license: ${node.license.type}`,
        type: LogType.ERROR
      } as Log
    ];

  return [];
};

export default (({ node, rule, depth }) => {
  const logs = getLogs(node, rule);
  return {
    name: 'license',
    description: '',
    score: logs.length > 0 ? 0 : 1,
    logs
  } as Evaluation;
}) as Evaluator<LicenseRule>;
