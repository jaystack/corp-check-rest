import { Service, param, injectable, InjectionScope } from 'functionly';
import { Info as Data, VersionRule, Package, Evaluation } from '../types';
import reduceTree from '../utils/reduceTree';

export type Error = {
  path: string[];
  version: string;
};

const treeReducer = (
  acc: Error[],
  pkg: Package,
  path: string[],
  { rule: { minVersion, depth } }: { rule: VersionRule }
) => {
  if (typeof depth === 'number' && path.length > depth + 1) return acc;
  if (minVersion && pkg.version < minVersion) return [ ...acc, { path, version: pkg.version, depth } ];
  return acc;
};

@injectable(InjectionScope.Singleton)
export default class Version extends Service {
  public async handle(@param data: Data, @param rule: VersionRule): Promise<Evaluation> {
    const errors = reduceTree<Error[], { rule: VersionRule }>(data.tree, treeReducer, [], { rule });
    return {
      name: 'version check',
      description: errors.length > 0 ? 'Invalid versions found' : 'Every version is valid',
      score: errors.length > 0 ? 0 : 1,
      meta: errors
    };
  }
}
