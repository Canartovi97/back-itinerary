import { ApiProperty } from '@nestjs/swagger';
import { Airport } from '../../domain/airport.entity';

export class AirportDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  iataCode: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  static fromDomain(airport: Airport): AirportDto {
    const dto = new AirportDto();
    dto.id = airport.id;
    dto.name = airport.name;
    dto.city = airport.city;
    dto.country = airport.country;
    dto.iataCode = airport.iataCode;
    dto.latitude = airport.latitude;
    dto.longitude = airport.longitude;
    return dto;
  }
}
