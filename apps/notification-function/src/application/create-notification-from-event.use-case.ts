import { randomUUID } from 'crypto';
import { ItineraryCreatedEvent } from '../domain/itinerary-created.event';
import { Notification } from '../domain/notification.entity';
import { NotificationRepositoryPort } from '../domain/ports/notification-repository.port';

/**
 * Builds a Notification from an incoming ItineraryCreated event and
 * persists it via the abstracted repository port.
 */
export class CreateNotificationFromEventUseCase {
  constructor(private readonly repository: NotificationRepositoryPort) {}

  async execute(event: ItineraryCreatedEvent): Promise<Notification> {
    const message = this.buildMessage(event);

    const notification = new Notification({
      id: randomUUID(),
      itineraryId: event.itineraryId,
      message,
      status: 'PENDING',
      createdAt: new Date(),
    });

    return this.repository.save(notification);
  }

  private buildMessage(event: ItineraryCreatedEvent): string {
    return `Your itinerary ${event.itineraryId} from airport ${event.originAirportId} to airport ${event.destinationAirportId} departing on ${event.departureDate} has been created.`;
  }
}
