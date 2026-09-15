import { Injectable } from '@nestjs/common';
import { Airport } from '../../domain/airport.entity';
import { AirportCache } from '../../domain/ports/airport-cache.port';

/**
 * Simple in-memory implementation of the AirportCache port.
 * Suitable for a single-instance deployment / development environment.
 */
@Injectable()
export class InMemoryAirportCache implements AirportCache {
  private readonly byId = new Map<number, Airport>();
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
    for (const airport of airports) {
      this.byId.set(airport.id, airport);
    }
  }
}
