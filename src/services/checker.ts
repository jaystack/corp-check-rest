import { Service, param, injectable, inject, InjectionScope, environment, getFunctionName, stage } from 'functionly';
import { PackageInfoApi } from '../api/packageInfo';
import { generate } from 'shortid';
import * as moment from 'moment';
import { PackageInfo } from '../types';
import * as AWS from 'aws-sdk';

@injectable(InjectionScope.Singleton)
@environment('PACKAGE_VALIDATION_EXPIRATION_IN_DAYS', '30')
@environment('PACKAGE_PENDING_EXPIRATION_IN_MINUTES', '10')
export class IsExpiredResult extends Service {
  public async handle(
    @param packageInfo: PackageInfo,
    @param update,
    @param force,
    @inject(PackageInfoApi) packageInfoApi: PackageInfoApi
  ): Promise<any> {
    var now = moment(new Date());
    var end = moment(packageInfo.date);
    var duration = moment.duration(now.diff(end));
    var minutes = duration.asMinutes();
    var hours = duration.asHours();

    const pendingMaxMinutes = process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES || 10;
    const successMaxHours = process.env.PACKAGE_VALIDATION_EXPIRATION_IN_DAYS * 24 * 60 || 24 * 60;

    if (
      force ||
      packageInfo.state.type === 'FAILED' ||
      (packageInfo.state.type === 'PENDING' && minutes > pendingMaxMinutes) ||
      (packageInfo.state.type === 'SUCCEEDED' && hours > successMaxHours)
    ) {
      if (force || update) {
        await packageInfoApi.updateMany(
          { hash: packageInfo.hash },
          {
            latest: false
          }
        );
      }

      return true;
    }
    return false;
  }
}

@injectable(InjectionScope.Singleton)
@environment('TASKOPTION_CLUSTER', '')
@environment('TASKOPTION_TASKDEFINITION', 'check')
@environment('TASKOPTION_TASKNAME', 'checker')
@environment('TASKOPTION_TASKREGION', 'eu-central-1')
@environment('TASKOPTION_COMPLETELAMBDAREGION', '')
@environment('FUNCTIONAL_SERVICE_COMPLETE', 'Complete')
@environment('FUNCTIONAL_SERVICE_GETMODULEMETADATA', 'GetModuleMeta')
export class StartPackageValidation extends Service {
  public async handle(
    @param cid,
    @param packageName,
    @param packageJSONS3Key,
    @param packageLockS3Key,
    @param yarnLockS3Key,
    @param isProduction,
    @stage stage
  ) {
    const cluster = process.env.TASKOPTION_CLUSTER || `corp-check-${stage}`;
    const taskDefinition = process.env.TASKOPTION_TASKDEFINITION || 'check';
    const taskName = process.env.TASKOPTION_TASKNAME || 'checker';
    const region = process.env.TASKOPTION_REGION || process.env.AWS_REGION || 'eu-central-1';
    const lambdaRegion = process.env.TASKOPTION_COMPLETELAMBDAREGION || process.env.AWS_REGION || 'eu-central-1';
    const completeLambda = process.env.FUNCTIONAL_SERVICE_COMPLETE;
    const getmodulemetadataLambda = process.env.FUNCTIONAL_SERVICE_GETMODULEMETADATA;
    const s3BucketName = process.env.FileStorage_S3_BUCKET + `-${process.env.FUNCTIONAL_STAGE}`;

    return new Promise((resolve, reject) => {
      const command = [ 'node', '.', cid, packageJSONS3Key || packageName ];

      if (packageLockS3Key) {
        command.push(...[ '--package-lock', packageLockS3Key ]);
      }

      if (yarnLockS3Key) {
        command.push(...[ '--yarn-lock', yarnLockS3Key ]);
      }

      new AWS.ECS({ region }).runTask(
        {
          cluster,
          taskDefinition,
          overrides: {
            containerOverrides: [
              {
                name: taskName,
                command,
                environment: [
                  { name: 'NODE_ENV', value: isProduction ? 'production' : 'dev' },
                  { name: 'REGION', value: lambdaRegion },
                  { name: 'COMPLETE_LAMBDA_NAME', value: completeLambda },
                  { name: 'CACHE_LAMBDA_NAME', value: getmodulemetadataLambda },
                  { name: 'S3_BUCKET_NAME', value: s3BucketName }
                ]
              }
            ]
          }
        },
        (err, data) => (err ? reject(err) : resolve(data))
      );
    });
  }
}
