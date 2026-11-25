import { InvalidItineraryDetailsError } from './errors/itinerary-domain.errors';
import { DEFAULT_ITINERARY_DETAILS, ItineraryDetails } from './itinerary-details';
import { Itinerary, ItineraryProps } from './itinerary.entity';

describe('Itinerary trip details', () => {
  const fixedNow = new Date('2027-01-10T00:00:00Z');
  const base: ItineraryProps = {
    name: 'Trip',
    userId: 'user-1',
    originAirportId: 1,
    destinationAirportId: 2,
    departureDate: new Date('2027-02-01T00:00:00Z'),
    durationDays: 5,
  };

  function create(details: Partial<ItineraryDetails>): Itinerary {
    return Itinerary.create({ ...base, details }, fixedNow);
  }

  it('defaults to a planned round trip for one adult in economy with empty lists', () => {
    expect(Itinerary.create(base, fixedNow).details).toEqual(DEFAULT_ITINERARY_DETAILS);
  });

  it('computes the return date for a round trip and none for one way', () => {
    expect(create({}).returnDate).toEqual(new Date('2027-02-06T00:00:00Z'));
    expect(create({ tripType: 'ONE_WAY' }).returnDate).toBeNull();
  });

  describe('rejects', () => {
    it.each<[string, Partial<ItineraryDetails>]>([
      ['no adults', { travelers: { adults: 0, children: 1, cabinClass: 'ECONOMY' } }],
      ['more than 9 travelers', { travelers: { adults: 5, children: 5, cabinClass: 'ECONOMY' } }],
      [
        'an unknown cabin class',
        { travelers: { adults: 1, children: 0, cabinClass: 'X' as never } },
      ],
      ['a negative budget', { budget: { amount: -1, currency: 'COP' } }],
      ['an unknown status', { status: 'LOST' as never }],
      [
        'a guide without phone or email',
        { guides: [{ name: 'Ana', phone: null, email: ' ', language: null, notes: null }] },
      ],
      [
        'an emergency contact without phone',
        { emergencyContacts: [{ name: 'María', relationship: null, phone: '' }] },
      ],
      [
        'a document with a malformed expiry',
        {
          documents: [{ type: 'PASSPORT', reference: null, expiresOn: '01/05/2031', notes: null }],
        },
      ],
      [
        'the same attraction twice',
        {
          attractions: [
            { attractionId: 13, name: 'Las Lajas', city: 'Ipiales' },
            { attractionId: 13, name: 'Las Lajas', city: 'Ipiales' },
          ],
        },
      ],
      ['notes over 2000 characters', { notes: 'x'.repeat(2001) }],
    ])('%s', (_case, details) => {
      expect(() => create(details)).toThrow(InvalidItineraryDetailsError);
    });
  });

  it('accepts a fully planned trip', () => {
    const itinerary = create({
      tripType: 'ROUND_TRIP',
      travelers: { adults: 2, children: 1, cabinClass: 'BUSINESS' },
      lodging: { type: 'HOTEL', name: 'Hotel Caribe', address: 'Bocagrande' },
      budget: { amount: 3_500_000, currency: 'COP' },
      status: 'CONFIRMED',
      notes: 'Bring sunscreen',
      guides: [
        { name: 'Ana', phone: null, email: 'ana@tours.example', language: 'ES', notes: null },
      ],
      emergencyContacts: [{ name: 'María', relationship: 'Madre', phone: '+57 310' }],
      documents: [{ type: 'PASSPORT', reference: 'AB1', expiresOn: '2031-05-01', notes: null }],
      attractions: [{ attractionId: 13, name: 'Las Lajas', city: 'Ipiales' }],
    });

    expect(itinerary.details.travelers.adults).toBe(2);
    expect(itinerary.details.guides).toHaveLength(1);
  });

  it('flags documents that expire before the trip ends', () => {
    const itinerary = create({
      documents: [
        { type: 'PASSPORT', reference: 'AB1', expiresOn: '2027-02-03', notes: null },
        { type: 'TRAVEL_INSURANCE', reference: 'P-9', expiresOn: '2027-03-01', notes: null },
        { type: 'TICKET', reference: 'XYZ', expiresOn: null, notes: null },
      ],
    });

    expect(itinerary.documentsExpiringDuringTrip().map((d) => d.type)).toEqual(['PASSPORT']);
  });

  it('withUpdates replaces only the sections that are given', () => {
    const itinerary = create({
      status: 'PLANNED',
      emergencyContacts: [{ name: 'María', relationship: null, phone: '+57 310' }],
    });

    const updated = itinerary.withUpdates({ details: { status: 'CONFIRMED' } });

    expect(updated.details.status).toBe('CONFIRMED');
    expect(updated.details.emergencyContacts).toEqual(itinerary.details.emergencyContacts);
  });
});
