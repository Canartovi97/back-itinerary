import {
  DepartureDateInPastError,
  InvalidDurationError,
  InvalidItineraryNameError,
  SameOriginAndDestinationError,
} from './errors/itinerary-domain.errors';

export const MAX_ITINERARY_NAME_LENGTH = 100;

export interface ItineraryProps {
  id?: string;
  name: string;
  userId: string;
  originAirportId: number;
  destinationAirportId: number;
  departureDate: Date;
  durationDays: number;
  createdAt?: Date;
}

/**
 * Itinerary domain entity. Enforces business invariants at construction time:
 * - name must be non-blank and at most MAX_ITINERARY_NAME_LENGTH characters
 * - origin airport must differ from destination airport
 * - departure date must not be in the past
 * - duration in days must be strictly positive
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
  public readonly createdAt: Date;

  private constructor(props: ItineraryProps) {
    this.id = props.id;
    this.name = props.name.trim();
    this.userId = props.userId;
    this.originAirportId = props.originAirportId;
    this.destinationAirportId = props.destinationAirportId;
    this.departureDate = props.departureDate;
    this.durationDays = props.durationDays;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: ItineraryProps, now: Date = new Date()): Itinerary {
    Itinerary.validate(props, now);
    return new Itinerary(props);
  }

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
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
      createdAt: this.createdAt,
    });
  }
}
