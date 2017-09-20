import { Service, param, injectable, InjectionScope } from 'functionly';
import { Info as Data, LicenseRule, Package, Evaluation } from '../types';
import reduceTree from '../utils/reduceTree';

export type ErrorType = 'MISSING' | 'CONTAINS' | 'NOTDEFINED';

export type Error = {
  path: string[];
  licenseType: string;
  type: ErrorType;
};

const treeReducer = (
  acc: Error[],
  pkg: Package,
  path: string[],
  depth: number,
  { rule: { include, exclude, licenseRequired, deepness } }: { rule: LicenseRule }
) => {
  if (typeof deepness === 'number' && depth > deepness) return [ ...acc ];

  if (licenseRequired && !pkg.license.type)
    return [ ...acc, { path, licenseType: pkg.license.type, type: 'NOTDEFINED' as ErrorType } ];

  if (!licenseRequired && !pkg.license.type) {
    return [ ...acc ];
  }

  if (exclude && exclude.includes(pkg.license.type))
    return [ ...acc, { path, licenseType: pkg.license.type, type: 'CONTAINS' as ErrorType } ];

  if (include && !include.includes(pkg.license.type))
    return [ ...acc, { path, licenseType: pkg.license.type, type: 'MISSING' as ErrorType } ];

  return [ ...acc ];
};

@injectable(InjectionScope.Singleton)
export default class License extends Service {
  public async handle(@param data: Data, @param rule: LicenseRule): Promise<Evaluation> {
    const errors = reduceTree<Error[], { rule: LicenseRule }>(data.tree, treeReducer, [], { rule });
    return {
      name: 'License check',
      description: errors.length > 0 ? 'Invalid licenses found' : 'Every license is valid',
      score: errors.length > 0 ? 0 : 1,
      meta: errors
    };
  }
}
