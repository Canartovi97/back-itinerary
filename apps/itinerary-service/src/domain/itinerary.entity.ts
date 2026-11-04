import {
  DepartureDateInPastError,
  InvalidDurationError,
  InvalidItineraryNameError,
  SameOriginAndDestinationError,
} from './errors/itinerary-domain.errors';
import {
  ItineraryDetails,
  TravelDocument,
  validateItineraryDetails,
  withDefaultDetails,
} from './itinerary-details';

export const MAX_ITINERARY_NAME_LENGTH = 100;

const DAY_MS = 86_400_000;

export interface ItineraryProps {
  id?: string;
  name: string;
  userId: string;
  originAirportId: number;
  destinationAirportId: number;
  departureDate: Date;
  durationDays: number;
  /** Sections left out take their defaults (see DEFAULT_ITINERARY_DETAILS). */
  details?: Partial<ItineraryDetails>;
  createdAt?: Date;
}

/**
 * Itinerary domain entity. Enforces business invariants at construction time:
 * - name must be non-blank and at most MAX_ITINERARY_NAME_LENGTH characters
 * - origin airport must differ from destination airport
 * - departure date must not be in the past
 * - duration in days must be strictly positive
 * - the trip details (passengers, lodging, budget, guides, safety info,
 *   attractions…) must satisfy validateItineraryDetails
 *
 * `userId` is the owner (the authenticated user that created it); it never
 * changes after creation.
 */
export class Itinerary {
  public readonly id?: string;
  public readonly name: string;
  public readonly userId: string;
  public readonly originAirportId: number;
  public readonly destinationAirportId: number;
  public readonly departureDate: Date;
  public readonly durationDays: number;
  public readonly details: ItineraryDetails;
  public readonly createdAt: Date;

  private constructor(props: ItineraryProps, details: ItineraryDetails) {
    this.id = props.id;
    this.name = props.name.trim();
    this.userId = props.userId;
    this.originAirportId = props.originAirportId;
    this.destinationAirportId = props.destinationAirportId;
    this.departureDate = props.departureDate;
    this.durationDays = props.durationDays;
    this.details = details;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: ItineraryProps, now: Date = new Date()): Itinerary {
    Itinerary.validate(props, now);
    const details = withDefaultDetails(props.details);
    validateItineraryDetails(details);
    return new Itinerary(props, details);
  }

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  /** Last day of the trip: departure + duration. */
  get endDate(): Date {
    return new Date(this.departureDate.getTime() + this.durationDays * DAY_MS);
  }

  /** The return flight's date, or null for a one-way trip. */
  get returnDate(): Date | null {
    return this.details.tripType === 'ROUND_TRIP' ? this.endDate : null;
  }

  /**
   * Documents that expire before the trip is over — a passport or insurance
   * expiring mid-trip is exactly what the traveler needs to be warned about.
   */
  documentsExpiringDuringTrip(): TravelDocument[] {
    const endDay = this.endDate.toISOString().slice(0, 10);
    return this.details.documents.filter((d) => d.expiresOn !== null && d.expiresOn < endDay);
  }

  private static validate(props: ItineraryProps, now: Date): void {
    const name = props.name?.trim() ?? '';
    if (name.length === 0 || name.length > MAX_ITINERARY_NAME_LENGTH) {
      throw new InvalidItineraryNameError();
    }

    if (props.originAirportId === props.destinationAirportId) {
      throw new SameOriginAndDestinationError();
    }

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (props.departureDate.getTime() < startOfToday.getTime()) {
      throw new DepartureDateInPastError();
    }

    if (!Number.isFinite(props.durationDays) || props.durationDays <= 0) {
      throw new InvalidDurationError();
    }
  }

  /**
   * Returns a new Itinerary with updated fields, re-validating all invariants.
   * Each details section given replaces the current one; the rest are kept.
   */
  withUpdates(updates: Partial<Omit<ItineraryProps, 'id' | 'userId' | 'createdAt'>>): Itinerary {
    return Itinerary.create({
      id: this.id,
      name: updates.name ?? this.name,
      userId: this.userId,
      originAirportId: updates.originAirportId ?? this.originAirportId,
      destinationAirportId: updates.destinationAirportId ?? this.destinationAirportId,
      departureDate: updates.departureDate ?? this.departureDate,
      durationDays: updates.durationDays ?? this.durationDays,
      details: { ...this.details, ...stripUndefined(updates.details ?? {}) },
      createdAt: this.createdAt,
    });
  }
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}
