import { Service, param, injectable, inject, InjectionScope, environment, getFunctionName } from 'functionly';
import { PackageInfoCollection } from '../stores/mongoCollections';
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
    @inject(PackageInfoCollection) packageInfoCollection: PackageInfoCollection
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
        await packageInfoCollection.updateMany(
          { hash: packageInfo.hash },
          {
            $set: {
              latest: false
            }
          }
        );
      }

      return true;
    }
    return false;
  }
}

@injectable(InjectionScope.Singleton)
@environment('TASKOPTION_CLUSTER', 'checkers')
@environment('TASKOPTION_TASKDEFINITION', 'check')
@environment('TASKOPTION_TASKNAME', 'checker')
@environment('TASKOPTION_TASKREGION', 'eu-central-1')
@environment('TASKOPTION_COMPLETELAMBDAREGION', '')
@environment('FUNCTIONAL_SERVICE_COMPLETE', 'Complete')
export class StartPackageValidation extends Service {
  public async handle(@param cid, @param packageName, @param packageJSON, @param isProduction) {
    const cluster = process.env.TASKOPTION_CLUSTER || 'checkers';
    const taskDefinition = process.env.TASKOPTION_TASKDEFINITION || 'check';
    const taskName = process.env.TASKOPTION_TASKNAME || 'checker';
    const region = process.env.TASKOPTION_REGION || process.env.AWS_REGION || 'eu-central-1';
    const completeLambda = process.env.TASKOPTION_COMPLETELAMBDAREGION || process.env.AWS_REGION || 'eu-central-1';
    const resolvedFuncName = process.env.FUNCTIONAL_SERVICE_COMPLETE;

    return new Promise((resolve, reject) => {
      new AWS.ECS({ region }).runTask(
        {
          cluster,
          taskDefinition,
          overrides: {
            containerOverrides: [
              {
                name: taskName,
                command: [ 'node', '.', cid, packageName || JSON.stringify(packageJSON) ],
                environment: [
                  { name: 'NODE_ENV', value: isProduction ? 'production' : 'dev' },
                  { name: 'REGION', value: region },
                  { name: 'COMPLETE_LAMBDA_NAME', value: resolvedFuncName }
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
