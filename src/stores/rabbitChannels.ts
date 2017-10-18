import { KMSApi } from '../services/aws/kms';
import { RabbitConnection, RabbitChannel, rabbitChannel } from '../services/aws/rabbitMQ';
import { injectable, mongoCollection, inject, container, environment, InjectionScope } from 'functionly';

export const STAGE_ENDPOINTS = {
    dev:
      'AQICAHjLPCiyfkkMKPgAeOmVYE2S22YSQdPPXzuq04fafcsrmgHUxgfLsea4zkpvv5R4F9FqAAAApDCBoQYJKoZIhvcNAQcGoIGTMIGQAgEAMIGKBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDA24DY96eV3qAkD/QwIBEIBdr7Yd6A/Gh5uRMRAeOrKW/7uY1J91rRyi+dEqpU0BY35vwH4Rr13cB1FL6CvFWJy4gODZXHrLNIMpc4bV+Lp3V4eVMSPSvVf+FG9rLFFv66nhXQLLrAVxtOFGYpqa',
    stage:
      'AQICAHieI8COkiRibR7UT7cKVSNHX3UIf6QC6q2fr9NI+KiohQFhtiBIzIczEHFElbsA4H9GAAAApjCBowYJKoZIhvcNAQcGoIGVMIGSAgEAMIGMBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDMQSWcrzks3DFyYJAAIBEIBfDn+lN6PB0PYpprLk5jUV/wbH0I9TZgahucUHPypGRW49FHMmwh3kT/7KXv6PObf7AFkeZUsJJZOs1xaGAekk97Iu1krJd5NH/v5oGnq3vhmUX+HPZHjyDMYte31lqHo=',
    prod:
      'AQICAHi0wVEzIAaq+zvhiv+TiZtDf3FSEjRPpFsgq5nTlUqjhgEn8J+aQTJiujzQU+7Uexh6AAAAoDCBnQYJKoZIhvcNAQcGoIGPMIGMAgEAMIGGBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDAeBWdbiOhUgdgy7TgIBEIBZrwaUAN04RTnGmOSs/vc11bVkdt0ahVmHtnOZKo7Bg5iRX+idzZNjUxuGFT9QtRoDWSBWSxC1QF2i0ySyMOLrtVZr9dAykvYRHsjL45JzKapN8qqq395B8sc=',
    default: ''
  };
  export const DEFAULT_RABBIT_ENDPOINT = 'amqp://localhost:5672';
  
/* KMS resolve connection */
@injectable(InjectionScope.Singleton)
export class KMSResolveRabbitConnection extends RabbitConnection {
  private resolutions: Map<string, string>;
  constructor(@inject(KMSApi) private kmsApi: KMSApi) {
    super();
    this.resolutions = new Map<string, string>();
  }

  public async connect(url: string): Promise<any> {
    const connectionUrl =
      url ||
      process.env.RABBITMQ_CONNECTION_URL ||
      STAGE_ENDPOINTS[process.env.FUNCTIONAL_STAGE] ||
      DEFAULT_RABBIT_ENDPOINT;

    if (/^amqp/.test(connectionUrl)) return super.connect(connectionUrl);

    if (this.resolutions.has(connectionUrl)) {
      const decryptedUrl = this.resolutions.get(connectionUrl);
      return super.connect(decryptedUrl);
    }

    const decryptedUrl = await this.kmsApi.decrypt(connectionUrl);
    this.resolutions.set(connectionUrl, decryptedUrl);

    return super.connect(decryptedUrl);
  }
}

/* change default rabbit connection */
container.registerType(RabbitConnection, KMSResolveRabbitConnection);

/* CHANNELS */

@injectable(InjectionScope.Singleton)
@rabbitChannel({ queue: 'tasks' })
export class TaskChannel extends RabbitChannel {}
