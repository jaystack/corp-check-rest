import { injectable, InjectionScope, Api } from 'functionly';
import { KMS } from 'aws-sdk';

const kms = new KMS();

@injectable(InjectionScope.Singleton)
export class KMSApi extends Api {
  private kms = null;
  public constructor() {
    super();

    let kmsConfig: any = {};
    if (process.env.FUNCTIONAL_ENVIRONMENT === 'local') {
      kmsConfig.apiVersion = '2014-11-01';
      kmsConfig.region = process.env.AWS_REGION || 'eu-central-1';

      console.log('Local KMS configuration');
      console.log(
        JSON.stringify(
          {
            apiVersion: kmsConfig.apiVersion,
            'region (process.env.AWS_REGION)': kmsConfig.region
          },
          null,
          2
        )
      );
    }

    this.kms = new KMS(kmsConfig);
  }

  public getKMS() {
    return this.kms;
  }

  public decrypt(token: string) {
    return new Promise<string>((resolve, reject) => {
      return this.kms.decrypt(
        { CiphertextBlob: new Buffer(token, 'base64') },
        async (err, data: { Plaintext: Buffer }) => {
          if (err) reject(err);
          return resolve(data.Plaintext.toString('utf-8'));
        }
      );
    });
  }
}
