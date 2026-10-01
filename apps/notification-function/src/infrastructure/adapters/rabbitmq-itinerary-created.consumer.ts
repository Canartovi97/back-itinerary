import { randomUUID } from 'crypto';
import * as amqplib from 'amqplib';
import { ItineraryCreatedEvent } from '../../domain/itinerary-created.event';
import { StructuredLogger } from '../logging/structured-logger';
import { RequestContext } from '../observability/request-context';

const EXCHANGE_NAME = 'itinerary.events';
const ROUTING_KEY = 'itinerary.created';
const QUEUE_NAME = 'itinerary-created-queue';

/**
 * Consumes ItineraryCreated events from RabbitMQ and invokes the given
 * handler for each message. Acks the message only after successful handling.
 */
export class RabbitMqItineraryCreatedConsumer {
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;

  constructor(private readonly url: string) {}

  async start(handler: (event: ItineraryCreatedEvent) => Promise<void>): Promise<void> {
    this.connection = await amqplib.connect(this.url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await this.channel.assertQueue(QUEUE_NAME, { durable: true });
    await this.channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

    await this.channel.consume(QUEUE_NAME, (msg) => {
      if (!msg) {
        return;
      }
      const channel = this.channel as amqplib.Channel;
      void this.handleMessage(msg, handler)
        .then(() => channel.ack(msg))
        .catch((error: unknown) => {
          // Processing failed (bad message, DB write failed, etc). The
          // message is nacked without requeue — but the failure must still
          // land in the historial, per SCRUM's "cada ejecución registra
          // éxito o fallo del procesamiento". A failed message can't be
          // trusted to produce a notification row (the DB write may be
          // what failed), so a structured log is the fallback record.
          StructuredLogger.error('Failed to process ItineraryCreated event', {
            error: (error as Error).message,
            itineraryId: this.tryExtractItineraryId(msg),
          });
          channel.nack(msg, false, false);
        });
    });
  }

  private async handleMessage(
    msg: amqplib.ConsumeMessage,
    handler: (event: ItineraryCreatedEvent) => Promise<void>,
  ): Promise<void> {
    const event = JSON.parse(msg.content.toString()) as ItineraryCreatedEvent;
    // Continue the correlation ID the publisher attached (see
    // RabbitMqEventPublisherAdapter in itinerary-service) so this event's
    // processing logs trace back to the original request. Falls back to a
    // fresh ID for messages published without one.
    const correlationId = msg.properties.correlationId || randomUUID();
    await RequestContext.run(correlationId, () => handler(event));
  }

  private tryExtractItineraryId(msg: amqplib.ConsumeMessage): string | undefined {
    try {
      return (JSON.parse(msg.content.toString()) as ItineraryCreatedEvent).itineraryId;
    } catch {
      return undefined;
    }
  }

  async stop(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
