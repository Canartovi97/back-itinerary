import 'dotenv/config';
import { CreateNotificationFromEventUseCase } from './application/create-notification-from-event.use-case';
import { RabbitMqItineraryCreatedConsumer } from './infrastructure/adapters/rabbitmq-itinerary-created.consumer';
import { SqliteNotificationRepository } from './infrastructure/adapters/sqlite-notification.repository';
import { createHealthServer } from './infrastructure/controllers/health.controller';

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
      // eslint-disable-next-line no-console
      console.log(`Notification created for itinerary ${event.itineraryId}`);
    });
    // eslint-disable-next-line no-console
    console.log(`Connected to RabbitMQ at ${rabbitMqUrl}, waiting for ItineraryCreated events`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to start RabbitMQ consumer: ${(error as Error).message}`);
  }

  const app = createHealthServer();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Notification Function health endpoint listening on port ${port}`);
  });
}

bootstrap();
