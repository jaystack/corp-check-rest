import { Api, inject, injectable, InjectionScope } from 'functionly';
import { PackageInfoCollection } from '../stores/mongoCollections';
import { GetNpmInfo } from '../services/npm';
import * as getHash from 'hash-sum';
import { PackageInfo } from '../types';

const NPM_PACKAGE_NAME_PATTERN = /^((@([^@]+)\/)?([^@]+))(@(.*))?$/;

@injectable(InjectionScope.Singleton)
export class PackageInfoApi extends Api {
  constructor(
    @inject(GetNpmInfo) private getNPMInfo,
    @inject(PackageInfoCollection) private packageInfoCollection: PackageInfoCollection
  ) {
    super();
  }

  public async fromPackageJSON({ packageJSON, isProduction }: { packageJSON: Object; isProduction: boolean }) {
    const hash = getHash(isProduction.toString() + JSON.stringify(packageJSON));

    let info = await this.get({ hash });
    if (!info) {
      info = await this.create({
        hash,
        packageJSON,
        isProduction: true
      });
    }

    return info;
  }

  public async fromPackageName({ packageName }: { packageName: string }) {
    let [ , name, , , , , version ] = NPM_PACKAGE_NAME_PATTERN.exec(packageName);

    const packageInfo = await this.getNPMInfo({ name, version });
    const hash = getHash(`${packageInfo.name}@${packageInfo.version}`);

    let info = await this.get({ hash });
    if (!info) {
      info = await this.create({
        hash,
        packageName: `${packageInfo.name}@${packageInfo.version}`,
        isProduction: true
      });
    }

    return info;
  }

  public async get({ hash }) {
    return await this.packageInfoCollection.findOne<PackageInfo>({ hash });
  }

  public async getById({ _id }) {
    return await this.packageInfoCollection.findOne<PackageInfo>({ _id });
  }

  public async create({
    hash,
    packageName,
    packageJSON,
    isProduction
  }: {
    hash: string;
    packageName?: string;
    packageJSON?: Object;
    isProduction: boolean;
  }) {
    const date = Date.now();
    const item = await this.packageInfoCollection.insertOne({
      hash,
      packageName,
      packageJSON,
      isProduction,
      date,
      state: {
        date,
        type: 'PENDING'
      },
      latest: true
    });

    return await this.get({ hash });
  }

  public async updateState({ _id, type, meta }) {
    const updated = await this.packageInfoCollection.updateOne(
      { _id },
      {
        $set: {
          meta: meta || null,
          state: { type, date: Date.now() }
        }
      }
    );

    return { updated };
  }
}
