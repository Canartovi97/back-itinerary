export class ItineraryDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
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

export class ItineraryNotFoundError extends ItineraryDomainError {
  constructor(id: string) {
    super(`Itinerary with id ${id} not found`);
  }
}
