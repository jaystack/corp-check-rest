import { Service, param, injectable, InjectionScope } from 'functionly';
import { Info as Data, VersionRule, Node, Evaluation, Log } from '../types';

const getLogs = (node: Node, { minVersion }: VersionRule) => {
  return minVersion && node.version < minVersion
    ? [
        {
          message: node.version,
          type: 'ERROR',
          meta: { version: node.version }
        } as Log
      ]
    : [];
};

@injectable(InjectionScope.Singleton)
export default class Version extends Service {
  public async handle(@param node: Node, @param rule: VersionRule): Promise<Evaluation> {
    const logs = getLogs(node, rule);
    return {
      name: 'version',
      description: logs.length > 0 ? `Invalid version` : 'Version is valid',
      score: logs.length > 0 ? 0 : 1,
      logs
    };
  }
}
