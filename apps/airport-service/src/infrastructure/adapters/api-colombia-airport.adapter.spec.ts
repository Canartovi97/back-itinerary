import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosHeaders } from 'axios';
import { of, throwError } from 'rxjs';
import { AirportProviderUnavailableError } from '../../domain/errors/airport-provider-unavailable.error';
import { ApiColombiaAirportAdapter } from './api-colombia-airport.adapter';

function axios404(): AxiosError {
  return new AxiosError('Not Found', '404', undefined, undefined, {
    status: 404,
    statusText: 'Not Found',
    data: undefined,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

describe('ApiColombiaAirportAdapter (integration with api-colombia, SCRUM-14)', () => {
  const baseUrl = 'https://api-colombia.com/api/v1';

  function buildAdapter(httpGet: jest.Mock) {
    const httpService = { get: httpGet } as unknown as HttpService;
    const configService = {
      get: (key: string, fallback?: unknown) =>
        key === 'API_COLOMBIA_BASE_URL' ? baseUrl : fallback,
    } as unknown as ConfigService;
    return new ApiColombiaAirportAdapter(httpService, configService);
  }

  it('consumes GET {baseUrl}/Airport for findAll, exactly once on success', async () => {
    const httpGet = jest.fn().mockReturnValue(of({ data: [] }));
    const adapter = buildAdapter(httpGet);

    await adapter.findAll();

    expect(httpGet).toHaveBeenCalledTimes(1);
    expect(httpGet).toHaveBeenCalledWith(
      `${baseUrl}/Airport`,
      expect.objectContaining({ timeout: expect.any(Number) }),
    );
  });

  it('consumes GET {baseUrl}/Airport/{id} for findById', async () => {
    const httpGet = jest.fn().mockReturnValue(
      of({
        data: {
          id: 44,
          name: 'Aeropuerto Militar CATAM',
          iataCode: 'BOG',
          latitude: 4.7,
          longitude: -74.1,
        },
      }),
    );
    const adapter = buildAdapter(httpGet);

    await adapter.findById(44);

    expect(httpGet).toHaveBeenCalledWith(`${baseUrl}/Airport/44`, expect.any(Object));
  });

  it('retries transient failures before giving up, without exceeding the retry budget', async () => {
    const httpGet = jest
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('ECONNRESET')))
      .mockReturnValueOnce(throwError(() => new Error('ECONNRESET')))
      .mockReturnValueOnce(of({ data: [] }));
    const adapter = buildAdapter(httpGet);

    const result = await adapter.findAll();

    expect(result).toEqual([]);
    expect(httpGet).toHaveBeenCalledTimes(3);
  });

  it('does not retry a 404 and resolves it as "not found" instead of an error', async () => {
    const httpGet = jest.fn().mockReturnValue(throwError(() => axios404()));
    const adapter = buildAdapter(httpGet);

    const result = await adapter.findById(999999);

    expect(result).toBeNull();
    expect(httpGet).toHaveBeenCalledTimes(1);
  });

  it('surfaces a domain-level AirportProviderUnavailableError once retries are exhausted', async () => {
    const httpGet = jest.fn().mockReturnValue(throwError(() => new Error('ETIMEDOUT')));
    const adapter = buildAdapter(httpGet);

    await expect(adapter.findAll()).rejects.toThrow(AirportProviderUnavailableError);
  });
});
