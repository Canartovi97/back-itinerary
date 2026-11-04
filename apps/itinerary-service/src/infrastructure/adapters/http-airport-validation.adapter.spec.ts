import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { AirportServiceUnavailableError } from '../../domain/errors/itinerary-domain.errors';
import { RequestContext } from '../observability/request-context';
import { HttpAirportValidationAdapter } from './http-airport-validation.adapter';

describe('HttpAirportValidationAdapter correlation ID / JWT propagation (SCRUM-41 / auth)', () => {
  function buildAdapter(httpGet: jest.Mock) {
    const httpService = { get: httpGet } as unknown as HttpService;
    const configService = {
      get: (_key: string, fallback?: unknown) => fallback,
    } as unknown as ConfigService;
    return new HttpAirportValidationAdapter(httpService, configService);
  }

  it('forwards the current correlation id as a header to airport-service', async () => {
    const httpGet = jest.fn().mockReturnValue(of({ data: {} }));
    const adapter = buildAdapter(httpGet);

    await RequestContext.run({ correlationId: 'trace-42' }, () => adapter.exists(7));

    expect(httpGet).toHaveBeenCalledWith(
      expect.stringContaining('/airports/7'),
      expect.objectContaining({ headers: { 'x-correlation-id': 'trace-42' } }),
    );
  });

  it('omits the header entirely when there is no active request context', async () => {
    const httpGet = jest.fn().mockReturnValue(of({ data: {} }));
    const adapter = buildAdapter(httpGet);

    await adapter.exists(7);

    expect(httpGet).toHaveBeenCalledWith(
      expect.stringContaining('/airports/7'),
      expect.objectContaining({ headers: undefined }),
    );
  });

  it('forwards the caller bearer token alongside the correlation id', async () => {
    const httpGet = jest.fn().mockReturnValue(of({ data: {} }));
    const adapter = buildAdapter(httpGet);

    await RequestContext.run({ correlationId: 'trace-42', authToken: 'jwt-abc' }, () =>
      adapter.exists(7),
    );

    expect(httpGet).toHaveBeenCalledWith(
      expect.stringContaining('/airports/7'),
      expect.objectContaining({
        headers: { 'x-correlation-id': 'trace-42', authorization: 'Bearer jwt-abc' },
      }),
    );
  });
});

describe('HttpAirportValidationAdapter failure handling (PROYEC-14)', () => {
  function buildAdapter(httpGet: jest.Mock) {
    const httpService = { get: httpGet } as unknown as HttpService;
    const configService = {
      get: (_key: string, fallback?: unknown) => fallback,
    } as unknown as ConfigService;
    return new HttpAirportValidationAdapter(httpService, configService);
  }

  function axiosError(status?: number): AxiosError {
    return new AxiosError(
      'request failed',
      status ? 'ERR_BAD_RESPONSE' : 'ECONNREFUSED',
      undefined,
      undefined,
      status ? ({ status } as AxiosResponse) : undefined,
    );
  }

  it('reports a missing airport (404) as non-existent, not as an outage', async () => {
    const adapter = buildAdapter(jest.fn().mockReturnValue(throwError(() => axiosError(404))));

    await expect(adapter.exists(7)).resolves.toBe(false);
  });

  it('throws AirportServiceUnavailableError when airport-service cannot be reached', async () => {
    const adapter = buildAdapter(jest.fn().mockReturnValue(throwError(() => axiosError())));

    await expect(adapter.exists(7)).rejects.toThrow(AirportServiceUnavailableError);
  });

  it('throws AirportServiceUnavailableError when airport-service answers with a 5xx', async () => {
    const adapter = buildAdapter(jest.fn().mockReturnValue(throwError(() => axiosError(503))));

    await expect(adapter.exists(7)).rejects.toThrow(AirportServiceUnavailableError);
  });
});
