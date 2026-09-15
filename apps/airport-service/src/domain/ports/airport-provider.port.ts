import { Airport } from '../airport.entity';

/**
 * Outbound port for fetching airport data from an external source.
 */
export interface AirportProvider {
  findAll(): Promise<Airport[]>;
  findById(id: number): Promise<Airport | null>;
}

export const AIRPORT_PROVIDER = Symbol('AIRPORT_PROVIDER');
