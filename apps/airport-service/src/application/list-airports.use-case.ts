import { Inject, Injectable } from '@nestjs/common';
import { Airport } from '../domain/airport.entity';
import { AIRPORT_CACHE, AirportCache } from '../domain/ports/airport-cache.port';
import { AIRPORT_PROVIDER, AirportProvider } from '../domain/ports/airport-provider.port';

@Injectable()
export class ListAirportsUseCase {
  constructor(
    @Inject(AIRPORT_PROVIDER) private readonly provider: AirportProvider,
    @Inject(AIRPORT_CACHE) private readonly cache: AirportCache,
  ) {}

  async execute(): Promise<Airport[]> {
    const cached = await this.cache.list();
    if (cached) {
      return cached;
    }

    const airports = await this.provider.findAll();
    await this.cache.setList(airports);
    return airports;
  }
}
