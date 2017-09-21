export type PackageInfo = {
  _id: any;
  hash: string;
  packageName?: string;
  packageJSON?: any;
  isProduction: boolean;
  date: Date;
  state: {
    date: Date;
    type: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  };
  latest: Boolean;
  meta: Object;
};
