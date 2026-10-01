import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsPositive, Min } from 'class-validator';

export class CreateItineraryDto {
  @ApiProperty({ example: 3, description: "The origin airport's id (from Airport Service)" })
  @Type(() => Number)
  @IsInt()
  originAirportId: number;

  @ApiProperty({
    example: 25,
    description:
      "The destination airport's id (from Airport Service), must differ from originAirportId",
  })
  @Type(() => Number)
  @IsInt()
  destinationAirportId: number;

  @ApiProperty({
    example: '2030-06-15',
    description: 'ISO 8601 date string, must not be in the past',
  })
  @IsDateString()
  departureDate: string;

  @ApiProperty({
    example: 5,
    minimum: 1,
    description: 'Trip length in days, must be greater than zero',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsPositive()
  durationDays: number;
}
