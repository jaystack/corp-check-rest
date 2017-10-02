import { DynamoTable, MongoCollection, MongoConnection, mongoConnection } from 'functionly';
import { injectable, mongoCollection, inject, container, environment, InjectionScope } from 'functionly';
import { KMSApi } from '../services/aws/kms';

export const STAGE_ENDPOINTS = {
  dev:
    'AQICAHjLPCiyfkkMKPgAeOmVYE2S22YSQdPPXzuq04fafcsrmgFq7TETyIDlZsAsQmHvEXbyAAAAszCBsAYJKoZIhvcNAQcGoIGiMIGfAgEAMIGZBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDOxHpV4kijdqMy9YngIBEIBs/LzD9il8DcGMfAl9YU375IH8tT6ulg8I/uYVcN2nxHP4DIolcWuWANfQ+R0rQ6ALV3ZgMwBYxgYP281HEizk47nwpFTlnAFhDK8HCUantJ2/PqXmcygfHsZHQ+bvkRfLZaB/+6gG1CbL7emP',
  default: ''
};
export const DEFAULT_MONGO_ENDPOINT = 'mongodb://localhost:27017/corp-check';

/* KMS resolve connection */
@injectable(InjectionScope.Singleton)
export class KMSResolveMongoConnection extends MongoConnection {
  private resolutions: Map<string, string>;
  constructor(@inject(KMSApi) private kmsApi: KMSApi) {
    super();
    this.resolutions = new Map<string, string>();
  }

  public async connect(url: string): Promise<any> {
    const mongoUrl =
      url ||
      process.env.MONGO_CONNECTION_URL ||
      STAGE_ENDPOINTS[process.env.FUNCTIONAL_STAGE] ||
      DEFAULT_MONGO_ENDPOINT;

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

/* Collections */
@injectable()
@mongoCollection({ collectionName: '%ClassName%_corp_check' })
export class PackageInfoCollection extends MongoCollection {}

@injectable()
@mongoCollection({ collectionName: '%ClassName%_corp_check' })
export class Evaluations extends MongoCollection {}

@injectable()
@mongoCollection({ collectionName: '%ClassName%_corp_check' })
export class ModuleMetadataCache extends MongoCollection {}
