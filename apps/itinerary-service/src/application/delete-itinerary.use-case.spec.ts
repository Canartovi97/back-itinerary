import { ItineraryNotFoundError } from '../domain/errors/itinerary-domain.errors';
import { Itinerary } from '../domain/itinerary.entity';
import { ItineraryRepository } from '../domain/ports/itinerary-repository.port';
import { DeleteItineraryUseCase } from './delete-itinerary.use-case';

describe('DeleteItineraryUseCase (SCRUM-25)', () => {
  const existing = Itinerary.create({
    id: 'itin-1',
    originAirportId: 1,
    destinationAirportId: 2,
    departureDate: new Date(Date.now() + 86_400_000),
    durationDays: 3,
  });

  function buildRepo(itineraries: Itinerary[]): ItineraryRepository {
    return {
      save: async (i) => i,
      update: async (i) => i,
      findAll: async () => itineraries,
      findById: async (id) => itineraries.find((i) => i.id === id) ?? null,
      delete: jest.fn().mockResolvedValue(undefined),
    };
  }

  it('deletes the itinerary when given a valid id', async () => {
    const repo = buildRepo([existing]);
    const useCase = new DeleteItineraryUseCase(repo);

    await useCase.execute('itin-1');

    expect(repo.delete).toHaveBeenCalledWith('itin-1');
  });

  it('throws a controlled ItineraryNotFoundError for an unknown id, instead of calling delete', async () => {
    const repo = buildRepo([]);
    const useCase = new DeleteItineraryUseCase(repo);

    await expect(useCase.execute('missing-id')).rejects.toThrow(ItineraryNotFoundError);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
