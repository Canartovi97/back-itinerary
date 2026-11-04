import {
  AirportNotFoundError,
  AirportServiceUnavailableError,
  ItineraryNotFoundError,
} from '../domain/errors/itinerary-domain.errors';
import { Itinerary } from '../domain/itinerary.entity';
import { AirportValidationPort } from '../domain/ports/airport-validation.port';
import { ItineraryRepository } from '../domain/ports/itinerary-repository.port';
import { GetItineraryUseCase } from './get-itinerary.use-case';
import { ListItinerariesUseCase } from './list-itineraries.use-case';
import { UpdateItineraryUseCase } from './update-itinerary.use-case';

/**
 * PROYEC-11: itineraries are consulted per user (list and by id), and one
 * user can never read or change another user's itinerary.
 * PROYEC-14: updating to a different airport validates it like creation does.
 */
describe('Itinerary queries and updates scoped to the owner (PROYEC-11 / PROYEC-14)', () => {
  const departure = new Date(Date.now() + 86_400_000);
  const mine = Itinerary.create({
    id: 'itin-1',
    name: 'Mine',
    userId: 'user-1',
    originAirportId: 1,
    destinationAirportId: 2,
    departureDate: departure,
    durationDays: 3,
  });
  const theirs = Itinerary.create({
    id: 'itin-2',
    name: 'Theirs',
    userId: 'user-2',
    originAirportId: 3,
    destinationAirportId: 4,
    departureDate: departure,
    durationDays: 2,
  });

  function buildRepo(): ItineraryRepository & { updated: Itinerary[] } {
    const all = [mine, theirs];
    const updated: Itinerary[] = [];
    return {
      updated,
      save: async (i) => i,
      findById: async (id) => all.find((i) => i.id === id) ?? null,
      findAllByUser: async (userId) => all.filter((i) => i.isOwnedBy(userId)),
      update: async (i) => {
        updated.push(i);
        return i;
      },
      delete: async () => undefined,
    };
  }

  function airports(exists: (id: number) => Promise<boolean>): AirportValidationPort & {
    checked: number[];
  } {
    const checked: number[] = [];
    return {
      checked,
      exists: async (id) => {
        checked.push(id);
        return exists(id);
      },
    };
  }

  it('lists only the itineraries of the requesting user', async () => {
    const result = await new ListItinerariesUseCase(buildRepo()).execute('user-1');

    expect(result.map((i) => i.id)).toEqual(['itin-1']);
  });

  it('returns an own itinerary by id with its owner, airports, date and duration', async () => {
    const result = await new GetItineraryUseCase(buildRepo()).execute('itin-1', 'user-1');

    expect(result).toMatchObject({
      userId: 'user-1',
      originAirportId: 1,
      destinationAirportId: 2,
      departureDate: departure,
      durationDays: 3,
    });
  });

  it("reports another user's itinerary as not found", async () => {
    await expect(new GetItineraryUseCase(buildRepo()).execute('itin-2', 'user-1')).rejects.toThrow(
      ItineraryNotFoundError,
    );
  });

  it("refuses to update another user's itinerary", async () => {
    const repo = buildRepo();
    const useCase = new UpdateItineraryUseCase(
      repo,
      airports(async () => true),
    );

    await expect(useCase.execute('itin-2', 'user-1', { name: 'Hijacked' })).rejects.toThrow(
      ItineraryNotFoundError,
    );
    expect(repo.updated).toHaveLength(0);
  });

  it('renames without calling Airport Service when the airports did not change', async () => {
    const repo = buildRepo();
    const validation = airports(async () => true);

    const result = await new UpdateItineraryUseCase(repo, validation).execute('itin-1', 'user-1', {
      name: 'Renamed',
    });

    expect(result.name).toBe('Renamed');
    expect(validation.checked).toEqual([]);
  });

  it('validates only the airport that changed', async () => {
    const validation = airports(async () => true);

    await new UpdateItineraryUseCase(buildRepo(), validation).execute('itin-1', 'user-1', {
      destinationAirportId: 9,
    });

    expect(validation.checked).toEqual([9]);
  });

  it('does not save when the new airport does not exist', async () => {
    const repo = buildRepo();
    const useCase = new UpdateItineraryUseCase(
      repo,
      airports(async () => false),
    );

    await expect(useCase.execute('itin-1', 'user-1', { destinationAirportId: 9 })).rejects.toThrow(
      AirportNotFoundError,
    );
    expect(repo.updated).toHaveLength(0);
  });

  it('does not save when Airport Service is unavailable', async () => {
    const repo = buildRepo();
    const useCase = new UpdateItineraryUseCase(
      repo,
      airports(async () => {
        throw new AirportServiceUnavailableError();
      }),
    );

    await expect(useCase.execute('itin-1', 'user-1', { originAirportId: 9 })).rejects.toThrow(
      AirportServiceUnavailableError,
    );
    expect(repo.updated).toHaveLength(0);
  });
});
