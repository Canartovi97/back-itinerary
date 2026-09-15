import Database, { Database as DatabaseType } from 'better-sqlite3';
import { Notification, NotificationStatus } from '../../domain/notification.entity';
import { NotificationRepositoryPort } from '../../domain/ports/notification-repository.port';

interface NotificationRow {
  id: string;
  itinerary_id: string;
  message: string;
  status: NotificationStatus;
  created_at: string;
}

/**
 * SQLite-backed implementation of NotificationRepositoryPort, used for local
 * development. Swappable for a DynamoDB (or other) adapter when this
 * function is deployed as an AWS Lambda.
 */
export class SqliteNotificationRepository implements NotificationRepositoryPort {
  private readonly db: DatabaseType;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          itinerary_id TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`,
      )
      .run();
  }

  async save(notification: Notification): Promise<Notification> {
    this.db
      .prepare(
        `INSERT INTO notifications (id, itinerary_id, message, status, created_at)
         VALUES (@id, @itineraryId, @message, @status, @createdAt)`,
      )
      .run({
        id: notification.id,
        itineraryId: notification.itineraryId,
        message: notification.message,
        status: notification.status,
        createdAt: notification.createdAt.toISOString(),
      });
    return notification;
  }

  async findByItineraryId(itineraryId: string): Promise<Notification[]> {
    const rows = this.db
      .prepare(`SELECT * FROM notifications WHERE itinerary_id = ?`)
      .all(itineraryId) as NotificationRow[];

    return rows.map(
      (row) =>
        new Notification({
          id: row.id,
          itineraryId: row.itinerary_id,
          message: row.message,
          status: row.status,
          createdAt: new Date(row.created_at),
        }),
    );
  }

  close(): void {
    this.db.close();
  }
}
