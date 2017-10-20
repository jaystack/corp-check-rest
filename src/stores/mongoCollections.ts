import { DynamoTable, MongoCollection, MongoConnection } from 'functionly';
import { injectable, mongoCollection, inject, container, environment, InjectionScope } from 'functionly';
import { KMSApi } from '../services/aws/kms';

export const STAGE_ENDPOINTS = {
  local: 'mongodb://localhost:27017/corp-check',
  dev:
    'AQICAHjLPCiyfkkMKPgAeOmVYE2S22YSQdPPXzuq04fafcsrmgFq7TETyIDlZsAsQmHvEXbyAAAAszCBsAYJKoZIhvcNAQcGoIGiMIGfAgEAMIGZBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDOxHpV4kijdqMy9YngIBEIBs/LzD9il8DcGMfAl9YU375IH8tT6ulg8I/uYVcN2nxHP4DIolcWuWANfQ+R0rQ6ALV3ZgMwBYxgYP281HEizk47nwpFTlnAFhDK8HCUantJ2/PqXmcygfHsZHQ+bvkRfLZaB/+6gG1CbL7emP',
  stage:
    'AQICAHieI8COkiRibR7UT7cKVSNHX3UIf6QC6q2fr9NI+KiohQHR7uU7zVOxrlyjV5pdkbHWAAAAtTCBsgYJKoZIhvcNAQcGoIGkMIGhAgEAMIGbBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDEdTB7Z0bklWpe9pHAIBEIBu2jD+yI/ae3EQ47D9zAt6nkVJICovW7RlMVH/LdUHA9aPpTXLHAcRVIrD9LrfAWst8e+OhgmKCgfnduNN2w51sxP2DgxTiBuPsbeA3jFV/hJ/UsRIuieZbozz5FIIN+mZpHH0sTNF4DdM7pF1mKM=',
  prod:
    'AQICAHi0wVEzIAaq+zvhiv+TiZtDf3FSEjRPpFsgq5nTlUqjhgEMvC+BCY9BWNO0pgggFIwNAAAArzCBrAYJKoZIhvcNAQcGoIGeMIGbAgEAMIGVBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDLuyTerDR/MBe8byiQIBEIBog76np0N3L8yTgePrwrVan7W+2GchQXq/45o9NUQ6I5FNN1n17e4r9mmcAiiFlywT7EKpwEE6v+p0HkCWRSLJt9lm4NzESgkgq4a+iAS2+wbzzuTBB3avt/G8KPRRjlMWwyU7LLyhHnA=',
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

/* change default mongo connection */
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
