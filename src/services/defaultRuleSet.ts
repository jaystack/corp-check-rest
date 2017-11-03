import { mergeDeepRight as merge } from 'ramda';
import { Service, injectable, InjectionScope, param } from 'functionly';
import { RuleSet } from '../types';

export const DEFAULT_CORP_RULE_SET: RuleSet = require('../../../default-rules');

/**
 * TODO
 * For turning on and off a plugin you should skip
 * his key-value pair from the rule set. So the final
 * solution is deep merging plugin rules one by one.
 */

@injectable(InjectionScope.Singleton)
export class GetRuleSet extends Service {
  public async handle(@param ruleSet: RuleSet) {
    return merge(DEFAULT_CORP_RULE_SET, ruleSet || {});
  }
}
