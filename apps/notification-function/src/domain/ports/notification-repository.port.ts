import { Notification } from '../notification.entity';

/**
 * Outbound port for persisting notifications. Swappable so the concrete
 * storage technology (SQLite here, DynamoDB later in a real Lambda) can
 * change without touching application logic.
 */
export interface NotificationRepositoryPort {
  save(notification: Notification): Promise<Notification>;
  findByItineraryId(itineraryId: string): Promise<Notification[]>;
}
