import { Service, param, injectable, inject, InjectionScope, environment, getFunctionName, stage } from 'functionly';
import { PackageInfoApi } from '../api/packageInfo';
import { generate } from 'shortid';
import * as moment from 'moment';
import { PackageInfo, StateType } from '../types';
import * as AWS from 'aws-sdk';
import { AssertQueue, PublishToQueue } from './rabbitMQ';

@injectable(InjectionScope.Singleton)
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
    var hours = duration.asHours();

    const successMaxHours = process.env.PACKAGE_VALIDATION_EXPIRATION_IN_DAYS * 24 || 24;

    if (
      force ||
      packageInfo.state.type === StateType.FAILED ||
      (packageInfo.state.type === StateType.SUCCEEDED && hours >= successMaxHours)
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
@environment('RABBITMQ_QUEUE_NAME', 'tasks')
@environment('RABBITMQ_MESSAGE_EXPIRATION', '600000')
export class StartPackageValidation extends Service {
  public async handle(
    @param cid,
    @param packageName,
    @param packageJSON,
    @param packageLock,
    @param yarnLock,
    @param isProduction,
    @inject(AssertQueue) assertQueue,
    @inject(PublishToQueue) publishToQueue,
    @stage stage
  ) {
    const queue = `${process.env.RABBITMQ_QUEUE_NAME}-${stage}`;

    await assertQueue({ queue, queueArguments: { 'x-dead-letter-exchange': `${queue}.exchange.dead` } });
    await publishToQueue({
      queue,
      payload: JSON.stringify({
        cid,
        pkg: packageJSON ? packageJSON : packageName,
        production: isProduction,
        packageLock: packageLock,
        yarnLock: yarnLock
      }),
      properties: {
        expiration: process.env.RABBITMQ_MESSAGE_EXPIRATION || '600000'
      }
    });
  }
}
