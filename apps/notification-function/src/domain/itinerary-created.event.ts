/**
 * Shape of the integration event published by itinerary-service when an
 * itinerary is successfully created.
 */
export interface ItineraryCreatedEvent {
  type?: string;
  itineraryId: string;
  originAirportId: number;
  destinationAirportId: number;
  departureDate: string;
}
