import { Inject, Injectable } from '@nestjs/common';
import { Itinerary } from '../domain/itinerary.entity';
import {
  ITINERARY_REPOSITORY,
  ItineraryRepository,
} from '../domain/ports/itinerary-repository.port';

/**
 * Lists the itineraries owned by the given user — itineraries are personal
 * data, so one user never sees another user's trips.
 */
@Injectable()
export class ListItinerariesUseCase {
  constructor(@Inject(ITINERARY_REPOSITORY) private readonly repository: ItineraryRepository) {}

  async execute(userId: string): Promise<Itinerary[]> {
    return this.repository.findAllByUser(userId);
  }
}
