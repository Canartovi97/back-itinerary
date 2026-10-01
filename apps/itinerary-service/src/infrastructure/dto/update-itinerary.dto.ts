import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsPositive, Min } from 'class-validator';

export class UpdateItineraryDto {
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
