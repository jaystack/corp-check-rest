import { Api, inject, injectable, InjectionScope } from 'functionly';
import { PackageInfoCollection } from '../stores/mongoCollections';
import { GetNpmInfo } from '../services/npm';
import { FileStorage } from '../stores/s3filestorages';
import * as getHash from 'hash-sum';
import { PackageInfo } from '../types';

const NPM_PACKAGE_NAME_PATTERN = /^((@([^@]+)\/)?([^@]+))(@(.*))?$/;

@injectable(InjectionScope.Singleton)
export class PackageInfoApi extends Api {
  constructor(
    @inject(GetNpmInfo) private getNPMInfo,
    @inject(PackageInfoCollection) private packageInfoCollection: PackageInfoCollection,
    @inject(FileStorage) private files: FileStorage
  ) {
    super();
  }

  public async fromPackageJSON({
    packageJSON,
    packageLock,
    yarnLock,
    isProduction
  }: {
    packageJSON: Object;
    packageLock?: Object;
    yarnLock?: string;
    isProduction: boolean;
  }) {
    const hash = getHash(
      isProduction.toString() + JSON.stringify(packageJSON) + JSON.stringify(packageLock) + JSON.stringify(yarnLock)
    );

    let created = false;
    let info = await this.get({ hash });
    if (!info) {
      info = await this.create({
        hash,
        packageName: `${packageJSON['name']}@${packageJSON['version']}`,
        packageJSON,
        packageLock,
        yarnLock,
        isProduction,
        isNpmModule: false
      });
      created = true;
    }

    return { packageInfo: info, created };
  }

  public async fromPackageName({ packageName }: { packageName: string }) {
    let [ , name, , , , , version ] = NPM_PACKAGE_NAME_PATTERN.exec(packageName);

    const packageInfo = await this.getNPMInfo({ name, version });
    const hash = getHash(`${packageInfo.name}@${packageInfo.version}`);

    let created = false;
    let info = await this.get({ hash });
    if (!info) {
      info = await this.create({
        hash,
        packageName: `${packageInfo.name}@${packageInfo.version}`,
        isProduction: true,
        isNpmModule: true
      });
      created = true;
    }

    return { packageInfo: info, created };
  }

  public async get({ hash }) {
    return await this.packageInfoCollection.findOne<PackageInfo>({ hash, latest: true });
  }

  public async getById({ _id }) {
    return await this.packageInfoCollection.findOne<PackageInfo>({ _id });
  }

  public async create({
    hash,
    packageName,
    packageJSON,
    packageLock,
    yarnLock,
    isProduction,
    isNpmModule
  }: {
    hash: string;
    packageName?: string;
    packageJSON?: Object;
    packageLock?: Object;
    yarnLock?: string;
    isProduction: boolean;
    isNpmModule: boolean;
  }) {
    const date = Date.now();

    const packageJSONS3Key = await this.uploadFile(
      `packages/${hash}/package.json`,
      packageJSON && JSON.stringify(packageJSON)
    );
    const packageLockS3Key = await this.uploadFile(
      `packages/${hash}/package-lock.json`,
      packageLock && JSON.stringify(packageLock)
    );
    const yarnLockS3Key = await this.uploadFile(`packages/${hash}/yarn.lock`, yarnLock);

    const item = await this.packageInfoCollection.insertOne({
      hash,
      packageName,
      packageJSONS3Key,
      packageLockS3Key,
      yarnLockS3Key,
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

  public async updateState({ _id, type, meta }): Promise<any> {
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

  public async updateMany(filter, update) {
    return await this.packageInfoCollection.updateMany(filter, {
      $set: update
    });
  }

  private async uploadFile(key: string, body?: Object) {
    if (body) {
      await this.files.putObject({
        Body: body,
        Key: key
      });

      return key;
    }

    return undefined;
  }
}
