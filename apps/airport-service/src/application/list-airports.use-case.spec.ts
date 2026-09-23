import { Airport } from '../domain/airport.entity';
import { AirportProviderUnavailableError } from '../domain/errors/airport-provider-unavailable.error';
import { AirportCache } from '../domain/ports/airport-cache.port';
import { AirportProvider } from '../domain/ports/airport-provider.port';
import { ListAirportsUseCase } from './list-airports.use-case';

class FakeAirportProvider implements AirportProvider {
  constructor(private readonly airports: Airport[]) {}
  async findAll(): Promise<Airport[]> {
    return this.airports;
  }
  async findById(id: number): Promise<Airport | null> {
    return this.airports.find((a) => a.id === id) ?? null;
  }
}

class FakeAirportCache implements AirportCache {
  private byId = new Map<number, Airport>();
  private cachedList: Airport[] | null = null;

  async get(id: number): Promise<Airport | null> {
    return this.byId.get(id) ?? null;
  }
  async set(id: number, airport: Airport): Promise<void> {
    this.byId.set(id, airport);
  }
  async list(): Promise<Airport[] | null> {
    return this.cachedList;
  }
  async setList(airports: Airport[]): Promise<void> {
    this.cachedList = airports;
  }
}

describe('ListAirportsUseCase', () => {
  const sampleAirports = [
    Airport.create({
      id: 1,
      name: 'El Dorado International Airport',
      city: 'Bogota',
      country: 'Colombia',
      iataCode: 'BOG',
      latitude: 4.7016,
      longitude: -74.1469,
    }),
    Airport.create({
      id: 2,
      name: 'Jose Maria Cordova International Airport',
      city: 'Medellin',
      country: 'Colombia',
      iataCode: 'MDE',
      latitude: 6.1645,
      longitude: -75.4231,
    }),
  ];

  it('fetches from provider and populates cache on first call', async () => {
    const provider = new FakeAirportProvider(sampleAirports);
    const cache = new FakeAirportCache();
    const spy = jest.spyOn(provider, 'findAll');

    const useCase = new ListAirportsUseCase(provider, cache);
    const result = await useCase.execute();

    expect(result).toEqual(sampleAirports);
    expect(spy).toHaveBeenCalledTimes(1);
    await expect(cache.list()).resolves.toEqual(sampleAirports);
  });

  it('returns cached data without calling the provider again', async () => {
    const provider = new FakeAirportProvider(sampleAirports);
    const cache = new FakeAirportCache();
    await cache.setList(sampleAirports);
    const spy = jest.spyOn(provider, 'findAll');

    const useCase = new ListAirportsUseCase(provider, cache);
    const result = await useCase.execute();

    expect(result).toEqual(sampleAirports);
    expect(spy).not.toHaveBeenCalled();
  });

  it('propagates AirportProviderUnavailableError when api-colombia does not respond (SCRUM-13)', async () => {
    const provider: AirportProvider = {
      findAll: async () => {
        throw new AirportProviderUnavailableError();
      },
      findById: async () => null,
    };
    const useCase = new ListAirportsUseCase(provider, new FakeAirportCache());

    await expect(useCase.execute()).rejects.toThrow(AirportProviderUnavailableError);
  });
});
