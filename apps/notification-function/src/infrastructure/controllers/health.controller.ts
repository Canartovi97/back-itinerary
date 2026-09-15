import { Express, Request, Response } from 'express';
import express from 'express';

/**
 * Minimal HTTP server exposing GET /health for local dev visibility.
 * The real workload of this function is the RabbitMQ consumer; this HTTP
 * server exists only so operators/tests can check liveness locally.
 */
export function createHealthServer(): Express {
  const app = express();
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'notification-function' });
  });
  return app;
}
