import { Service, param, injectable, InjectionScope } from 'functionly';
import { Info as Data, VersionRule, Node, Evaluation, Log } from '../types';

const getLogs = (node: Node, { minVersion }: VersionRule) => {
  return minVersion && node.version < minVersion
    ? [
        {
          message: `Unstable version: ${node.version}`,
          type: 'ERROR'
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
      description: '',
      score: logs.length > 0 ? 0 : 1,
      logs
    };
  }
}
