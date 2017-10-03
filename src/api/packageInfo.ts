import { Api, inject, injectable, InjectionScope } from 'functionly';
import { PackageInfoCollection } from '../stores/dynamoTables';
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

    let created = false;
    let info = await this.get({ hash });
    if (!info) {
      info = await this.create({
        hash,
        packageJSON,
        isProduction: true
      });
      created = true;
    }

    return {
      packageInfo: this.transformItem(info),
      created
    };
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
        isProduction: true
      });
      created = true;
    }

    return {
      packageInfo: this.transformItem(info),
      created
    };
  }

  public async get({ hash }) {
    const item = (await this.packageInfoCollection.scan({
      FilterExpression: 'hash = :phash and latest = :latest',
      ExpressionAttributeValues: {
        ':phash': hash,
        ':latest': true
      }
    })).Items[0];
    return this.transformItem(item);
  }

  public async getById({ id }) {
    const item = (await this.packageInfoCollection.get({ Key: { id } })).Item;
    return this.transformItem(item);
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
    const item = await this.packageInfoCollection.put({
      Item: {
        hash,
        packageName,
        packageJSON: packageJSON ? JSON.stringify(packageJSON) : packageJSON,
        isProduction,
        date,
        state: {
          date,
          type: 'PENDING'
        },
        latest: true
      }
    });

    return await this.get({ hash });
  }

  public async updateState({ id, type, meta }): Promise<any> {
    const updated = await this.packageInfoCollection.update({
      Key: { id },
      UpdateExpression: 'set meta = :m and date = :d',
      ExpressionAttributeValues: {
        ':m': meta ? JSON.stringify(meta) : null,
        ':d': Date.now()
      },
      ReturnValues: 'UPDATED_NEW'
    });

    return { updated };
  }

  public async updateMany(filter, update) {
    const _filterExprArray = [];
    const _filter: any = {};
    Object.keys(filter).forEach(key => {
      _filterExprArray.push(`${key} = :p_${key}`);
      _filter[`:p_${key}`] = filter[key];
    });

    const items = (await this.packageInfoCollection.scan({
      FilterExpression: _filterExprArray.join(' and '),
      ExpressionAttributeValues: _filter
    })).Items;

    const _updateExprArray = [];
    const _update: any = {};
    Object.keys(update).forEach(key => {
      _updateExprArray.push(`${key} = :p_${key}`);
      _update[`:p_${key}`] = filter[key];
    });

    for (const item of items) {
      await this.packageInfoCollection.update({
        Key: { id: item.id },
        UpdateExpression: `set ${_updateExprArray.join(' and ')}`,
        ExpressionAttributeValues: _update
      });
    }
  }

  private transformItem(item) {
    return <PackageInfo>{
      ...item,
      packageJSON: typeof item.packageJSON === 'string' ? JSON.parse(item.packageJSON) : item.packageJSON,
      meta: typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta
    };
  }
}
