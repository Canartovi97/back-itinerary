import 'dotenv/config';
import { CreateNotificationFromEventUseCase } from './application/create-notification-from-event.use-case';
import { RabbitMqItineraryCreatedConsumer } from './infrastructure/adapters/rabbitmq-itinerary-created.consumer';
import { SqliteNotificationRepository } from './infrastructure/adapters/sqlite-notification.repository';
import { createHealthServer } from './infrastructure/controllers/health.controller';
import { StructuredLogger } from './infrastructure/logging/structured-logger';

/**
 * SCRUM-35: "se manejan errores de ejecución sin afectar al Itinerary
 * Service". itinerary-service never calls this function directly — it
 * only publishes to RabbitMQ and moves on — so a crash here can't block
 * or fail an itinerary creation regardless. The one risk this skeleton
 * previously left open was this function crashing itself on an error
 * nothing else caught (a bug in a future handler, a rejected promise
 * nobody awaited), silently killing the whole consumer with no record of
 * why. Logging and staying up is strictly better than disappearing.
 */
function installProcessErrorHandlers(): void {
  process.on('uncaughtException', (error) => {
    StructuredLogger.error('Uncaught exception in notification-function', {
      error: error.message,
    });
  });

  process.on('unhandledRejection', (reason) => {
    StructuredLogger.error('Unhandled promise rejection in notification-function', {
      error: reason instanceof Error ? reason.message : String(reason),
    });
  });
}

async function bootstrap() {
  installProcessErrorHandlers();

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
