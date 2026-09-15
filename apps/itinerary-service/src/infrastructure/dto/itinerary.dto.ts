import { ApiProperty } from '@nestjs/swagger';
import { Itinerary } from '../../domain/itinerary.entity';

export class ItineraryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  originAirportId: number;

  @ApiProperty()
  destinationAirportId: number;

  @ApiProperty()
  departureDate: string;

  @ApiProperty()
  durationDays: number;

  @ApiProperty()
  createdAt: string;

  static fromDomain(itinerary: Itinerary): ItineraryDto {
    const dto = new ItineraryDto();
    dto.id = itinerary.id ?? '';
    dto.originAirportId = itinerary.originAirportId;
    dto.destinationAirportId = itinerary.destinationAirportId;
    dto.departureDate = itinerary.departureDate.toISOString();
    dto.durationDays = itinerary.durationDays;
    dto.createdAt = itinerary.createdAt.toISOString();
    return dto;
  }
}
