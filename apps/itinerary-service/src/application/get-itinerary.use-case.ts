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

  async execute(id: string): Promise<Itinerary> {
    const itinerary = await this.repository.findById(id);
    if (!itinerary) {
      throw new ItineraryNotFoundError(id);
    }
    return itinerary;
  }
}
