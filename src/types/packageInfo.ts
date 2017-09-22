export type PackageInfo = {
  _id: any;
  hash: string;
  packageName?: string;
  packageJSON?: any;
  isProduction: boolean;
  date: number;
  state: {
    date: number;
    type: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  };
  latest: Boolean;
  meta: Object;
};
