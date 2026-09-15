import { Inject, Injectable } from '@nestjs/common';
import { ItineraryNotFoundError } from '../domain/errors/itinerary-domain.errors';
import {
  ITINERARY_REPOSITORY,
  ItineraryRepository,
} from '../domain/ports/itinerary-repository.port';

@Injectable()
export class DeleteItineraryUseCase {
  constructor(@Inject(ITINERARY_REPOSITORY) private readonly repository: ItineraryRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new ItineraryNotFoundError(id);
    }
    await this.repository.delete(id);
  }
}
