import { ApiProperty } from '@nestjs/swagger';
import {
  CABIN_CLASSES,
  ITINERARY_STATUSES,
  ItineraryStatus,
  TRIP_TYPES,
  TripType,
} from '../../domain/itinerary-details';
import { Itinerary } from '../../domain/itinerary.entity';
import {
  BudgetDto,
  EmergencyContactDto,
  LodgingDto,
  PlannedAttractionDto,
  TourGuideDto,
  TravelDocumentDto,
  TravelersDto,
} from './itinerary-details.dto';

export class ItineraryDto {
  @ApiProperty({ example: 'b3f1c2a0-5e4d-4b8a-9c1e-2f3a4b5c6d7e' })
  id: string;

  @ApiProperty({ example: 'Vacaciones en Cartagena' })
  name: string;

  @ApiProperty({
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    description: 'The owner: id of the user that created the itinerary',
  })
  userId: string;

  @ApiProperty({ example: 3 })
  originAirportId: number;

  @ApiProperty({ example: 25 })
  destinationAirportId: number;

  @ApiProperty({ example: '2030-06-15T00:00:00.000Z' })
  departureDate: string;

  @ApiProperty({ example: 5 })
  durationDays: number;

  @ApiProperty({ enum: TRIP_TYPES })
  tripType: TripType;

  @ApiProperty({
    example: '2030-06-20T00:00:00.000Z',
    nullable: true,
    type: String,
    description: 'departureDate + durationDays for a round trip; null for one way',
  })
  returnDate: string | null;

  @ApiProperty({
    type: TravelersDto,
    example: { adults: 2, children: 0, cabinClass: CABIN_CLASSES[0] },
  })
  travelers: TravelersDto;

  @ApiProperty({ type: LodgingDto })
  lodging: LodgingDto;

  @ApiProperty({ type: BudgetDto })
  budget: BudgetDto;

  @ApiProperty({ enum: ITINERARY_STATUSES })
  status: ItineraryStatus;

  @ApiProperty({ nullable: true, type: String })
  notes: string | null;

  @ApiProperty({ type: TourGuideDto, isArray: true })
  guides: TourGuideDto[];

  @ApiProperty({ type: EmergencyContactDto, isArray: true })
  emergencyContacts: EmergencyContactDto[];

  @ApiProperty({ type: TravelDocumentDto, isArray: true })
  documents: TravelDocumentDto[];

  @ApiProperty({
    type: TravelDocumentDto,
    isArray: true,
    description: 'Documents that expire before the trip ends — shown to the traveler as a warning',
  })
  documentsExpiringDuringTrip: TravelDocumentDto[];

  @ApiProperty({ type: PlannedAttractionDto, isArray: true })
  attractions: PlannedAttractionDto[];

  @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
  createdAt: string;

  static fromDomain(itinerary: Itinerary): ItineraryDto {
    const d = itinerary.details;
    const dto = new ItineraryDto();
    dto.id = itinerary.id ?? '';
    dto.name = itinerary.name;
    dto.userId = itinerary.userId;
    dto.originAirportId = itinerary.originAirportId;
    dto.destinationAirportId = itinerary.destinationAirportId;
    dto.departureDate = itinerary.departureDate.toISOString();
    dto.durationDays = itinerary.durationDays;
    dto.tripType = d.tripType;
    dto.returnDate = itinerary.returnDate?.toISOString() ?? null;
    dto.travelers = { ...d.travelers };
    dto.lodging = { ...d.lodging };
    dto.budget = { ...d.budget };
    dto.status = d.status;
    dto.notes = d.notes;
    dto.guides = d.guides.map((g) => ({ ...g }));
    dto.emergencyContacts = d.emergencyContacts.map((c) => ({ ...c }));
    dto.documents = d.documents.map((doc) => ({ ...doc }));
    dto.documentsExpiringDuringTrip = itinerary
      .documentsExpiringDuringTrip()
      .map((doc) => ({ ...doc }));
    dto.attractions = d.attractions.map((a) => ({ ...a }));
    dto.createdAt = itinerary.createdAt.toISOString();
    return dto;
  }
}
