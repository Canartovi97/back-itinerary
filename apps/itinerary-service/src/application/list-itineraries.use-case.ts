import { Inject, Injectable } from '@nestjs/common';
import { Itinerary } from '../domain/itinerary.entity';
import {
  ITINERARY_REPOSITORY,
  ItineraryRepository,
} from '../domain/ports/itinerary-repository.port';

@Injectable()
export class ListItinerariesUseCase {
  constructor(@Inject(ITINERARY_REPOSITORY) private readonly repository: ItineraryRepository) {}

  async execute(): Promise<Itinerary[]> {
    return this.repository.findAll();
  }
}
