/**
 * Outbound port used to confirm an airport id exists before persisting an itinerary.
 * Implemented by an HTTP adapter that calls the Airport Service.
 */
export interface AirportValidationPort {
  exists(airportId: number): Promise<boolean>;
}

export const AIRPORT_VALIDATION_PORT = Symbol('AIRPORT_VALIDATION_PORT');
