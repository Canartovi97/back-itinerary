import 'dotenv/config';
import { CreateNotificationFromEventUseCase } from './application/create-notification-from-event.use-case';
import { RabbitMqItineraryCreatedConsumer } from './infrastructure/adapters/rabbitmq-itinerary-created.consumer';
import { SqliteNotificationRepository } from './infrastructure/adapters/sqlite-notification.repository';
import { createHealthServer } from './infrastructure/controllers/health.controller';
import { StructuredLogger } from './infrastructure/logging/structured-logger';

async function bootstrap() {
  const port = Number(process.env.PORT ?? 3002);
  const rabbitMqUrl = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
  const sqlitePath = process.env.SQLITE_PATH ?? './notifications.db';

  const repository = new SqliteNotificationRepository(sqlitePath);
  const useCase = new CreateNotificationFromEventUseCase(repository);
  const consumer = new RabbitMqItineraryCreatedConsumer(rabbitMqUrl);

  try {
    await consumer.start(async (event) => {
      await useCase.execute(event);
      StructuredLogger.log('Notification created', { itineraryId: event.itineraryId });
    });
    StructuredLogger.log('Connected to RabbitMQ, waiting for ItineraryCreated events', {
      rabbitMqUrl,
    });
  } catch (error) {
    StructuredLogger.error('Failed to start RabbitMQ consumer', {
      error: (error as Error).message,
    });
  }

  const app = createHealthServer();
  app.listen(port, () => {
    StructuredLogger.log(`Notification Function health endpoint listening on port ${port}`);
  });
}

bootstrap();
