import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { EventPublisherPort, ItineraryCreatedEvent } from '../../domain/ports/event-publisher.port';
import { RequestContext } from '../observability/request-context';

const EXCHANGE_NAME = 'itinerary.events';
const ROUTING_KEY = 'itinerary.created';
const QUEUE_NAME = 'itinerary-created-queue';

/**
 * Publishes integration events to RabbitMQ using amqplib directly.
 * Declares a topic exchange bound to a durable queue so consumers such as
 * notification-function can bind independently.
 */
@Injectable()
export class RabbitMqEventPublisherAdapter
  implements EventPublisherPort, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RabbitMqEventPublisherAdapter.name);
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;
  private readonly url: string;

  constructor(private readonly configService: ConfigService) {
    this.url = this.configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
  }

  async onModuleInit(): Promise<void> {
    try {
      this.connection = await amqplib.connect(this.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
      await this.channel.assertQueue(QUEUE_NAME, { durable: true });
      await this.channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);
      this.logger.log(`Connected to RabbitMQ at ${this.url}`);
    } catch (error) {
      this.logger.error(`Failed to connect to RabbitMQ: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  async publishItineraryCreated(event: ItineraryCreatedEvent): Promise<void> {
    if (!this.channel) {
      this.logger.warn('RabbitMQ channel not available; skipping event publish');
      return;
    }

    const payload = Buffer.from(JSON.stringify({ type: 'ItineraryCreated', ...event }));
    const correlationId = RequestContext.getCorrelationId();

    this.channel.publish(EXCHANGE_NAME, ROUTING_KEY, payload, {
      contentType: 'application/json',
      persistent: true,
      // Standard AMQP message property — lets a consumer (notification-function)
      // continue the same correlation ID in its own logs, tracing the request
      // all the way from the original HTTP call through the async event.
      ...(correlationId ? { correlationId } : {}),
    });
  }
}
