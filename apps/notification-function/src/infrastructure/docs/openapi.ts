import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

/**
 * OpenAPI document for the notification function. Unlike the two NestJS
 * services, this is a plain Express app, so there are no decorators to
 * generate the spec from — it is written by hand and must be kept in sync
 * with the HTTP routes. The function's real workload (consuming
 * ItineraryCreated events from RabbitMQ) is not HTTP, so it is described
 * in the info block rather than as a path.
 */
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Notification Function',
    version: '1.0',
    description:
      'Consumes `ItineraryCreated` events from RabbitMQ (queue `itinerary-created-queue`) and stores a ' +
      'notification for each one. The HTTP endpoints below only exist for local visibility; ' +
      'nothing calls this function directly, so a failure here never affects the Itinerary Service.',
  },
  tags: [{ name: 'health' }],
  paths: {
    '/health': {
      get: {
        tags: ['health'],
        summary: 'Liveness check',
        responses: {
          '200': {
            description: 'The function is up.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Health' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Health: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          service: { type: 'string', example: 'notification-function' },
        },
        required: ['status', 'service'],
      },
    },
  },
};

/** Serves the Swagger UI at /api/docs, same path as the NestJS services. */
export function mountApiDocs(app: Express): void {
  app.get('/api/docs-json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
}
