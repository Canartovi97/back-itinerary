import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { ItineraryDetailsInputDto } from './itinerary-details.dto';

/** Every field optional; a details section that is sent replaces the stored one. */
export class UpdateItineraryDto extends ItineraryDetailsInputDto {
  @ApiPropertyOptional({ example: 'Vacaciones en Cartagena', maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 3,
    description: "The origin airport's id (from Airport Service)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  originAirportId?: number;

  @ApiPropertyOptional({
    example: 25,
    description:
      "The destination airport's id (from Airport Service), must differ from originAirportId",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  destinationAirportId?: number;

  @ApiPropertyOptional({
    example: '2030-06-15',
    description: 'ISO 8601 date string, must not be in the past',
  })
  @IsOptional()
  @IsDateString()
  departureDate?: string;

  @ApiPropertyOptional({
    example: 5,
    minimum: 1,
    description: 'Trip length in days, must be greater than zero',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsPositive()
  durationDays?: number;
}
