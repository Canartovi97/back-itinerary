import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsPositive, Min } from 'class-validator';

export class CreateItineraryDto {
  @ApiProperty()
  @IsInt()
  originAirportId: number;

  @ApiProperty()
  @IsInt()
  destinationAirportId: number;

  @ApiProperty({ description: 'ISO 8601 date string, must not be in the past' })
  @IsDateString()
  departureDate: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @IsPositive()
  durationDays: number;
}
