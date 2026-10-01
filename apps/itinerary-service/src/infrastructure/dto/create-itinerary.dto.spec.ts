import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateItineraryDto } from './create-itinerary.dto';

/**
 * Every real caller (JSON body, HTML form) sends these fields as strings.
 * Without @Type(() => Number), class-validator's @IsInt() rejects them
 * outright — this is exactly the bug found testing the real form end to
 * end, where "3" failed with "originAirportId must be an integer number".
 */
describe('CreateItineraryDto numeric coercion', () => {
  it("accepts string numeric fields the way NestJS's ValidationPipe (transform: true) feeds them", async () => {
    const dto = plainToInstance(CreateItineraryDto, {
      originAirportId: '3',
      destinationAirportId: '25',
      departureDate: '2030-01-01',
      durationDays: '5',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.originAirportId).toBe(3);
    expect(dto.destinationAirportId).toBe(25);
    expect(dto.durationDays).toBe(5);
  });

  it('still rejects a genuinely non-numeric value', async () => {
    const dto = plainToInstance(CreateItineraryDto, {
      originAirportId: 'not-a-number',
      destinationAirportId: '25',
      departureDate: '2030-01-01',
      durationDays: '5',
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'originAirportId')).toBe(true);
  });
});
