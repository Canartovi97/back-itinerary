import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { Airport } from '../../domain/airport.entity';
import { ApiColombiaAirportAdapter } from './api-colombia-airport.adapter';

/**
 * Verifies the Adapter pattern's core promise for SCRUM-15: the domain
 * receives a clean Airport, fully decoupled from api-colombia's own DTO
 * shape (nested city/department objects, its own field names/quirks).
 */
describe('ApiColombiaAirportAdapter mapping (Adapter pattern, SCRUM-15)', () => {
  function buildAdapter(httpGet: jest.Mock) {
    const httpService = { get: httpGet } as unknown as HttpService;
    const configService = {
      get: (_key: string, fallback?: unknown) => fallback,
    } as unknown as ConfigService;
    return new ApiColombiaAirportAdapter(httpService, configService);
  }

  it('maps the external DTO shape onto a plain domain Airport', async () => {
    const httpGet = jest.fn().mockReturnValue(
      of({
        data: {
          id: 44,
          name: 'Aeropuerto Militar CATAM',
          iataCode: 'BOG',
          city: { name: 'Bogotá D.C.', country: { name: 'Colombia' } },
          // Field names as returned by api-colombia — values are swapped at
          // the source (this is BOG's real payload, latitude holds a
          // longitude and vice versa).
          latitude: -74.15303487,
          longitude: 4.704754079,
        },
      }),
    );
    const adapter = buildAdapter(httpGet);

    const airport = await adapter.findById(44);

    expect(airport).toBeInstanceOf(Airport);
    expect(airport).toEqual(
      Airport.create({
        id: 44,
        name: 'Aeropuerto Militar CATAM',
        city: 'Bogotá D.C.',
        country: 'Colombia',
        iataCode: 'BOG',
        latitude: 4.704754079,
        longitude: -74.15303487,
      }),
    );
    // The mapped Airport exposes none of api-colombia's own shape.
    expect(airport).not.toHaveProperty('city.name');
    expect(airport).not.toHaveProperty('oaciCode');
  });

  it('defaults missing optional fields instead of leaking undefined into the domain', async () => {
    const httpGet = jest.fn().mockReturnValue(
      of({
        data: { id: 1, name: 'Unnamed strip' },
      }),
    );
    const adapter = buildAdapter(httpGet);

    const airport = await adapter.findById(1);

    expect(airport).toEqual(
      Airport.create({
        id: 1,
        name: 'Unnamed strip',
        city: '',
        country: '',
        iataCode: '',
        latitude: 0,
        longitude: 0,
      }),
    );
  });
});
