import * as ampq from 'amqplib/callback_api';
import { Options, Replies, Message } from 'amqplib/callback_api';

import {
  getMetadata,
  defineMetadata,
  templates,
  applyTemplates,
  param,
  environment,
  injectable,
  InjectionScope,
  inject,
  simpleClassAnnotation,
  classConfig,
  serviceParams,
  provider
} from 'functionly';

import { Service, Api, PreHook } from 'functionly';

export const CLASS_RABBITMQ_CHANNELCONFIGURATIONKEY = 'functionly:class:rabbitMQChannelConfiguration';
export const RABBITMQ_QUEUE_NAME_SUFFIX = '_QUEUE_NAME';
export const RABBITMQ_EXCHANGE_NAME_SUFFIX = '_EXCHANGE_NAME';
export const RABBITMQ_CONNECTION_URL = 'RABBITMQ_CONNECTION_URL';

export const mongoConnection = (url: string) => environment(RABBITMQ_CONNECTION_URL, url);
export const rabbitChannel = (channelConfig: {
  queue?: string;
  exchange?: string;
  url?: string;
  queueEnvironmentKey?: string;
  exchangeEnvironmentKey?: string;
}) => (target: Function) => {
  let channelDefinitions = getMetadata(CLASS_RABBITMQ_CHANNELCONFIGURATIONKEY, target) || [];

  channelConfig.queueEnvironmentKey = channelConfig.queueEnvironmentKey || `%ClassName%${RABBITMQ_QUEUE_NAME_SUFFIX}`;
  const queueTemplate = applyTemplates(channelConfig.queueEnvironmentKey, channelConfig.queue, target);
  channelConfig.exchangeEnvironmentKey =
    channelConfig.exchangeEnvironmentKey || `%ClassName%${RABBITMQ_EXCHANGE_NAME_SUFFIX}`;
  const exchangeTemplate = applyTemplates(channelConfig.exchangeEnvironmentKey, channelConfig.exchange, target);

  channelDefinitions.push({
    ...channelConfig,
    queueEnvironmentKey: queueTemplate.templatedKey,
    queue: queueTemplate.templatedValue,
    exchangeEnvironmentKey: exchangeTemplate.templatedKey,
    exchange: exchangeTemplate.templatedValue,
    definedBy: target.name
  });

  defineMetadata(CLASS_RABBITMQ_CHANNELCONFIGURATIONKEY, [ ...channelDefinitions ], target);

  const environmentSetterQueue = environment(queueTemplate.templatedKey, queueTemplate.templatedValue);
  environmentSetterQueue(target);
  const environmentSetterExchange = environment(exchangeTemplate.templatedKey, exchangeTemplate.templatedValue);
  environmentSetterExchange(target);
};

export const amqpConnect = url => {
  return new Promise<ampq.Connection>((resolve, reject) => {
    ampq.connect(url, (err, conn) => {
      if (err) return reject(err);
      return resolve(conn);
    });
  });
};

export const amqpCreateChannel = connection => {
  return new Promise<ampq.Channel>((resolve, reject) => {
    connection.createChannel((err, ch) => {
      if (err) return reject(err);
      return resolve(ch);
    });
  });
};

@injectable(InjectionScope.Singleton)
export class RabbitConnection extends Api {
  private _connections: Map<string, any>;
  private _connectionPromises: Map<string, any>;

  constructor() {
    super();
    this._connections = new Map<string, any>();
    this._connectionPromises = new Map<string, any>();
  }

  public async connect(url): Promise<ampq.Connection> {
    const connectionUrl = url || process.env.RABBITMQ_CONNECTION_URL || 'amqp://localhost:5672';

    if (this._connections.has(connectionUrl)) {
      const connection = this._connections.get(connectionUrl);
      return connection;
    }

    if (this._connectionPromises.has(connectionUrl)) {
      return await this._connectionPromises.get(connectionUrl);
    }

    const connectionPromise = amqpConnect(connectionUrl);
    this._connectionPromises.set(connectionUrl, connectionPromise);

    const connection = await connectionPromise;
    this._connections.set(connectionUrl, connection);
    connection.on('close', () => {
      this._connectionPromises.delete(connectionUrl);
      this._connections.delete(connectionUrl);
    });

    return connection;
  }

  public async createChannel(connection) {
    const channel = await await amqpCreateChannel(connection);
    return channel;
  }
}

export class RabbitChannel extends Api {
  /* ampq.Channel */
  close(callback: (err: any) => void): void {
    return this._channel.close(callback);
  }
  assertQueue(options?: Options.AssertQueue, callback?: (err: any, ok: Replies.AssertQueue) => void): void {
    return this._channel.assertQueue(this._queue, options, callback);
  }
  checkQueue(callback?: (err: any, ok: Replies.AssertQueue) => void): void {
    return this._channel.checkQueue(this._queue, callback);
  }
  deleteQueue(options?: Options.DeleteQueue, callback?: (err: any, ok: Replies.DeleteQueue) => void): void {
    return this._channel.deleteQueue(this._queue, options, callback);
  }
  purgeQueue(callback?: (err: any, ok: Replies.PurgeQueue) => void): void {
    return this._channel.purgeQueue(this._queue, callback);
  }
  bindQueue(source: string, pattern: string, args?: any, callback?: (err: any, ok: Replies.Empty) => void): void {
    return this._channel.bindQueue(this._queue, source, pattern, args, callback);
  }
  unbindQueue(source: string, pattern: string, args?: any, callback?: (err: any, ok: Replies.Empty) => void): void {
    return this._channel.unbindQueue(this._queue, source, pattern, args, callback);
  }
  assertExchange(
    type: string,
    options?: Options.AssertExchange,
    callback?: (err: any, ok: Replies.AssertExchange) => void
  ): void {
    return this._channel.assertExchange(this._exchange, type, options, callback);
  }
  checkExchange(callback?: (err: any, ok: Replies.Empty) => void): void {
    return this._channel.checkExchange(this._exchange, callback);
  }
  deleteExchange(options?: Options.DeleteExchange, callback?: (err: any, ok: Replies.Empty) => void): void {
    return this._channel.deleteExchange(this._exchange, options, callback);
  }
  bindExchange(
    destination: string,
    source: string,
    pattern: string,
    args?: any,
    callback?: (err: any, ok: Replies.Empty) => void
  ): void {
    return this._channel.bindExchange(destination, source, pattern, args, callback);
  }
  unbindExchange(
    destination: string,
    source: string,
    pattern: string,
    args?: any,
    callback?: (err: any, ok: Replies.Empty) => void
  ): void {
    return this._channel.unbindExchange(destination, source, pattern, args, callback);
  }
  publish(routingKey: string, content: Buffer, options?: Options.Publish): boolean {
    return this._channel.publish(this._exchange, routingKey, content, options);
  }
  sendToQueue(content: Buffer, options?: Options.Publish): boolean {
    return this._channel.sendToQueue(this._queue, content, options);
  }
  consume(
    onMessage: (msg: Message) => any,
    options?: Options.Consume,
    callback?: (err: any, ok: Replies.Consume) => void
  ): void {
    return this._channel.consume(this._queue, onMessage, options, callback);
  }
  cancel(consumerTag: string, callback?: (err: any, ok: Replies.Empty) => void): void {
    return this._channel.cancel(consumerTag, callback);
  }
  get(options?: Options.Get, callback?: (err: any, ok: false | Message) => void): void {
    return this._channel.get(this._queue, options, callback);
  }
  ack(message: Message, allUpTo?: boolean): void {
    return this._channel.ack(message, allUpTo);
  }
  ackAll(): void {
    return this._channel.ackAll();
  }
  nack(message: Message, allUpTo?: boolean, requeue?: boolean): void {
    return this._channel.nack(message, allUpTo, requeue);
  }
  nackAll(requeue?: boolean): void {
    return this._channel.nackAll(requeue);
  }
  reject(message: Message, requeue?: boolean): void {
    return this._channel.reject(message, requeue);
  }
  prefetch(count: number, global?: boolean): void {
    return this._channel.prefetch(count, global);
  }
  recover(callback?: (err: any, ok: Replies.Empty) => void): void {
    return this._channel.recover(callback);
  }
  addListener(event: string | symbol, listener: Function): this {
    this._channel.addListener(event, listener);
    return this;
  }
  on(event: string | symbol, listener: Function): this {
    this._channel.on(event, listener);
    return this;
  }
  once(event: string | symbol, listener: Function): this {
    this._channel.once(event, listener);
    return this;
  }
  prependListener(event: string | symbol, listener: Function): this {
    this._channel.prependListener(event, listener);
    return this;
  }
  prependOnceListener(event: string | symbol, listener: Function): this {
    this._channel.prependOnceListener(event, listener);
    return this;
  }
  removeListener(event: string | symbol, listener: Function): this {
    this._channel.removeListener(event, listener);
    return this;
  }
  removeAllListeners(event?: string | symbol): this {
    this._channel.removeAllListeners(event);
    return this;
  }
  setMaxListeners(n: number): this {
    this._channel.setMaxListeners(n);
    return this;
  }
  getMaxListeners(): number {
    return this._channel.getMaxListeners();
  }
  listeners(event: string | symbol): Function[] {
    return this._channel.listeners(event);
  }
  emit(event: string | symbol, ...args: any[]): boolean {
    return this._channel.emit(event, ...args);
  }
  eventNames(): (string | symbol)[] {
    return this._channel.eventNames();
  }
  listenerCount(type: string | symbol): number {
    return this._channel.listenerCount(type);
  }

  /* Api */
  private _channel: ampq.Channel;
  private _queue: string;
  private _exchange: string;
  constructor(@inject(RabbitConnection) private connection: RabbitConnection) {
    super();
  }

  public async init() {
    const channelConfig = (getMetadata(CLASS_RABBITMQ_CHANNELCONFIGURATIONKEY, this) || [])[0];

    this._queue =
      (process.env[`${this.constructor.name}${RABBITMQ_QUEUE_NAME_SUFFIX}`] || channelConfig.queue) +
      `-${process.env.FUNCTIONAL_STAGE}`;

    this._exchange =
      (process.env[`${this.constructor.name}${RABBITMQ_EXCHANGE_NAME_SUFFIX}`] || channelConfig.exchange) +
      `-${process.env.FUNCTIONAL_STAGE}`;

    const conn = await this.connection.connect(channelConfig.url);

    this._channel = await this.connection.createChannel(conn);
  }

  public getChannel() {
    return this._channel;
  }
}
