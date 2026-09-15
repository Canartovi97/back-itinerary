export interface ItineraryCreatedEvent {
  itineraryId: string;
  originAirportId: number;
  destinationAirportId: number;
  departureDate: string;
}

/**
 * Outbound port for publishing integration events to a message broker.
 */
export interface EventPublisherPort {
  publishItineraryCreated(event: ItineraryCreatedEvent): Promise<void>;
}

export const EVENT_PUBLISHER_PORT = Symbol('EVENT_PUBLISHER_PORT');
