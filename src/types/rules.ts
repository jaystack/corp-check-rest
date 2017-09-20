export type LicenseRule = {
  include?: string[];
  exclude?: string[];
  licenseRequired?: boolean;
  deepness?: number;
};

export type VersionRule = {
  minVersion: string;
  deepness?: number;
};

export type RuleSet = {
  license?: LicenseRule;
  version?: VersionRule;
};
