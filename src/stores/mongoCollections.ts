import { DynamoTable, MongoCollection, MongoConnection } from 'functionly';
import { injectable, mongoCollection, inject, container, environment, InjectionScope } from 'functionly';
import { KMSApi } from '../services/aws/kms';

export const MONGO_CONNECTION_URL = 'MONGO_CONNECTION_URL';

/* KMS resolve connection */
@injectable(InjectionScope.Singleton)
export class KMSResolveMongoConnection extends MongoConnection {
  private resolutions: Map<string, string>;
  constructor(@inject(KMSApi) private kmsApi: KMSApi) {
    super();
    this.resolutions = new Map<string, string>();
  }

  public async connect(url: string) {
    const mongoUrl =
      url || process.env[`${MONGO_CONNECTION_URL}-${process.env.FUNCTIONAL_STAGE}`] || process.env.MONGO_CONNECTION_URL;

    if (/^mongodb/.test(mongoUrl)) return super.connect(mongoUrl);

    if (this.resolutions.has(mongoUrl)) {
      const decryptedUrl = this.resolutions.get(mongoUrl);
      return super.connect(decryptedUrl);
    }

    const decryptedUrl = await this.kmsApi.decrypt(mongoUrl);
    this.resolutions.set(mongoUrl, decryptedUrl);

    return super.connect(decryptedUrl);
  }
}

/* chance default mongo connection */
container.registerType(MongoConnection, KMSResolveMongoConnection);

/* local endpoint */
export const mongoConnection = (url: string, stage: string = '') =>
  environment(`${MONGO_CONNECTION_URL}${stage ? '-' + stage : ''}`, url);

@mongoConnection('mongodb://localhost:27017/corp-check')
@mongoConnection(
  'AQICAHjLPCiyfkkMKPgAeOmVYE2S22YSQdPPXzuq04fafcsrmgFxtqO4hJWgzcWRou40m2ROAAAAhzCBhAYJKoZIhvcNAQcGoHcwdQIBADBwBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDDDabW5aWG9fuj+ciQIBEIBDv3nBYNbh5qm1EBdK/xR9x5nehcFBz/TvQw4sjouGkW8jiM8cGzh71CNF8EzzwVTneWORPcsPyu7zmXrAMJsQHO48tQ==',
  'dev'
)
@mongoConnection('mongodb://localhost:27017/corp-check', 'stage')
@mongoConnection('mongodb://localhost:27017/corp-check', 'prod')
export class CorpCheckCollection extends MongoCollection {}

/* Collections */
@injectable()
@mongoCollection({ collectionName: '%ClassName%_corp_check' })
export class PackageInfoCollection extends CorpCheckCollection {}

@injectable()
@mongoCollection({ collectionName: '%ClassName%_corp_check' })
export class Evaluations extends CorpCheckCollection {}

@injectable()
@mongoCollection({ collectionName: '%ClassName%_corp_check' })
export class ModuleMetadataCache extends CorpCheckCollection {}
