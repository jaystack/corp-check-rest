export type LicenseRule = {
  include?: string[];
  exclude?: string[];
  licenseRequired?: boolean;
  depth?: number;
};

export type VersionRule = {
  minVersion: string;
  depth?: number;
};

export type RuleSet = {
  license?: LicenseRule;
  version?: VersionRule;
};
