export class ItineraryDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidItineraryNameError extends ItineraryDomainError {
  constructor() {
    super('Itinerary name is required and must be at most 100 characters');
  }
}

export class SameOriginAndDestinationError extends ItineraryDomainError {
  constructor() {
    super('Origin airport and destination airport must be different');
  }
}

export class DepartureDateInPastError extends ItineraryDomainError {
  constructor() {
    super('Departure date must not be in the past');
  }
}

export class InvalidDurationError extends ItineraryDomainError {
  constructor() {
    super('Duration in days must be greater than zero');
  }
}

export class AirportNotFoundError extends ItineraryDomainError {
  constructor(airportId: number) {
    super(`Airport with id ${airportId} does not exist`);
  }
}

/**
 * Raised when Airport Service cannot be reached (network failure, timeout,
 * or an error response other than 404), so airport existence can't be
 * confirmed. The itinerary must not be saved in that case.
 */
export class AirportServiceUnavailableError extends ItineraryDomainError {
  constructor() {
    super('Airport Service is unavailable, airport existence could not be validated');
  }
}

export class ItineraryNotFoundError extends ItineraryDomainError {
  constructor(id: string) {
    super(`Itinerary with id ${id} not found`);
  }
}
