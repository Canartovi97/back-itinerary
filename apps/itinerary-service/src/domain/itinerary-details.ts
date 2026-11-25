import { InvalidItineraryDetailsError } from './errors/itinerary-domain.errors';

/**
 * Everything beyond "from where, to where, when, for how long" that a
 * traveler plans for a trip: passengers, lodging, budget, status, notes,
 * guides, safety information and the attractions they want to visit.
 * Plain data (a value object) validated by `validateItineraryDetails`.
 */

export const TRIP_TYPES = ['ROUND_TRIP', 'ONE_WAY'] as const;
export const CABIN_CLASSES = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'] as const;
export const LODGING_TYPES = [
  'NONE',
  'HOTEL',
  'HOSTEL',
  'APARTMENT',
  'FAMILY_FRIENDS',
  'OTHER',
] as const;
export const CURRENCIES = ['COP', 'USD', 'EUR'] as const;
export const ITINERARY_STATUSES = ['PLANNED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
export const DOCUMENT_TYPES = [
  'PASSPORT',
  'NATIONAL_ID',
  'VISA',
  'TRAVEL_INSURANCE',
  'VACCINATION',
  'TICKET',
  'OTHER',
] as const;

export type TripType = (typeof TRIP_TYPES)[number];
export type CabinClass = (typeof CABIN_CLASSES)[number];
export type LodgingType = (typeof LODGING_TYPES)[number];
export type Currency = (typeof CURRENCIES)[number];
export type ItineraryStatus = (typeof ITINERARY_STATUSES)[number];
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface Travelers {
  adults: number;
  children: number;
  cabinClass: CabinClass;
}

export interface Lodging {
  type: LodgingType;
  name: string | null;
  address: string | null;
}

export interface Budget {
  amount: number | null;
  currency: Currency;
}

/** A guide or tour operator the traveler hired or wants to contact. */
export interface TourGuide {
  name: string;
  phone: string | null;
  email: string | null;
  language: string | null;
  notes: string | null;
}

export interface EmergencyContact {
  name: string;
  relationship: string | null;
  phone: string;
}

/** A reference to an important document — never the document itself. */
export interface TravelDocument {
  type: DocumentType;
  reference: string | null;
  /** ISO date (YYYY-MM-DD). */
  expiresOn: string | null;
  notes: string | null;
}

/** An attraction picked from Airport Service's suggestions for the destination. */
export interface PlannedAttraction {
  attractionId: number;
  name: string;
  city: string;
}

export interface ItineraryDetails {
  tripType: TripType;
  travelers: Travelers;
  lodging: Lodging;
  budget: Budget;
  status: ItineraryStatus;
  notes: string | null;
  guides: TourGuide[];
  emergencyContacts: EmergencyContact[];
  documents: TravelDocument[];
  attractions: PlannedAttraction[];
}

export const DEFAULT_ITINERARY_DETAILS: ItineraryDetails = {
  tripType: 'ROUND_TRIP',
  travelers: { adults: 1, children: 0, cabinClass: 'ECONOMY' },
  lodging: { type: 'NONE', name: null, address: null },
  budget: { amount: null, currency: 'COP' },
  status: 'PLANNED',
  notes: null,
  guides: [],
  emergencyContacts: [],
  documents: [],
  attractions: [],
};

export const LIMITS = {
  maxTravelers: 9,
  maxNotes: 2000,
  maxText: 100,
  maxGuides: 10,
  maxEmergencyContacts: 5,
  maxDocuments: 10,
  maxAttractions: 20,
  maxBudget: 1_000_000_000_000,
} as const;

/** Fills every section the caller left out with its default. */
export function withDefaultDetails(details?: Partial<ItineraryDetails>): ItineraryDetails {
  return { ...DEFAULT_ITINERARY_DETAILS, ...stripUndefined(details ?? {}) };
}

export function validateItineraryDetails(d: ItineraryDetails): void {
  oneOf(d.tripType, TRIP_TYPES, 'Trip type');
  oneOf(d.status, ITINERARY_STATUSES, 'Status');

  const { adults, children, cabinClass } = d.travelers;
  check(Number.isInteger(adults) && adults >= 1, 'At least one adult must travel');
  check(Number.isInteger(children) && children >= 0, 'Children must be zero or more');
  check(
    adults + children <= LIMITS.maxTravelers,
    `At most ${LIMITS.maxTravelers} travelers per itinerary`,
  );
  oneOf(cabinClass, CABIN_CLASSES, 'Cabin class');

  oneOf(d.lodging.type, LODGING_TYPES, 'Lodging type');
  maxLength(d.lodging.name, LIMITS.maxText, 'Lodging name');
  maxLength(d.lodging.address, LIMITS.maxText * 2, 'Lodging address');

  oneOf(d.budget.currency, CURRENCIES, 'Currency');
  if (d.budget.amount !== null) {
    check(
      Number.isFinite(d.budget.amount) &&
        d.budget.amount >= 0 &&
        d.budget.amount <= LIMITS.maxBudget,
      'Budget must be a positive amount',
    );
  }

  maxLength(d.notes, LIMITS.maxNotes, 'Notes');

  check(d.guides.length <= LIMITS.maxGuides, `At most ${LIMITS.maxGuides} guides`);
  for (const guide of d.guides) {
    required(guide.name, 'Guide name');
    check(!!(guide.phone?.trim() || guide.email?.trim()), 'Each guide needs a phone or an email');
    maxLength(guide.notes, LIMITS.maxText * 2, 'Guide notes');
  }

  check(
    d.emergencyContacts.length <= LIMITS.maxEmergencyContacts,
    `At most ${LIMITS.maxEmergencyContacts} emergency contacts`,
  );
  for (const contact of d.emergencyContacts) {
    required(contact.name, 'Emergency contact name');
    required(contact.phone, 'Emergency contact phone');
  }

  check(d.documents.length <= LIMITS.maxDocuments, `At most ${LIMITS.maxDocuments} documents`);
  for (const document of d.documents) {
    oneOf(document.type, DOCUMENT_TYPES, 'Document type');
    if (document.expiresOn !== null) {
      check(isIsoDate(document.expiresOn), 'Document expiry must be a YYYY-MM-DD date');
    }
  }

  check(
    d.attractions.length <= LIMITS.maxAttractions,
    `At most ${LIMITS.maxAttractions} attractions`,
  );
  const ids = d.attractions.map((a) => a.attractionId);
  check(new Set(ids).size === ids.length, 'An attraction can only be added once');
  for (const attraction of d.attractions) {
    required(attraction.name, 'Attraction name');
  }
}

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new InvalidItineraryDetailsError(message);
  }
}

function oneOf<T extends string>(value: T, allowed: readonly T[], field: string): void {
  check(allowed.includes(value), `${field} must be one of: ${allowed.join(', ')}`);
}

function required(value: string | null | undefined, field: string): void {
  check(!!value?.trim(), `${field} is required`);
  maxLength(value ?? null, LIMITS.maxText, field);
}

function maxLength(value: string | null, max: number, field: string): void {
  check(value === null || value.length <= max, `${field} must be at most ${max} characters`);
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}
