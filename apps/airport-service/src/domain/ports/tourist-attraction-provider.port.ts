import { TouristAttraction } from '../tourist-attraction.entity';

/**
 * Outbound port for the tourist attractions around an airport's destination
 * (the airport's department). Returns null when the airport doesn't exist.
 */
export interface TouristAttractionProvider {
  findByAirport(airportId: number): Promise<TouristAttraction[] | null>;
}

export const TOURIST_ATTRACTION_PROVIDER = Symbol('TOURIST_ATTRACTION_PROVIDER');
