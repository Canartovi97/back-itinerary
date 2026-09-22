import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosHeaders } from 'axios';
import { throwError } from 'rxjs';
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

/**
 * SCRUM-17 closure: `CircuitBreaker` and `requestWithRetry` are each
 * unit-tested in isolation elsewhere; this proves they are actually wired
 * together correctly inside the adapter — the breaker opens after the
 * configured number of exhausted-retry failures and then fails fast
 * without hitting the network again.
 */
describe('ApiColombiaAirportAdapter circuit breaker wiring (SCRUM-17)', () => {
  const baseUrl = 'https://api-colombia.com/api/v1';

  function buildAdapter(httpGet: jest.Mock, failureThreshold: number) {
    const httpService = { get: httpGet } as unknown as HttpService;
    const configService = {
      get: (key: string, fallback?: unknown) => {
        if (key === 'API_COLOMBIA_BASE_URL') return baseUrl;
        if (key === 'CIRCUIT_BREAKER_FAILURE_THRESHOLD') return failureThreshold;
        if (key === 'CIRCUIT_BREAKER_RESET_TIMEOUT_MS') return 30_000;
        return fallback;
      },
    } as unknown as ConfigService;
    return new ApiColombiaAirportAdapter(httpService, configService);
  }

  it('opens after the configured number of exhausted-retry failures, then fails fast without calling the network', async () => {
    const httpGet = jest.fn().mockReturnValue(throwError(() => new Error('ECONNRESET')));
    const adapter = buildAdapter(httpGet, 2);

    await expect(adapter.findAll()).rejects.toThrow(AirportProviderUnavailableError);
    await expect(adapter.findAll()).rejects.toThrow(AirportProviderUnavailableError);
    const callsAfterOpening = httpGet.mock.calls.length;

    await expect(adapter.findAll()).rejects.toThrow(AirportProviderUnavailableError);

    // A third findAll() while the breaker is open must not reach the network
    // (each prior call already burned 3 attempts each via retries).
    expect(httpGet.mock.calls.length).toBe(callsAfterOpening);
  });

  it('does not open the circuit on 404s, since they are a valid response, not an outage', async () => {
    const httpGet = jest.fn().mockReturnValue(throwError(() => axios404()));
    const adapter = buildAdapter(httpGet, 1);

    // Many consecutive 404s in a row would trip a threshold-of-1 breaker if
    // they were counted as failures — they must not be.
    await adapter.findById(1);
    await adapter.findById(2);
    const result = await adapter.findById(3);

    expect(result).toBeNull();
    expect(httpGet).toHaveBeenCalledTimes(3);
  });
});
