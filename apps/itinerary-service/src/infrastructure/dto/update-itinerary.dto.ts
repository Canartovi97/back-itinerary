import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsPositive, Min } from 'class-validator';

export class UpdateItineraryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  originAirportId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  destinationAirportId?: number;

  @ApiPropertyOptional({ description: 'ISO 8601 date string, must not be in the past' })
  @IsOptional()
  @IsDateString()
  departureDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @IsPositive()
  durationDays?: number;
}
