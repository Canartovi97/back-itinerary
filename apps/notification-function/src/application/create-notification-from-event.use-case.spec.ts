import { ItineraryCreatedEvent } from '../domain/itinerary-created.event';
import { Notification } from '../domain/notification.entity';
import { NotificationRepositoryPort } from '../domain/ports/notification-repository.port';
import { CreateNotificationFromEventUseCase } from './create-notification-from-event.use-case';

class FakeNotificationRepository implements NotificationRepositoryPort {
  public readonly saved: Notification[] = [];

  async save(notification: Notification): Promise<Notification> {
    this.saved.push(notification);
    return notification;
  }

  async findByItineraryId(itineraryId: string): Promise<Notification[]> {
    return this.saved.filter((n) => n.itineraryId === itineraryId);
  }
}

describe('CreateNotificationFromEventUseCase', () => {
  const event: ItineraryCreatedEvent = {
    type: 'ItineraryCreated',
    itineraryId: 'itin-123',
    originAirportId: 1,
    destinationAirportId: 2,
    departureDate: '2027-02-01T00:00:00.000Z',
  };

  it('builds and persists a notification from the event', async () => {
    const repository = new FakeNotificationRepository();
    const useCase = new CreateNotificationFromEventUseCase(repository);

    const notification = await useCase.execute(event);

    expect(notification.itineraryId).toBe('itin-123');
    expect(notification.status).toBe('PENDING');
    expect(notification.message).toContain('itin-123');
    expect(notification.message).toContain('1');
    expect(notification.message).toContain('2');
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toBe(notification);
  });
});
