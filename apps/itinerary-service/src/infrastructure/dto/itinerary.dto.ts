import { ApiProperty } from '@nestjs/swagger';
import { Itinerary } from '../../domain/itinerary.entity';

export class ItineraryDto {
  @ApiProperty({ example: 'b3f1c2a0-5e4d-4b8a-9c1e-2f3a4b5c6d7e' })
  id: string;

  @ApiProperty({ example: 3 })
  originAirportId: number;

  @ApiProperty({ example: 25 })
  destinationAirportId: number;

  @ApiProperty({ example: '2030-06-15T00:00:00.000Z' })
  departureDate: string;

  @ApiProperty({ example: 5 })
  durationDays: number;

  @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
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
