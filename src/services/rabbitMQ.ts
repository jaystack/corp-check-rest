import { Service, Api, param, injectable, InjectionScope, environment, inject } from 'functionly';
import { KMSApi } from './aws/kms';
import * as request from 'request-promise-native';

export const RABBITMQ_SERVICE_URL = {
  local: 'http://guest:guest@localhost:15672',
  dev:
    'AQICAHjLPCiyfkkMKPgAeOmVYE2S22YSQdPPXzuq04fafcsrmgFrNWjNpll5ab5qoCjEw6mpAAAApTCBogYJKoZIhvcNAQcGoIGUMIGRAgEAMIGLBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDH4XPKTG8ITxfhn63AIBEIBeoOLPmQTN/Wdf1S/pL1KAcQq7BHH8X6fqW21yr+wnRNv5E4YfFzyE365LWWH+/q0EkzLvBsZDfrDLpyhvvonZAs4GsFQ03Oh0Qa+7MUz71n+TiDQNMd863BbsXW9eGw==',
  stage:
    'AQICAHieI8COkiRibR7UT7cKVSNHX3UIf6QC6q2fr9NI+KiohQHegnddUAVtW+HECwPUe3NVAAAApzCBpAYJKoZIhvcNAQcGoIGWMIGTAgEAMIGNBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDGR7BIls5anpj3tB1gIBEIBgtY/gV9XkI1yJ3fi5t4hUlywS8ZU9bxxETSQIU/8iPxwUo5UPukhwbvtnD0VSFrL+0B78Q+rz+mLmVQTE8DAetcxEJnuy5wGy8WraaOXKVPFlYEcdaCxOvD5XcvmCtF5n',
  prod:
    'AQICAHi0wVEzIAaq+zvhiv+TiZtDf3FSEjRPpFsgq5nTlUqjhgEkK6Dqnss+RKxculkk5qf0AAAAoTCBngYJKoZIhvcNAQcGoIGQMIGNAgEAMIGHBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDGljLatIcf4+0nl2IQIBEIBa03VS53Wgc4j/xtE+CanWp1i/SLLBtdeORyhxtT6nd1PHlDvtSUxAZhAJPu19PgFLCm0DJwAiXTVa5N2Sj6jeLbOVLiBMgkOSoUqzZigyyrbFGGEp3C8gcFPD'
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
  public async handle(@param queue, @param queueArguments, @inject(KMSResolveRabbitMQServiceUrl) kmsServiceUrl: KMSResolveRabbitMQServiceUrl) {
    const serviceUrl = await kmsServiceUrl.getUrl();

    try {
      await request({
        uri: `${serviceUrl}/api/queues/%2F/${queue}`,
        method: 'PUT',
        json: true,
        body: { vhost: '/', name: 'queue', durable: 'true', auto_delete: 'false', arguments: queueArguments || {} }
      });
    } catch (e) {
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
    @param properties,
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
          properties: properties || {},
          routing_key: queue,
          payload,
          payload_encoding: 'string'
        }
      });
    } catch (e) {
      console.log(e)
      throw new Error('RabbitApiError');
    }

    if (!info.routed) {
      throw new Error('RabbitMessageToQueue');
    }
  }
}
