import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  CABIN_CLASSES,
  CURRENCIES,
  CabinClass,
  Currency,
  DOCUMENT_TYPES,
  DocumentType,
  ITINERARY_STATUSES,
  ItineraryDetails,
  ItineraryStatus,
  LIMITS,
  LODGING_TYPES,
  LodgingType,
  TRIP_TYPES,
  TripType,
} from '../../domain/itinerary-details';

/*
 * Request/response shapes for the trip details. The domain
 * (validateItineraryDetails) owns the business rules; these decorators only
 * reject malformed input early with a field-level message.
 */

export class TravelersDto {
  @ApiProperty({ example: 2, minimum: 1, maximum: LIMITS.maxTravelers })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LIMITS.maxTravelers)
  adults: number;

  @ApiProperty({ example: 1, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(LIMITS.maxTravelers)
  children: number;

  @ApiProperty({ enum: CABIN_CLASSES, example: 'ECONOMY' })
  @IsIn(CABIN_CLASSES)
  cabinClass: CabinClass;
}

export class LodgingDto {
  @ApiProperty({ enum: LODGING_TYPES, example: 'HOTEL' })
  @IsIn(LODGING_TYPES)
  type: LodgingType;

  @ApiPropertyOptional({ example: 'Hotel Caribe', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string | null;

  @ApiPropertyOptional({ example: 'Cra. 1 #2-87, Bocagrande', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string | null;
}

export class BudgetDto {
  @ApiPropertyOptional({ example: 3500000, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number | null;

  @ApiProperty({ enum: CURRENCIES, example: 'COP' })
  @IsIn(CURRENCIES)
  currency: Currency;
}

export class TourGuideDto {
  @ApiProperty({ example: 'Ana Pérez — Tours Ciudad Amurallada' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional({ example: 'ana@tours.example', nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ example: 'Español, English', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  language?: string | null;

  @ApiPropertyOptional({ example: 'Walking tour, day 2, 9am', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string | null;
}

export class EmergencyContactDto {
  @ApiProperty({ example: 'María Gómez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Madre', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  relationship?: string | null;

  @ApiProperty({ example: '+57 310 000 0000' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string;
}

export class TravelDocumentDto {
  @ApiProperty({ enum: DOCUMENT_TYPES, example: 'PASSPORT' })
  @IsIn(DOCUMENT_TYPES)
  type: DocumentType;

  @ApiPropertyOptional({
    example: 'AB123456',
    nullable: true,
    description: 'Number or reference of the document — the document itself is never stored',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  reference?: string | null;

  @ApiPropertyOptional({ example: '2031-05-01', nullable: true })
  @IsOptional()
  @IsDateString({ strict: true })
  expiresOn?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string | null;
}

export class PlannedAttractionDto {
  @ApiProperty({ example: 13, description: "The attraction's id in Airport Service" })
  @Type(() => Number)
  @IsInt()
  attractionId: number;

  @ApiProperty({ example: 'Santuario de las Lajas' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Ipiales' })
  @IsString()
  @MaxLength(100)
  city: string;
}

/**
 * The optional trip-details sections accepted on create and update. On
 * update, a section that is sent replaces the stored one; omitted sections
 * are kept.
 */
export class ItineraryDetailsInputDto {
  @ApiPropertyOptional({ enum: TRIP_TYPES, example: 'ROUND_TRIP' })
  @IsOptional()
  @IsIn(TRIP_TYPES)
  tripType?: TripType;

  @ApiPropertyOptional({ type: TravelersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TravelersDto)
  travelers?: TravelersDto;

  @ApiPropertyOptional({ type: LodgingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LodgingDto)
  lodging?: LodgingDto;

  @ApiPropertyOptional({ type: BudgetDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetDto)
  budget?: BudgetDto;

  @ApiPropertyOptional({ enum: ITINERARY_STATUSES, example: 'PLANNED' })
  @IsOptional()
  @IsIn(ITINERARY_STATUSES)
  status?: ItineraryStatus;

  @ApiPropertyOptional({ maxLength: LIMITS.maxNotes, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.maxNotes)
  notes?: string | null;

  @ApiPropertyOptional({ type: TourGuideDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(LIMITS.maxGuides)
  @ValidateNested({ each: true })
  @Type(() => TourGuideDto)
  guides?: TourGuideDto[];

  @ApiPropertyOptional({ type: EmergencyContactDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(LIMITS.maxEmergencyContacts)
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  emergencyContacts?: EmergencyContactDto[];

  @ApiPropertyOptional({ type: TravelDocumentDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(LIMITS.maxDocuments)
  @ValidateNested({ each: true })
  @Type(() => TravelDocumentDto)
  documents?: TravelDocumentDto[];

  @ApiPropertyOptional({ type: PlannedAttractionDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(LIMITS.maxAttractions)
  @ValidateNested({ each: true })
  @Type(() => PlannedAttractionDto)
  attractions?: PlannedAttractionDto[];
}

/** Maps the request sections onto the domain shape (blank text → null). */
export function toDetailsInput(dto: ItineraryDetailsInputDto): Partial<ItineraryDetails> {
  return {
    tripType: dto.tripType,
    travelers: dto.travelers && { ...dto.travelers },
    lodging: dto.lodging && {
      type: dto.lodging.type,
      name: text(dto.lodging.name),
      address: text(dto.lodging.address),
    },
    budget: dto.budget && { amount: dto.budget.amount ?? null, currency: dto.budget.currency },
    status: dto.status,
    notes: dto.notes === undefined ? undefined : text(dto.notes),
    guides: dto.guides?.map((g) => ({
      name: g.name.trim(),
      phone: text(g.phone),
      email: text(g.email),
      language: text(g.language),
      notes: text(g.notes),
    })),
    emergencyContacts: dto.emergencyContacts?.map((c) => ({
      name: c.name.trim(),
      relationship: text(c.relationship),
      phone: c.phone.trim(),
    })),
    documents: dto.documents?.map((d) => ({
      type: d.type,
      reference: text(d.reference),
      expiresOn: d.expiresOn ?? null,
      notes: text(d.notes),
    })),
    attractions: dto.attractions?.map((a) => ({
      attractionId: a.attractionId,
      name: a.name.trim(),
      city: a.city.trim(),
    })),
  };
}

function text(value: string | null | undefined): string | null {
  return value?.trim() ? value.trim() : null;
}
