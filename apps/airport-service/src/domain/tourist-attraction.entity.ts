/**
 * A tourist attraction near an airport's destination, modeled after
 * https://api-colombia.com/api/v1/Department/{id}/touristicattractions.
 */
export class TouristAttraction {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly description: string,
    public readonly city: string,
    public readonly imageUrl: string | null,
    public readonly latitude: number | null,
    public readonly longitude: number | null,
  ) {
    if (!name || name.trim().length === 0) {
      throw new Error('Tourist attraction name must not be empty');
    }
  }
}
