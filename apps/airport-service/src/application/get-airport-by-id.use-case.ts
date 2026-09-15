import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Airport } from '../domain/airport.entity';
import { AIRPORT_CACHE, AirportCache } from '../domain/ports/airport-cache.port';
import { AIRPORT_PROVIDER, AirportProvider } from '../domain/ports/airport-provider.port';

@Injectable()
export class GetAirportByIdUseCase {
  constructor(
    @Inject(AIRPORT_PROVIDER) private readonly provider: AirportProvider,
    @Inject(AIRPORT_CACHE) private readonly cache: AirportCache,
  ) {}

  async execute(id: number): Promise<Airport> {
    const cached = await this.cache.get(id);
    if (cached) {
      return cached;
    }

    const airport = await this.provider.findById(id);
    if (!airport) {
      throw new NotFoundException(`Airport with id ${id} not found`);
    }

    await this.cache.set(id, airport);
    return airport;
  }
}
