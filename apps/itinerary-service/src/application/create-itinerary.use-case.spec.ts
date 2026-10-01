import { AirportNotFoundError } from '../domain/errors/itinerary-domain.errors';
import { Itinerary } from '../domain/itinerary.entity';
import { AirportValidationPort } from '../domain/ports/airport-validation.port';
import { EventPublisherPort, ItineraryCreatedEvent } from '../domain/ports/event-publisher.port';
import { ItineraryRepository } from '../domain/ports/itinerary-repository.port';
import { CreateItineraryUseCase } from './create-itinerary.use-case';

/**
 * SCRUM-31: the ItineraryCreated event must be published only after a
 * successful creation, and must carry the minimum information a consumer
 * (notification-function) needs.
 */
describe('CreateItineraryUseCase event publication (SCRUM-31)', () => {
  const validCommand = {
    originAirportId: 1,
    destinationAirportId: 2,
    departureDate: new Date(Date.now() + 86_400_000).toISOString(),
    durationDays: 3,
  };

  function buildUseCase(options: {
    airportsExist?: boolean;
    saveImpl?: (i: Itinerary) => Promise<Itinerary>;
  }) {
    const published: ItineraryCreatedEvent[] = [];

    const repository: ItineraryRepository = {
      save:
        options.saveImpl ?? (async (i) => Itinerary.create({ ...i, id: 'itin-1' }, new Date(0))),
      findById: async () => null,
      findAll: async () => [],
      update: async (i) => i,
      delete: async () => undefined,
    };

    const airportValidation: AirportValidationPort = {
      exists: async () => options.airportsExist ?? true,
    };

    const eventPublisher: EventPublisherPort = {
      publishItineraryCreated: async (event) => {
        published.push(event);
      },
    };

    const useCase = new CreateItineraryUseCase(repository, airportValidation, eventPublisher);
    return { useCase, published };
  }

  it('publishes the event only after the itinerary is successfully saved', async () => {
    const { useCase, published } = buildUseCase({});

    const result = await useCase.execute(validCommand);

    expect(published).toHaveLength(1);
    expect(published[0]).toEqual({
      itineraryId: result.id,
      originAirportId: 1,
      destinationAirportId: 2,
      departureDate: result.departureDate.toISOString(),
    });
  });

  it('does not publish anything when an airport does not exist', async () => {
    const { useCase, published } = buildUseCase({ airportsExist: false });

    await expect(useCase.execute(validCommand)).rejects.toThrow(AirportNotFoundError);
    expect(published).toHaveLength(0);
  });

  it('does not publish anything when persistence fails', async () => {
    const { useCase, published } = buildUseCase({
      saveImpl: async () => {
        throw new Error('db unavailable');
      },
    });

    await expect(useCase.execute(validCommand)).rejects.toThrow('db unavailable');
    expect(published).toHaveLength(0);
  });
});
