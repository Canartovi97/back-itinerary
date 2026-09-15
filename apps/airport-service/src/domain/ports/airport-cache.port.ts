import { Airport } from '../airport.entity';

/**
 * Outbound port for caching airport data.
 */
export interface AirportCache {
  get(id: number): Promise<Airport | null>;
  set(id: number, airport: Airport): Promise<void>;
  list(): Promise<Airport[] | null>;
  setList(airports: Airport[]): Promise<void>;
}

export const AIRPORT_CACHE = Symbol('AIRPORT_CACHE');
