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
        console.log('rabbitHealthCheck', rabbitHealthCheckResult);
        return { status: 500, data: { state: 'failed', reason: 'rabbit' } };
      }

      // rabbit consumer counts
      const rabbitGetConsumersResult = await rabbitGetConsumers({ vHost: '%2F' });
      const queue = `${process.env.RABBITMQ_QUEUE_NAME}-${stage}`;
      if (
        !rabbitGetConsumersResult ||
        !process.env.MIN_QUEUE_CONSUMER_COUNT ||
        rabbitGetConsumersResult.filter(c => c.queue.name === queue).length < process.env.MIN_QUEUE_CONSUMER_COUNT
      ) {
        console.log('rabbitGetConsumersResult', rabbitGetConsumersResult);
        return { status: 500, data: { state: 'failed', reason: 'workers' } };
      }

      // mongo connect
      await mongoConnection.connect();

      return { status: 200, data: { state: 'ok' } };
    } catch (e) {
      console.log('HealthCheckService', e);
      return { status: 500, data: { state: 'failed', reason: 'healthcheck' } };
    }
  }
}
