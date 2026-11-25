import { Inject, Injectable } from '@nestjs/common';
import { ItineraryNotFoundError } from '../domain/errors/itinerary-domain.errors';
import { Itinerary } from '../domain/itinerary.entity';
import {
  ITINERARY_REPOSITORY,
  ItineraryRepository,
} from '../domain/ports/itinerary-repository.port';

@Injectable()
export class GetItineraryUseCase {
  constructor(@Inject(ITINERARY_REPOSITORY) private readonly repository: ItineraryRepository) {}

  /**
   * Another user's itinerary is reported as not found rather than forbidden,
   * so the API never reveals which itinerary ids exist.
   */
  async execute(id: string, userId: string): Promise<Itinerary> {
    const itinerary = await this.repository.findById(id);
    if (!itinerary || !itinerary.isOwnedBy(userId)) {
      throw new ItineraryNotFoundError(id);
    }
    return itinerary;
  }
}
