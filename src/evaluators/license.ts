import { Service, param, injectable, InjectionScope } from 'functionly';
import { Node, PackageMeta, Evaluation, Log, LogType } from 'corp-check-core';
import { Evaluator, LicenseRule } from '../types';
import { valid, parse } from 'spdx';

const validateLicense = ({ tree, node, exclude, include, conjunction = false }) => {
  if (tree.license) {
    if (exclude && exclude.map(l => l.toUpperCase()).includes(tree.license))
      return [
        {
          message: `Forbidden license: ${conjunction ? tree.license : node.license.type}`,
          type: LogType.ERROR
        } as Log
      ];

    if (include && !include.map(l => l.toUpperCase()).includes(tree.license))
      return [
        {
          message: `Not allowed license: ${conjunction ? tree.license : node.license.type}`,
          type: LogType.ERROR
        } as Log
      ];

    return [];
  }

  if (tree.conjunction) {
    const left = validateLicense({ tree: tree.left, node, exclude, include, conjunction: true });
    const right = validateLicense({ tree: tree.right, node, exclude, include, conjunction: true });
    switch (tree.conjunction) {
      case 'or':
        if (!left.length) return left;
        if (!right.length) return right;
        return [ ...left, ...right ];
      case 'and':
        return [ ...left, ...right ];
      default:
        break;
    }
  }

  return [
    {
      message: `Invalid license: ${node.license.type}`,
      type: LogType.ERROR
    } as Log
  ];
};

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

  const license = node.license.type;

  if (!valid(license)) {
    return [
      {
        message: `Invalid license: ${node.license.type}`,
        type: LogType.ERROR
      } as Log
    ];
  }

  const tree = parse(license);
  return validateLicense({ tree, node, exclude, include });
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
