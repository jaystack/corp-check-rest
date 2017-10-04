export type PackageInfo = {
  _id: any;
  hash: string;
  packageName?: string;
  packageJSONS3Key?: string;
  packageLockS3Key?: string;
  yarnLockS3Key?: string;
  isProduction: boolean;
  date: number;
  state: {
    date: number;
    type: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  };
  latest: boolean;
  isNpmModule: boolean;
  meta: Object;
};
