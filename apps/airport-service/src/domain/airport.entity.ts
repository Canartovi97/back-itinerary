/**
 * Domain entity representing an Airport.
 * Modeled loosely after the shape exposed by https://api-colombia.com/api/v1/Airport
 */
export class Airport {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly city: string,
    public readonly country: string,
    public readonly iataCode: string,
    public readonly latitude: number,
    public readonly longitude: number,
  ) {
    if (!name || name.trim().length === 0) {
      throw new Error('Airport name must not be empty');
    }
  }

  static create(props: {
    id: number;
    name: string;
    city: string;
    country: string;
    iataCode: string;
    latitude: number;
    longitude: number;
  }): Airport {
    return new Airport(
      props.id,
      props.name,
      props.city,
      props.country,
      props.iataCode,
      props.latitude,
      props.longitude,
    );
  }
}
