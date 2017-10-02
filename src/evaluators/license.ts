import { Service, param, injectable, InjectionScope } from 'functionly';
import { Node, LicenseRule, PackageMeta, Evaluation, Log } from '../types';

const getLogs = (node: Node, { include, exclude, licenseRequired }: LicenseRule): Log[] => {
  if (licenseRequired && !node.license.type)
    return [
      {
        message: `missing license`,
        type: 'ERROR',
        meta: { licenseType: node.license.type, type: 'NOTDEFINED' }
      } as Log
    ];

  if (!licenseRequired && !node.license.type) {
    return [];
  }

  const license = node.license.type.toLowerCase();

  if (exclude && exclude.map(l => l.toLowerCase()).includes(license))
    return [
      {
        message: `has excluded license '${node.license.type}'`,
        type: 'ERROR',
        meta: { licenseType: node.license.type, type: 'CONTAINS' }
      } as Log
    ];

  if (include && !include.map(l => l.toLowerCase()).includes(license))
    return [
      {
        message: `not allowed '${node.license.type}'`,
        type: 'ERROR',
        meta: { licenseType: node.license.type, type: 'MISSING' }
      } as Log
    ];

  return [];
};

@injectable(InjectionScope.Singleton)
export default class License extends Service {
  public async handle(@param node: Node, @param rule: LicenseRule): Promise<Evaluation> {
    const logs = getLogs(node, rule);
    return {
      name: 'license',
      description: logs.length > 0 ? 'Invalid license' : 'License is valid',
      score: logs.length > 0 ? 0 : 1,
      logs
    } as Evaluation;
  }
}
