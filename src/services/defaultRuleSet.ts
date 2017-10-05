import { mergeDeepRight as merge } from 'ramda';
import { Service, injectable, InjectionScope, param } from 'functionly';
import { RuleSet } from '../types';

export const DEFAULT_CORP_RULE_SET: RuleSet = {
  license: {
    exclude: [
      'AFL-3.0',
      'AGPL-3.0',
      'ECL-2.0',
      'EPL-1.0',
      'EUPL-1.1',
      'GPL-2.0',
      'GPL-3.0',
      'LGPL-2.1',
      'LGPL-3.0',
      'LPPL-1.3c',
      'MPL-2.0',
      'MS-RL',
      'OSL-3.0'
    ],
    include: [
      'Apache-2.0',
      'Artistic-2.0',
      'BSD-2-Clause',
      'BSD-3-Clause-Clear',
      'BSD-3-Clause',
      'BSL-1.0',
      'CC-BY-4.0',
      'CC-BY-SA-4.0',
      'CC0-1.0',
      'ISC',
      'MIT',
      'MS-PL',
      'NCSA',
      'OFL-1.1',
      'Unlicense',
      'WTFPL',
      'Zlib'
    ],
    licenseRequired: false,
    depth: null
  },
  version: {
    minVersion: '1.0.0',
    isRigorous: true,
    rigorousDepth: 1,
    retributionScore: 0.5
  },
  npmScores: {
    qualityWeight: 1,
    popularityWeight: 1,
    maintenanceWeight: 1
  }
};

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
