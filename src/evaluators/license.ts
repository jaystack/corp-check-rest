import { Service, param, injectable, InjectionScope } from 'functionly';
import { Info as Data, LicenseRule, Package, Evaluation, Log } from '../types';
import reduceTree from '../utils/reduceTree';

const treeReducer = ({ include, exclude, licenseRequired }: LicenseRule) => (
  acc: Log[],
  pkg: Package,
  path: string[]
) => {
  if (licenseRequired && !pkg.license.type)
    return [
      ...acc,
      {
        message: `${pkg.name} missing license`,
        type: 'ERROR',
        meta: { path, licenseType: pkg.license.type, type: 'NOTDEFINED' }
      } as Log
    ];

  if (!licenseRequired && !pkg.license.type) {
    return acc;
  }

  if (exclude && exclude.includes(pkg.license.type))
    return [
      ...acc,
      {
        message: `${pkg.name} has excluded license`,
        type: 'ERROR',
        meta: { path, licenseType: pkg.license.type, type: 'CONTAINS' }
      } as Log
    ];

  if (include && !include.includes(pkg.license.type))
    return [
      ...acc,
      {
        message: `${pkg.name} license is not allowed`,
        type: 'ERROR',
        meta: { path, licenseType: pkg.license.type, type: 'MISSING' }
      } as Log
    ];

  return acc;
};

@injectable(InjectionScope.Singleton)
export default class License extends Service {
  public async handle(@param data: Data, @param rule: LicenseRule): Promise<Evaluation> {
    const depth = typeof rule.depth === 'number' ? rule.depth : Infinity;
    const logs = reduceTree<Log[]>(data.tree, treeReducer(rule), [], depth);
    return {
      name: 'License check',
      description: logs.length > 0 ? 'Invalid licenses found' : 'Every license is valid',
      score: logs.length > 0 ? 0 : 1,
      logs
    };
  }
}
