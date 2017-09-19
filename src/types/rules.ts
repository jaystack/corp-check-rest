export type LicenseRule = {
  include: string[];
  exclude: string[];
};

export type RuleSet = {
  license: LicenseRule;
};
