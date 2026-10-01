import { Repository } from 'typeorm';
import { Itinerary } from '../../domain/itinerary.entity';
import { ItineraryOrmEntity } from './itinerary.orm-entity';
import { TypeOrmItineraryRepository } from './typeorm-itinerary.repository';

/**
 * SCRUM-29: itinerary-service persists itineraries in its own relational
 * database, independent of every other service. These tests verify the
 * adapter that talks to that database correctly maps between the ORM
 * entity (TypeORM/Postgres-shaped) and the domain Itinerary, in isolation
 * from a real database — the repository's own responsibility, not
 * TypeORM's or Postgres's.
 */
describe('TypeOrmItineraryRepository (SCRUM-29)', () => {
  const sampleEntity: ItineraryOrmEntity = {
    id: 'itin-1',
    originAirportId: 1,
    destinationAirportId: 2,
    departureDate: new Date('2030-01-01T00:00:00.000Z'),
    durationDays: 5,
    createdAt: new Date('2029-01-01T00:00:00.000Z'),
  };

  function buildRepository(ormRepo: Partial<Repository<ItineraryOrmEntity>>) {
    return new TypeOrmItineraryRepository(ormRepo as Repository<ItineraryOrmEntity>);
  }

  it('maps a saved entity back onto a domain Itinerary', async () => {
    const ormRepo: Partial<Repository<ItineraryOrmEntity>> = {
      create: jest.fn().mockReturnValue(sampleEntity),
      save: jest.fn().mockResolvedValue(sampleEntity),
    };
    const repo = buildRepository(ormRepo);

    const itinerary = Itinerary.create(
      {
        originAirportId: 1,
        destinationAirportId: 2,
        departureDate: new Date('2030-01-01T00:00:00.000Z'),
        durationDays: 5,
      },
      new Date('2029-06-01T00:00:00.000Z'),
    );

    const result = await repo.save(itinerary);

    expect(ormRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ originAirportId: 1, destinationAirportId: 2, durationDays: 5 }),
    );
    expect(result).toBeInstanceOf(Itinerary);
    expect(result.id).toBe('itin-1');
  });

  it('returns null from findById when no row matches', async () => {
    const ormRepo: Partial<Repository<ItineraryOrmEntity>> = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const repo = buildRepository(ormRepo);

    await expect(repo.findById('missing')).resolves.toBeNull();
  });

  it('maps every row from findAll onto domain Itinerary instances', async () => {
    const ormRepo: Partial<Repository<ItineraryOrmEntity>> = {
      find: jest.fn().mockResolvedValue([sampleEntity]),
    };
    const repo = buildRepository(ormRepo);

    const result = await repo.findAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Itinerary);
    expect(result[0].destinationAirportId).toBe(2);
  });

  it('delegates deletion by id to the underlying repository', async () => {
    const ormRepo: Partial<Repository<ItineraryOrmEntity>> = {
      delete: jest.fn().mockResolvedValue({ affected: 1, raw: {} }),
    };
    const repo = buildRepository(ormRepo);

    await repo.delete('itin-1');

    expect(ormRepo.delete).toHaveBeenCalledWith('itin-1');
  });
});
