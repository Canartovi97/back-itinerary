import { Inject, Injectable } from '@nestjs/common';
import { ItineraryNotFoundError } from '../domain/errors/itinerary-domain.errors';
import { Itinerary } from '../domain/itinerary.entity';
import {
  ITINERARY_REPOSITORY,
  ItineraryRepository,
} from '../domain/ports/itinerary-repository.port';

export interface UpdateItineraryCommand {
  originAirportId?: number;
  destinationAirportId?: number;
  departureDate?: string;
  durationDays?: number;
}

@Injectable()
export class UpdateItineraryUseCase {
  constructor(@Inject(ITINERARY_REPOSITORY) private readonly repository: ItineraryRepository) {}

  async execute(id: string, command: UpdateItineraryCommand): Promise<Itinerary> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new ItineraryNotFoundError(id);
    }

    const updated = existing.withUpdates({
      originAirportId: command.originAirportId,
      destinationAirportId: command.destinationAirportId,
      departureDate: command.departureDate ? new Date(command.departureDate) : undefined,
      durationDays: command.durationDays,
    });

    return this.repository.update(updated);
  }
}
