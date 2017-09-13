import { Service, param, injectable, inject, InjectionScope, environment, getFunctionName } from 'functionly';
import { ValidationsResults } from '../tables/validationResults';
import { generate } from 'shortid';
import * as moment from 'moment';
import * as AWS from 'aws-sdk';

export class MissingPackageParameters extends Error {}

@injectable(InjectionScope.Singleton)
@environment('PACKAGE_VALIDATION_EXPIRATION_IN_DAYS', '30')
@environment('PACKAGE_PENDING_EXPIRATION_IN_MINUTES', '10')
export class IsExpiredResult extends Service {
  public async handle(
    @param item,
    @param update,
    @param force,
    @inject(ValidationsResults) validationInfoTable: ValidationsResults
  ): Promise<any> {
    var now = moment(new Date());
    var end = moment(item.date);
    var duration = moment.duration(now.diff(end));
    var minutes = duration.asMinutes();
    var hours = duration.asHours();

    const pendingMaxMinutes = process.env.PACKAGE_PENDING_EXPIRATION_IN_MINUTES || 10;
    const successMaxHours = process.env.PACKAGE_VALIDATION_EXPIRATION_IN_DAYS * 24 * 60 || 24 * 60;

    if (
      force ||
      item.validationState.state === 'FAILED' ||
      (item.validationState.state === 'PENDING' && minutes > pendingMaxMinutes) ||
      (item.validationState.state === 'SUCCEEDED' && hours > successMaxHours)
    ) {
      if (force || update) {
        await validationInfoTable.update({
          Key: {
            id: item.id
          },
          UpdateExpression: 'set latest = :l',
          ExpressionAttributeValues: { ':l': false },
          ReturnValues: 'UPDATED_NEW'
        });
      }

      return true;
    }
    return false;
  }
}

@injectable(InjectionScope.Singleton)
export class GetPackageResult extends Service {
  public async handle(
    @param name,
    @param version,
    @param isProduction,
    @param cid,
    @inject(ValidationsResults) validationInfoTable: ValidationsResults
  ): Promise<any> {
    let params = null;
    if (name && version) {
      params = {
        FilterExpression:
          'packageName = :name and packageVersion = :version and isNpmPackage = :isNpmPackage and isProduction = :isProduction and latest = :latest',
        ExpressionAttributeValues: {
          ':name': name,
          ':version': version,
          ':isNpmPackage': true,
          ':isProduction': !!isProduction,
          ':latest': true
        }
      };
    } else if (cid) {
      params = {
        FilterExpression: 'id = :cid',
        ExpressionAttributeValues: { ':cid': cid }
      };
    }

    if (!params) throw new MissingPackageParameters();

    const result = await validationInfoTable.scan(params);
    return (result.Items && result.Items.length && result.Items[0]) || null;
  }
}

@injectable(InjectionScope.Singleton)
export class UpdatePackageResult extends Service {
  public async handle(
    @param cid,
    @param data,
    @param result,
    @param state,
    @inject(ValidationsResults) validationInfoTable: ValidationsResults
  ): Promise<any> {
    const updated = await validationInfoTable.update({
      Key: {
        id: cid
      },
      UpdateExpression: 'set validationResult = :r, validationState=:s, validationData=:d',
      ExpressionAttributeValues: {
        ':r': result || null,
        ':s': { state, date: new Date().toISOString(), cid },
        ':d': data || null
      },
      ReturnValues: 'UPDATED_NEW'
    });

    return { updated };
  }
}

@injectable(InjectionScope.Singleton)
export class CreatePackageResult extends Service {
  public async handle(
    @param name,
    @param version,
    @param isProduction,
    @param packageJSON,
    @param isNpmPackage = false,
    @inject(ValidationsResults) validationInfoTable: ValidationsResults
  ) {
    if (!packageJSON) throw new MissingPackageParameters('missing packageJSON');

    const id = generate();
    const date = new Date().toISOString();
    const item = {
      id,
      packageName: name,
      packageVersion: version,
      packageJSON: JSON.stringify(packageJSON),
      isNpmPackage,
      isProduction,
      date,
      validationState: {
        cid: id,
        date,
        state: 'PENDING'
      },
      latest: true,
      validationResult: null
    };

    await validationInfoTable.put({ Item: item });

    return item;
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
  public async handle(@param cid, @param packageJSON, @param isProduction) {
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
                command: [ 'node', '.', cid, packageJSON ],
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
