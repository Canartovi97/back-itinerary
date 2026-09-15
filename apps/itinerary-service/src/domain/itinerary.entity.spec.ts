import {
  DepartureDateInPastError,
  InvalidDurationError,
  SameOriginAndDestinationError,
} from './errors/itinerary-domain.errors';
import { Itinerary } from './itinerary.entity';

describe('Itinerary domain entity', () => {
  const fixedNow = new Date('2027-01-10T00:00:00Z');

  it('creates a valid itinerary', () => {
    const itinerary = Itinerary.create(
      {
        originAirportId: 1,
        destinationAirportId: 2,
        departureDate: new Date('2027-02-01T00:00:00Z'),
        durationDays: 5,
      },
      fixedNow,
    );

    expect(itinerary.originAirportId).toBe(1);
    expect(itinerary.destinationAirportId).toBe(2);
    expect(itinerary.durationDays).toBe(5);
  });

  it('rejects when origin and destination are the same', () => {
    expect(() =>
      Itinerary.create(
        {
          originAirportId: 1,
          destinationAirportId: 1,
          departureDate: new Date('2027-02-01T00:00:00Z'),
          durationDays: 3,
        },
        fixedNow,
      ),
    ).toThrow(SameOriginAndDestinationError);
  });

  it('rejects a departure date in the past', () => {
    expect(() =>
      Itinerary.create(
        {
          originAirportId: 1,
          destinationAirportId: 2,
          departureDate: new Date('2020-01-01T00:00:00Z'),
          durationDays: 3,
        },
        fixedNow,
      ),
    ).toThrow(DepartureDateInPastError);
  });

  it('rejects a non-positive duration', () => {
    expect(() =>
      Itinerary.create(
        {
          originAirportId: 1,
          destinationAirportId: 2,
          departureDate: new Date('2027-02-01T00:00:00Z'),
          durationDays: 0,
        },
        fixedNow,
      ),
    ).toThrow(InvalidDurationError);
  });

  it('withUpdates re-validates invariants', () => {
    const itinerary = Itinerary.create(
      {
        originAirportId: 1,
        destinationAirportId: 2,
        departureDate: new Date('2027-02-01T00:00:00Z'),
        durationDays: 5,
      },
      fixedNow,
    );

    expect(() => itinerary.withUpdates({ destinationAirportId: 1 })).toThrow(
      SameOriginAndDestinationError,
    );
  });
});
