import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { RabbitMqEventPublisherAdapter } from './rabbitmq-event-publisher.adapter';

jest.mock('amqplib');

/**
 * SCRUM-35: itinerary-service must never be affected by notification-
 * function's execution. These two sides only talk through RabbitMQ, so
 * the guarantee that matters here is that publishing is fire-and-forget —
 * itinerary-service doesn't wait for the message to be consumed (let
 * alone processed successfully) before moving on, so a slow or failing
 * notification-function can't block or fail an itinerary creation.
 */
describe('RabbitMqEventPublisherAdapter isolation from the consumer (SCRUM-35)', () => {
  function buildConfigService(): ConfigService {
    return { get: (_key: string, fallback?: unknown) => fallback } as unknown as ConfigService;
  }

  it('resolves publishItineraryCreated without waiting on any consumer acknowledgment', async () => {
    const publish = jest.fn().mockReturnValue(true);
    const channel = {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      publish,
    };
    (amqplib.connect as jest.Mock).mockResolvedValue({
      createChannel: jest.fn().mockResolvedValue(channel),
    });

    const adapter = new RabbitMqEventPublisherAdapter(buildConfigService());
    await adapter.onModuleInit();

    await adapter.publishItineraryCreated({
      itineraryId: 'itin-1',
      originAirportId: 1,
      destinationAirportId: 2,
      departureDate: '2030-01-01T00:00:00.000Z',
    });

    // channel.publish in amqplib is synchronous (fire-and-forget) — there is
    // no await on an ack from any consumer, so this resolving at all proves
    // the call never depended on notification-function existing or
    // succeeding.
    expect(publish).toHaveBeenCalledTimes(1);
  });

  it('does not throw when RabbitMQ itself is unavailable, so a broker outage cannot fail itinerary creation either', async () => {
    (amqplib.connect as jest.Mock).mockRejectedValue(new Error('connection refused'));

    const adapter = new RabbitMqEventPublisherAdapter(buildConfigService());
    await adapter.onModuleInit();

    await expect(
      adapter.publishItineraryCreated({
        itineraryId: 'itin-1',
        originAirportId: 1,
        destinationAirportId: 2,
        departureDate: '2030-01-01T00:00:00.000Z',
      }),
    ).resolves.toBeUndefined();
  });
});
