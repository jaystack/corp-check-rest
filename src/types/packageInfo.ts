export enum StateType {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED'
}

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
    type: StateType;
  };
  latest: boolean;
  isNpmModule: boolean;
  meta: Object;
};
