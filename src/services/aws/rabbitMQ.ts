import * as ampq from 'amqplib';
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

    const connectionPromise = ampq.connect(connectionUrl);
    this._connectionPromises.set(connectionUrl, connectionPromise);

    const connection = await connectionPromise;
    this._connections.set(connectionUrl, connection);
    connection.on('close', () => {
      this._connectionPromises.delete(connectionUrl);
      this._connections.delete(connectionUrl);
    });

    return connection;
  }

  public async createChannel(connection: ampq.Connection): Promise<ampq.Channel> {
    const channel = await connection.createChannel();
    return channel;
  }

  public async createConfirmChannel(connection: ampq.Connection): Promise<ampq.ConfirmChannel> {
    const channel = await connection.createConfirmChannel();
    return channel;
  }
}

export class RabbitChannel extends Api {
  /* ampq.ConfirmChannel */
  publish(
    routingKey: string,
    content: Buffer,
    options?: Options.Publish,
    callback?: (err: any, ok: Replies.Empty) => void
  ): boolean {
    return this._channel.publish(this._exchange, routingKey, content, options, callback);
  }
  sendToQueue(content: Buffer, options?: Options.Publish, callback?: (err: any, ok: Replies.Empty) => void): boolean {
    return this._channel.sendToQueue(this._queue, content, options, callback);
  }
  waitForConfirms(): Promise<void> {
    return Promise.resolve(this._channel.waitForConfirms());
  }
  close(): Promise<void> {
    return Promise.resolve(this._channel.close());
  }
  assertQueue(options?: Options.AssertQueue): Promise<Replies.AssertQueue> {
    return Promise.resolve(this._channel.assertQueue(this._queue, options));
  }
  checkQueue(): Promise<Replies.AssertQueue> {
    return Promise.resolve(this._channel.checkQueue(this._queue));
  }
  deleteQueue(options?: Options.DeleteQueue): Promise<Replies.DeleteQueue> {
    return Promise.resolve(this._channel.deleteQueue(this._queue, options));
  }
  purgeQueue(): Promise<Replies.PurgeQueue> {
    return Promise.resolve(this._channel.purgeQueue(this._queue));
  }
  bindQueue(source: string, pattern: string, args?: any): Promise<Replies.Empty> {
    return Promise.resolve(this._channel.bindQueue(this._queue, source, pattern, args));
  }
  unbindQueue(source: string, pattern: string, args?: any): Promise<Replies.Empty> {
    return Promise.resolve(this._channel.unbindQueue(this._queue, source, pattern, args));
  }
  assertExchange(type: string, options?: Options.AssertExchange): Promise<Replies.AssertExchange> {
    return Promise.resolve(this._channel.assertExchange(this._exchange, type, options));
  }
  checkExchange(): Promise<Replies.Empty> {
    return Promise.resolve(this._channel.checkExchange(this._exchange));
  }
  deleteExchange(options?: Options.DeleteExchange): Promise<Replies.Empty> {
    return Promise.resolve(this._channel.deleteExchange(this._exchange, options));
  }
  bindExchange(destination: string, source: string, pattern: string, args?: any): Promise<Replies.Empty> {
    return Promise.resolve(this._channel.bindExchange(destination, source, pattern, args));
  }
  unbindExchange(destination: string, source: string, pattern: string, args?: any): Promise<Replies.Empty> {
    return Promise.resolve(this._channel.unbindExchange(destination, source, pattern, args));
  }
  consume(onMessage: (msg: Message) => any, options?: Options.Consume): Promise<Replies.Consume> {
    return Promise.resolve(this._channel.consume(this._queue, onMessage, options));
  }
  cancel(consumerTag: string): Promise<Replies.Empty> {
    return Promise.resolve(this._channel.cancel(consumerTag));
  }
  get(options?: Options.Get): Promise<false | Message> {
    return Promise.resolve<false | Message>(this._channel.get(this._queue, options));
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
  prefetch(count: number, global?: boolean): Promise<Replies.Empty> {
    return Promise.resolve(this._channel.prefetch(count, global));
  }
  recover(): Promise<Replies.Empty> {
    return Promise.resolve(this._channel.recover());
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
  private _channel: ampq.ConfirmChannel;
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

    this._channel = await this.connection.createConfirmChannel(conn);
  }

  public getChannel() {
    return this._channel;
  }
}
