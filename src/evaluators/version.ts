import { Service, param, injectable, InjectionScope } from 'functionly';
import { Info as Data, VersionRule, Package, Evaluation, Log } from '../types';
import reduceTree from '../utils/reduceTree';

const treeReducer = ({ minVersion }: VersionRule) => (acc: Log[], pkg: Package, path: string[]) => {
  return minVersion && pkg.version < minVersion
    ? [
        ...acc,
        {
          message: `${pkg.name}@${pkg.version}`,
          type: 'ERROR',
          meta: { path, version: pkg.version }
        } as Log
      ]
    : acc;
};

@injectable(InjectionScope.Singleton)
export default class Version extends Service {
  public async handle(@param data: Data, @param rule: VersionRule): Promise<Evaluation> {
    const depth = typeof rule.depth === 'number' ? rule.depth : Infinity;
    const logs = reduceTree<Log[]>(data.tree, treeReducer(rule), [], depth);
    return {
      name: 'version check',
      description: logs.length > 0 ? `Invalid versions found (version < ${rule.minVersion})` : 'Every version is valid',
      score: logs.length > 0 ? 0 : 1,
      logs
    };
  }
}
