import { S3Storage, S3Api, injectable, s3Storage, InjectionScope, container } from 'functionly';
import { S3 } from 'aws-sdk';

@injectable(InjectionScope.Singleton)
export class S3CorpCheckApi extends S3Api {
  private s3api;
  public async init() {
    let awsConfig: any = {};
    if (process.env.FUNCTIONAL_ENVIRONMENT === 'local') {
      awsConfig.apiVersion = '2006-03-01';
      awsConfig.region = process.env.AWS_REGION || 'eu-central-1';

      console.log('Local S3 configuration');
      console.log(
        JSON.stringify(
          {
            apiVersion: awsConfig.apiVersion,
            'region (process.env.AWS_REGION)': awsConfig.region,
            'endpoint (process.env.S3_LOCAL_ENDPOINT)': awsConfig.endpoint
          },
          null,
          2
        )
      );
    }

    this.s3api = new S3(awsConfig);
  }

  public getS3() {
    return this.s3api;
  }
}

container.registerType(S3Api, S3CorpCheckApi);

@injectable(InjectionScope.Singleton)
@s3Storage({ bucketName: 'corp-check-rest-%ClassName%' })
export class FileStorage extends S3Storage {}
