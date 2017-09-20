import { Service, param, injectable, InjectionScope } from 'functionly';
import { Info as Data, VersionRule, Package, Evaluation } from '../types';
import reduceTree from '../utils/reduceTree';

export type Error = {
  path: string[];
  version: string;
};

const treeReducer = ({ minVersion }: VersionRule) => (acc: Error[], pkg: Package, path: string[]) => {
  return minVersion && pkg.version < minVersion ? [ ...acc, { path, version: pkg.version } ] : acc;
};

@injectable(InjectionScope.Singleton)
export default class Version extends Service {
  public async handle(@param data: Data, @param rule: VersionRule): Promise<Evaluation> {
    const depth = typeof rule.depth === 'number' ? rule.depth : Infinity;
    const errors = reduceTree<Error[]>(data.tree, treeReducer(rule), [], depth);
    return {
      name: 'version check',
      description: errors.length > 0 ? 'Invalid versions found' : 'Every version is valid',
      score: errors.length > 0 ? 0 : 1,
      meta: errors
    };
  }
}
