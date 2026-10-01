import { Express, Request, Response } from 'express';
import express from 'express';
import { NotificationRepositoryPort } from '../../domain/ports/notification-repository.port';

/**
 * Minimal HTTP server for local dev visibility: GET /health for liveness,
 * and GET /notifications/:itineraryId so the notification historial
 * (SCRUM: "registrar historial de notificaciones" — "el historial es
 * consultable") is queryable over HTTP, not just by opening the SQLite
 * file directly. The real workload of this function is still the
 * RabbitMQ consumer.
 */
export function createHealthServer(repository: NotificationRepositoryPort): Express {
  const app = express();

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'notification-function' });
  });

  app.get('/notifications/:itineraryId', async (req: Request, res: Response) => {
    const notifications = await repository.findByItineraryId(req.params.itineraryId);
    res.json(notifications);
  });

  return app;
}
