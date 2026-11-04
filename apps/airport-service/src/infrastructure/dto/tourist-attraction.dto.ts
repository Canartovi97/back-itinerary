import { ApiProperty } from '@nestjs/swagger';
import { TouristAttraction } from '../../domain/tourist-attraction.entity';

export class TouristAttractionDto {
  @ApiProperty({ example: 13 })
  id: number;

  @ApiProperty({ example: 'Santuario de las Lajas' })
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ example: 'Ipiales' })
  city: string;

  @ApiProperty({ nullable: true, type: String })
  imageUrl: string | null;

  @ApiProperty({ nullable: true, type: Number })
  latitude: number | null;

  @ApiProperty({ nullable: true, type: Number })
  longitude: number | null;

  static fromDomain(attraction: TouristAttraction): TouristAttractionDto {
    const dto = new TouristAttractionDto();
    dto.id = attraction.id;
    dto.name = attraction.name;
    dto.description = attraction.description;
    dto.city = attraction.city;
    dto.imageUrl = attraction.imageUrl;
    dto.latitude = attraction.latitude;
    dto.longitude = attraction.longitude;
    return dto;
  }
}
