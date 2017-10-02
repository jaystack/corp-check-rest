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

export type NpmScoresRule = {
  qualityWeight?: number;
  popularityWeight?: number;
  maintenanceWeight?: number;
};

export type RuleSet = {
  license?: LicenseRule;
  version?: VersionRule;
  npmScores?: NpmScoresRule;
};
