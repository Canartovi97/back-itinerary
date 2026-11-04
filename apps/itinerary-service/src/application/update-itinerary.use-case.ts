import { Inject, Injectable } from '@nestjs/common';
import {
  AirportNotFoundError,
  ItineraryNotFoundError,
} from '../domain/errors/itinerary-domain.errors';
import { Itinerary } from '../domain/itinerary.entity';
import {
  AIRPORT_VALIDATION_PORT,
  AirportValidationPort,
} from '../domain/ports/airport-validation.port';
import {
  ITINERARY_REPOSITORY,
  ItineraryRepository,
} from '../domain/ports/itinerary-repository.port';

export interface UpdateItineraryCommand {
  name?: string;
  originAirportId?: number;
  destinationAirportId?: number;
  departureDate?: string;
  durationDays?: number;
}

@Injectable()
export class UpdateItineraryUseCase {
  constructor(
    @Inject(ITINERARY_REPOSITORY) private readonly repository: ItineraryRepository,
    @Inject(AIRPORT_VALIDATION_PORT) private readonly airportValidation: AirportValidationPort,
  ) {}

  async execute(id: string, userId: string, command: UpdateItineraryCommand): Promise<Itinerary> {
    const existing = await this.repository.findById(id);
    if (!existing || !existing.isOwnedBy(userId)) {
      throw new ItineraryNotFoundError(id);
    }

    const updated = existing.withUpdates({
      name: command.name,
      originAirportId: command.originAirportId,
      destinationAirportId: command.destinationAirportId,
      departureDate: command.departureDate ? new Date(command.departureDate) : undefined,
      durationDays: command.durationDays,
    });

    // Same rule as creation (PROYEC-14): an airport that changed must exist
    // in Airport Service before the itinerary is saved.
    const changedAirports = [updated.originAirportId, updated.destinationAirportId].filter(
      (airportId) =>
        airportId !== existing.originAirportId && airportId !== existing.destinationAirportId,
    );
    for (const airportId of changedAirports) {
      if (!(await this.airportValidation.exists(airportId))) {
        throw new AirportNotFoundError(airportId);
      }
    }

    return this.repository.update(updated);
  }
}
