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

    // Reaching this point means the message was built successfully; the
    // only remaining step is persisting it. There's no further processing
    // (no real email/SMS dispatch) in this skeleton, so "SENT" reflects
    // that this notification was successfully generated and recorded —
    // not left dangling at "PENDING" forever, which it previously was for
    // every notification regardless of outcome. A failed save never
    // produces a row at all (see the consumer's catch block for how that
    // failure case is still recorded, via a structured log).
    const notification = new Notification({
      id: randomUUID(),
      itineraryId: event.itineraryId,
      message,
      status: 'SENT',
      createdAt: new Date(),
    });

    return this.repository.save(notification);
  }

  private buildMessage(event: ItineraryCreatedEvent): string {
    return `Your itinerary ${event.itineraryId} from airport ${event.originAirportId} to airport ${event.destinationAirportId} departing on ${event.departureDate} has been created.`;
  }
}
