import { Service, param, injectable, inject, InjectionScope, environment, getFunctionName, stage } from 'functionly';
import { PackageInfoApi } from '../api/packageInfo';
import { generate } from 'shortid';
import * as moment from 'moment';
import { PackageInfo, StateType } from '../types';
import * as AWS from 'aws-sdk';
import { TaskChannel } from '../stores/rabbitChannels';

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
      packageInfo.state.type === StateType.FAILED ||
      (packageInfo.state.type === StateType.PENDING && minutes > pendingMaxMinutes) ||
      (packageInfo.state.type === StateType.SUCCEEDED && hours > successMaxHours)
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
export class StartPackageValidation extends Service {
  public async handle(
    @param cid,
    @param packageName,
    @param packageJSONS3Key,
    @param packageLockS3Key,
    @param yarnLockS3Key,
    @param isProduction,
    @stage stage,
    @inject(TaskChannel) taskChannel: TaskChannel
  ) {
    taskChannel.assertQueue();
    console.log('taskChannel.sendToQueue');
    const result = taskChannel.sendToQueue(
      new Buffer(
        JSON.stringify({
          cid,
          pkg: packageJSONS3Key ? `s3://${packageJSONS3Key}` : packageName,
          production: isProduction,
          packageLock: packageLockS3Key && `s3://${packageLockS3Key}`,
          yarnLock: yarnLockS3Key && `s3://${yarnLockS3Key}`
        })
      )
    );
    console.log('result', result);

    return new Promise(r => setTimeout(r, 300));
  }
}
