import { Service, param, injectable, InjectionScope } from 'functionly';
import { Node, LicenseRule, PackageMeta, Evaluation, Log } from '../types';

const getLogs = (node: Node, { include, exclude, licenseRequired }: LicenseRule): Log[] => {
  if (licenseRequired && !node.license.type)
    return [
      {
        message: `Missing license`,
        type: 'ERROR'
      } as Log
    ];

  if (!licenseRequired && !node.license.type) {
    return [];
  }

  const license = node.license.type.toLowerCase();

  if (exclude && exclude.map(l => l.toLowerCase()).includes(license))
    return [
      {
        message: `Unallowed license: '${node.license.type}'`,
        type: 'ERROR'
      } as Log
    ];

  if (include && !include.map(l => l.toLowerCase()).includes(license))
    return [
      {
        message: `Unknown license: '${node.license.type}'`,
        type: 'ERROR'
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
      description: '',
      score: logs.length > 0 ? 0 : 1,
      logs
    } as Evaluation;
  }
}
