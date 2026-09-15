import { NotFoundException } from '@nestjs/common';
import { Airport } from '../domain/airport.entity';
import { AirportProviderUnavailableError } from '../domain/errors/airport-provider-unavailable.error';
import { AirportCache } from '../domain/ports/airport-cache.port';
import { AirportProvider } from '../domain/ports/airport-provider.port';
import { GetAirportByIdUseCase } from './get-airport-by-id.use-case';

class FakeAirportCache implements AirportCache {
  private byId = new Map<number, Airport>();

  async get(id: number): Promise<Airport | null> {
    return this.byId.get(id) ?? null;
  }
  async set(id: number, airport: Airport): Promise<void> {
    this.byId.set(id, airport);
  }
  async list(): Promise<Airport[] | null> {
    return null;
  }
  async setList(): Promise<void> {
    /* not used in these tests */
  }
}

const sampleAirport = Airport.create({
  id: 1,
  name: 'El Dorado International Airport',
  city: 'Bogota',
  country: 'Colombia',
  iataCode: 'BOG',
  latitude: 4.7016,
  longitude: -74.1469,
});

describe('GetAirportByIdUseCase', () => {
  it('returns the airport and populates the cache on a cache miss', async () => {
    const provider: AirportProvider = {
      findAll: async () => [],
      findById: async () => sampleAirport,
    };
    const cache = new FakeAirportCache();
    const useCase = new GetAirportByIdUseCase(provider, cache);

    const result = await useCase.execute(1);

    expect(result).toEqual(sampleAirport);
    await expect(cache.get(1)).resolves.toEqual(sampleAirport);
  });

  it('throws NotFoundException when the airport does not exist', async () => {
    const provider: AirportProvider = {
      findAll: async () => [],
      findById: async () => null,
    };
    const useCase = new GetAirportByIdUseCase(provider, new FakeAirportCache());

    await expect(useCase.execute(999)).rejects.toThrow(NotFoundException);
  });

  it('propagates AirportProviderUnavailableError when the provider is down', async () => {
    const provider: AirportProvider = {
      findAll: async () => [],
      findById: async () => {
        throw new AirportProviderUnavailableError();
      },
    };
    const useCase = new GetAirportByIdUseCase(provider, new FakeAirportCache());

    await expect(useCase.execute(1)).rejects.toThrow(AirportProviderUnavailableError);
  });
});
