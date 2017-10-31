import { Service, Api, param, injectable, InjectionScope, environment, inject } from 'functionly';
import { KMSApi } from './aws/kms';
import * as request from 'request-promise-native';

export const RABBITMQ_SERVICE_URL = {
  local: 'http://guest:guest@localhost:15672',
  dev:
    '"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',
  stage:
    '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',
  prod:
    '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'
};

@injectable(InjectionScope.Singleton)
@environment('RABBITMQ_SERVICE_URL', '')
export class KMSResolveRabbitMQServiceUrl extends Api {
  private resolutions: Map<string, string>;

  constructor(@inject(KMSApi) private kmsApi: KMSApi) {
    super();
    this.resolutions = new Map<string, string>();
  }

  public async getUrl() {
    const serviceUrl =
      process.env.RABBITMQ_CONNECTION_URL ||
      RABBITMQ_SERVICE_URL[process.env.FUNCTIONAL_STAGE] ||
      RABBITMQ_SERVICE_URL.local;

    if (/^http/.test(serviceUrl)) return serviceUrl;

    if (this.resolutions.has(serviceUrl)) {
      const decryptedUrl = this.resolutions.get(serviceUrl);
      return decryptedUrl;
    }

    const decryptedUrl = await this.kmsApi.decrypt(serviceUrl);
    this.resolutions.set(serviceUrl, decryptedUrl);

    return decryptedUrl;
  }
}

@injectable(InjectionScope.Singleton)
export class AssertQueue extends Service {
  public async handle(@param queue, @inject(KMSResolveRabbitMQServiceUrl) kmsServiceUrl: KMSResolveRabbitMQServiceUrl) {
    const serviceUrl = await kmsServiceUrl.getUrl();

    try {
      await request({
        uri: `${serviceUrl}/api/queues/%2F/${queue}`,
        method: 'PUT',
        json: true,
        body: { vhost: '/', name: 'queue', durable: 'true', auto_delete: 'false', arguments: {} }
      });
    } catch (e) {
      console.log(`${serviceUrl}/api/queues/%2F/${queue}`)
      console.log(e)
      throw new Error('RabbitApiError');
    }
  }
}

@injectable(InjectionScope.Singleton)
export class PublishToQueue extends Service {
  public async handle(
    @param queue,
    @param payload,
    @inject(KMSResolveRabbitMQServiceUrl) kmsServiceUrl: KMSResolveRabbitMQServiceUrl
  ) {
    const serviceUrl = await kmsServiceUrl.getUrl();
    let info: any = {};
    try {
      info = await request({
        uri: `${serviceUrl}/api/exchanges/%2f/amq.default/publish`,
        method: 'POST',
        json: true,
        body: {
          properties: {},
          routing_key: queue,
          payload,
          payload_encoding: 'string'
        }
      });
    } catch (e) {
      console.log(`${serviceUrl}/api/exchanges/%2f/amq.default/publish`)
      console.log(e)
      throw new Error('RabbitApiError');
    }

    if (!info.routed) {
      throw new Error('RabbitMessageToQueue');
    }
  }
}
