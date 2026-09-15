import { Inject, Injectable } from '@nestjs/common';
import { AirportNotFoundError } from '../domain/errors/itinerary-domain.errors';
import { Itinerary } from '../domain/itinerary.entity';
import {
  AIRPORT_VALIDATION_PORT,
  AirportValidationPort,
} from '../domain/ports/airport-validation.port';
import { EVENT_PUBLISHER_PORT, EventPublisherPort } from '../domain/ports/event-publisher.port';
import {
  ITINERARY_REPOSITORY,
  ItineraryRepository,
} from '../domain/ports/itinerary-repository.port';

export interface CreateItineraryCommand {
  originAirportId: number;
  destinationAirportId: number;
  departureDate: string;
  durationDays: number;
}

@Injectable()
export class CreateItineraryUseCase {
  constructor(
    @Inject(ITINERARY_REPOSITORY) private readonly repository: ItineraryRepository,
    @Inject(AIRPORT_VALIDATION_PORT) private readonly airportValidation: AirportValidationPort,
    @Inject(EVENT_PUBLISHER_PORT) private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(command: CreateItineraryCommand): Promise<Itinerary> {
    // 1. Validate domain invariants (throws domain errors on violation)
    const itinerary = Itinerary.create({
      originAirportId: command.originAirportId,
      destinationAirportId: command.destinationAirportId,
      departureDate: new Date(command.departureDate),
      durationDays: command.durationDays,
    });

    // 2. Validate that both airports exist via the Airport Service
    const [originExists, destinationExists] = await Promise.all([
      this.airportValidation.exists(itinerary.originAirportId),
      this.airportValidation.exists(itinerary.destinationAirportId),
    ]);
    if (!originExists) {
      throw new AirportNotFoundError(itinerary.originAirportId);
    }
    if (!destinationExists) {
      throw new AirportNotFoundError(itinerary.destinationAirportId);
    }

    // 3. Persist
    const saved = await this.repository.save(itinerary);

    // 4. Publish integration event
    await this.eventPublisher.publishItineraryCreated({
      itineraryId: saved.id as string,
      originAirportId: saved.originAirportId,
      destinationAirportId: saved.destinationAirportId,
      departureDate: saved.departureDate.toISOString(),
    });

    return saved;
  }
}
