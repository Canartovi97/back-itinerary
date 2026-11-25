import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { TouristAttraction } from '../../domain/tourist-attraction.entity';
import { ApiColombiaAirportAdapter } from './api-colombia-airport.adapter';

/**
 * Attractions are listed per department in api-colombia, so the adapter
 * first resolves the airport's department ("deparmentId", sic) and then
 * maps that department's attractions onto the domain.
 */
describe('ApiColombiaAirportAdapter attractions', () => {
  function buildAdapter(responses: Record<string, unknown>) {
    const httpGet = jest.fn((url: string) => {
      const key = Object.keys(responses).find((k) => url.endsWith(k));
      const data = key ? responses[key] : undefined;
      if (data === undefined) {
        return throwError(
          () =>
            new AxiosError('not found', 'ERR_BAD_REQUEST', undefined, undefined, {
              status: 404,
            } as AxiosResponse),
        );
      }
      return of({ data });
    });
    const httpService = { get: httpGet } as unknown as HttpService;
    const configService = {
      get: (_key: string, fallback?: unknown) => fallback,
    } as unknown as ConfigService;
    return { adapter: new ApiColombiaAirportAdapter(httpService, configService), httpGet };
  }

  it("maps the department's attractions of the airport's destination", async () => {
    const { adapter, httpGet } = buildAdapter({
      '/Airport/28': { id: 28, name: 'Aeropuerto Antonio Nariño', deparmentId: 22 },
      '/Department/22/touristicattractions': [
        {
          id: 13,
          name: 'Santuario de las lajas ',
          description: 'Basílica',
          images: ['https://example.com/lajas.jpg'],
          latitude: '0.8055',
          longitude: '-77.586',
          city: { name: 'Ipiales' },
        },
      ],
    });

    const result = await adapter.findByAirport(28);

    expect(httpGet).toHaveBeenCalledWith(
      expect.stringContaining('/Department/22/touristicattractions'),
      expect.anything(),
    );
    expect(result).toEqual([
      new TouristAttraction(
        13,
        'Santuario de las lajas',
        'Basílica',
        'Ipiales',
        'https://example.com/lajas.jpg',
        0.8055,
        -77.586,
      ),
    ]);
  });

  it('returns null for an unknown airport', async () => {
    const { adapter } = buildAdapter({});

    await expect(adapter.findByAirport(999)).resolves.toBeNull();
  });

  it('returns an empty list when the department has no attractions (empty body)', async () => {
    const { adapter } = buildAdapter({
      '/Airport/5': { id: 5, name: 'Aeropuerto X', deparmentId: 14 },
      '/Department/14/touristicattractions': '',
    });

    await expect(adapter.findByAirport(5)).resolves.toEqual([]);
  });
});
