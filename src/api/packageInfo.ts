import { Api, inject, injectable, InjectionScope, environment } from 'functionly';
import { PackageInfoCollection } from '../stores/mongoCollections';
import { GetNpmInfo } from '../services/npm';
import { FileStorage } from '../stores/s3filestorages';
import * as getHash from 'hash-sum';
import { PackageInfo, StateType } from '../types';

const NPM_PACKAGE_NAME_PATTERN = /^((@([^@]+)\/)?([^@]+))(@(.*))?$/;

@injectable(InjectionScope.Singleton)
@environment('PACKAGE_PENDING_EXPIRATION_IN_MINUTES', '10')
export class PackageInfoApi extends Api {
  private pendingMaxMinutes = 10;
  constructor(
    @inject(GetNpmInfo) private getNPMInfo,
    @inject(PackageInfoCollection) private packageInfoCollection: PackageInfoCollection,
    @inject(FileStorage) private files: FileStorage
  ) {
    super();
    this.pendingMaxMinutes = process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES || 10;
  }

  public async fromPackageJSON({
    packageJSON,
    packageLock,
    yarnLock,
    isProduction,
    persistBinaries
  }: {
    packageJSON: string;
    packageLock?: string;
    yarnLock?: string;
    isProduction: boolean;
    persistBinaries?: boolean;
  }) {
    const hash = getHash(isProduction.toString() + packageJSON + packageLock + yarnLock);

    let pj = {};
    try {
      pj = JSON.parse(packageJSON);
    } catch (e) {
      throw new Error('Invalid package.json');
    }

    let created = false;
    let info = await this.get({ hash });
    if (!info) {
      info = await this.create({
        hash,
        packageName: `${pj['name']}@${pj['version']}`,
        packageJSON,
        packageLock,
        yarnLock,
        isProduction,
        isNpmModule: false,
        persistBinaries
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
        isProduction: false,
        isNpmModule: true
      });
      created = true;
    }

    return { packageInfo: info, created };
  }

  public async get({ hash }) {
    return await this.assertTimeout(await this.packageInfoCollection.findOne<PackageInfo>({ hash, latest: true }));
  }

  public async getById({ _id }) {
    return await this.assertTimeout(await this.packageInfoCollection.findOne<PackageInfo>({ _id }));
  }

  public async getByIds(ids: any[]): Promise<PackageInfo[]> {
    return await this.assertTimeout(
      await this.packageInfoCollection.find<PackageInfo>({ _id: { $in: ids } }).toArray()
    );
  }

  public async create({
    hash,
    packageName,
    packageJSON,
    packageJSONS3Key,
    packageLock,
    packageLockS3Key,
    yarnLock,
    yarnLockS3Key,
    isProduction,
    isNpmModule,
    persistBinaries
  }: {
    hash: string;
    packageName?: string;
    packageJSON?: string;
    packageJSONS3Key?: string;
    packageLock?: string;
    packageLockS3Key?: string;
    yarnLock?: string;
    yarnLockS3Key?: string;
    isProduction: boolean;
    isNpmModule: boolean;
    persistBinaries?: boolean;
  }) {
    const date = Date.now();

    if (persistBinaries) {
      packageJSONS3Key = packageJSONS3Key || (await this.uploadFile(`packages/${hash}/package.json`, packageJSON));
      packageLockS3Key = packageLockS3Key || (await this.uploadFile(`packages/${hash}/package-lock.json`, packageLock));
      yarnLockS3Key = yarnLockS3Key || (await this.uploadFile(`packages/${hash}/yarn.lock`, yarnLock));
    }

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
        type: StateType.PENDING
      },
      latest: true,
      isNpmModule
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

  public async setProgress({ _id, message }): Promise<any> {
    const updated = await this.packageInfoCollection.updateOne(
      { _id, 'state.type': StateType.PENDING },
      {
        $set: {
          'state.date': Date.now(),
          'state.message': message
        }
      }
    );

    return { updated };
  }

  public async updateMany(filter, update): Promise<any> {
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

  private async assertTimeout<T>(it: T): Promise<T> {
    if (Array.isArray(it)) {
      const result = [];
      for (const item of it) {
        result.push(await this.checkTimeout(<PackageInfo>item));
      }
      return <any>result;
    } else {
      const item: any = it;
      return <any>await this.checkTimeout(<PackageInfo>item);
    }
  }

  private async checkTimeout(item: PackageInfo) {
    if (!item || item.state.type !== StateType.PENDING) return item;

    const diff = Math.abs(Date.now() - item.date);
    if (diff <= this.pendingMaxMinutes * 60 * 1000) return item;

    await this.updateState({ _id: item._id, type: StateType.FAILED, meta: { error: 'timeout' } });
    return await this.packageInfoCollection.findOne<PackageInfo>({ _id: item._id });
  }
}
