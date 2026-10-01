import request from 'supertest';
import { Notification } from '../../domain/notification.entity';
import { NotificationRepositoryPort } from '../../domain/ports/notification-repository.port';
import { createHealthServer } from './health.controller';

describe('health.controller (notification historial, SCRUM)', () => {
  it('GET /health reports ok', async () => {
    const repo: NotificationRepositoryPort = {
      save: async (n) => n,
      findByItineraryId: async () => [],
    };

    const response = await request(createHealthServer(repo)).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: 'notification-function' });
  });

  it('GET /notifications/:itineraryId returns the historial for that itinerary', async () => {
    const notification = new Notification({
      id: 'notif-1',
      itineraryId: 'itin-1',
      message: 'Your itinerary itin-1 has been created.',
      status: 'SENT',
      createdAt: new Date('2030-01-01T00:00:00.000Z'),
    });
    const repo: NotificationRepositoryPort = {
      save: async (n) => n,
      findByItineraryId: async (id) => (id === 'itin-1' ? [notification] : []),
    };

    const response = await request(createHealthServer(repo)).get('/notifications/itin-1');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ id: 'notif-1', status: 'SENT' });
  });

  it('GET /notifications/:itineraryId returns an empty array for an itinerary with no notifications', async () => {
    const repo: NotificationRepositoryPort = {
      save: async (n) => n,
      findByItineraryId: async () => [],
    };

    const response = await request(createHealthServer(repo)).get('/notifications/unknown');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
