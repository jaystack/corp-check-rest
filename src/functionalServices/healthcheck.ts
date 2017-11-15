import { rest, inject, environment, stage, MongoConnection } from 'functionly';

import { CorpCheckRestService } from './corpCheckRestService';
import { HealthCheck, GetConsumers } from '../services/rabbitMQ';
import { PopularPackageNames } from '../stores/mongoCollections';

@rest({ path: '/health-check', methods: [ 'get' ], anonymous: true })
@environment('MIN_QUEUE_CONSUMER_COUNT', '3')
@environment('RABBITMQ_QUEUE_NAME', 'tasks')
export class HealthCheckService extends CorpCheckRestService {
  public async handle(
    @inject(HealthCheck) rabbitHealthCheck,
    @inject(GetConsumers) rabbitGetConsumers,
    @inject(MongoConnection) mongoConnection,
    @stage stage
  ) {
    try {
      // rabbit health check
      const rabbitHealthCheckResult = await rabbitHealthCheck();
      if (!rabbitHealthCheckResult || rabbitHealthCheckResult.status !== 'ok') {
        console.log('rabbit health check result error', rabbitHealthCheckResult);
        return { status: 500, data: { state: 'failed', reason: 'rabbit' } };
      }
    } catch (e) {
      console.log('rabbit connection error', e);
      return { status: 500, data: { state: 'failed', reason: 'rabbit connection' } };
    }

    try {
      // rabbit consumer counts
      const rabbitGetConsumersResult = await rabbitGetConsumers({ vHost: '%2F' });
      const queue = `${process.env.RABBITMQ_QUEUE_NAME}-${stage}`;
      if (
        !rabbitGetConsumersResult ||
        !process.env.MIN_QUEUE_CONSUMER_COUNT ||
        rabbitGetConsumersResult.filter(c => c.queue.name === queue).length < process.env.MIN_QUEUE_CONSUMER_COUNT
      ) {
        console.log('rabbit worker count error', rabbitGetConsumersResult);
        return { status: 500, data: { state: 'failed', reason: 'workers' } };
      }
    } catch (e) {
      console.log('rabbit get workers error', e);
      return { status: 500, data: { state: 'failed', reason: 'workers' } };
    }

    try {
      // mongo connect
      await mongoConnection.connect();
    } catch (e) {
      console.log('mongo connection error', e);
      return { status: 500, data: { state: 'failed', reason: 'mongo connection' } };
    }

    return { status: 200, data: { state: 'ok' } };
  }
}
