import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsPositive, Min } from 'class-validator';

export class CreateItineraryDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  originAirportId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  destinationAirportId: number;

  @ApiProperty({ description: 'ISO 8601 date string, must not be in the past' })
  @IsDateString()
  departureDate: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsPositive()
  durationDays: number;
}
