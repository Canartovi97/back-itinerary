import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  TOURIST_ATTRACTION_PROVIDER,
  TouristAttractionProvider,
} from '../domain/ports/tourist-attraction-provider.port';
import { TouristAttraction } from '../domain/tourist-attraction.entity';

/**
 * Lists what there is to do around an airport's destination, so the
 * itinerary planner can suggest activities for the trip.
 */
@Injectable()
export class ListAirportAttractionsUseCase {
  constructor(
    @Inject(TOURIST_ATTRACTION_PROVIDER) private readonly provider: TouristAttractionProvider,
  ) {}

  async execute(airportId: number): Promise<TouristAttraction[]> {
    const attractions = await this.provider.findByAirport(airportId);
    if (!attractions) {
      throw new NotFoundException(`Airport with id ${airportId} not found`);
    }
    return attractions;
  }
}
