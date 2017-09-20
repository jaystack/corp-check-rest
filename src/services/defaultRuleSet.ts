import { Service, injectable, InjectionScope, param } from 'functionly';
import { RuleSet } from '../types';

export const DEFAULT_CORP_RULE_SET: RuleSet = {
  license: {
    exclude: [ 'GPLv2' ],
    licenseRequired: true,
    depth: null
  },
  version: {
    minVersion: '1.0.0',
    depth: null
  }
};

@injectable(InjectionScope.Singleton)
export class GetRuleSet extends Service {
  public async handle(@param ruleSet: RuleSet) {
    return ruleSet || DEFAULT_CORP_RULE_SET;
  }
}
