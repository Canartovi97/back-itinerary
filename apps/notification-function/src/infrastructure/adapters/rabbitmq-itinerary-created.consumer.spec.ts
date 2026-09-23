import * as amqplib from 'amqplib';
import { RequestContext } from '../observability/request-context';
import { RabbitMqItineraryCreatedConsumer } from './rabbitmq-itinerary-created.consumer';

jest.mock('amqplib');

const sampleEvent = {
  itineraryId: 'itin-1',
  originAirportId: 1,
  destinationAirportId: 2,
  departureDate: '2026-01-01',
};

function fakeMessage(correlationId?: string): amqplib.ConsumeMessage {
  return {
    content: Buffer.from(JSON.stringify(sampleEvent)),
    properties: { correlationId } as amqplib.MessageProperties,
    fields: {} as amqplib.MessageFields,
  } as amqplib.ConsumeMessage;
}

describe('RabbitMqItineraryCreatedConsumer correlation ID continuation (SCRUM-41)', () => {
  function buildChannel(onConsume: (cb: (msg: amqplib.ConsumeMessage) => void) => void) {
    return {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockImplementation((_queue, cb) => {
        onConsume(cb);
        return Promise.resolve();
      }),
      ack: jest.fn(),
      nack: jest.fn(),
    };
  }

  it('runs the handler inside the correlation id carried on the message', async () => {
    let consumeCallback!: (msg: amqplib.ConsumeMessage) => void;
    const channel = buildChannel((cb) => (consumeCallback = cb));
    (amqplib.connect as jest.Mock).mockResolvedValue({
      createChannel: jest.fn().mockResolvedValue(channel),
    });

    const consumer = new RabbitMqItineraryCreatedConsumer('amqp://fake');
    let observedCorrelationId: string | undefined;
    await consumer.start(async () => {
      observedCorrelationId = RequestContext.getCorrelationId();
    });

    consumeCallback(fakeMessage('trace-99'));
    await new Promise((resolve) => setImmediate(resolve));

    expect(observedCorrelationId).toBe('trace-99');
    expect(channel.ack).toHaveBeenCalled();
  });

  it('falls back to a generated correlation id when the message has none', async () => {
    let consumeCallback!: (msg: amqplib.ConsumeMessage) => void;
    const channel = buildChannel((cb) => (consumeCallback = cb));
    (amqplib.connect as jest.Mock).mockResolvedValue({
      createChannel: jest.fn().mockResolvedValue(channel),
    });

    const consumer = new RabbitMqItineraryCreatedConsumer('amqp://fake');
    let observedCorrelationId: string | undefined;
    await consumer.start(async () => {
      observedCorrelationId = RequestContext.getCorrelationId();
    });

    consumeCallback(fakeMessage(undefined));
    await new Promise((resolve) => setImmediate(resolve));

    expect(observedCorrelationId).toBeTruthy();
  });
});
