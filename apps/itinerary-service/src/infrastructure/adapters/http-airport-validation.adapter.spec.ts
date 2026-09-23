import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { RequestContext } from '../observability/request-context';
import { HttpAirportValidationAdapter } from './http-airport-validation.adapter';

describe('HttpAirportValidationAdapter correlation ID propagation (SCRUM-41)', () => {
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

    await RequestContext.run('trace-42', () => adapter.exists(7));

    expect(httpGet).toHaveBeenCalledWith(
      expect.stringContaining('/airports/7'),
      expect.objectContaining({ headers: { 'x-correlation-id': 'trace-42' } }),
    );
  });

  it('omits the header entirely when there is no active correlation id', async () => {
    const httpGet = jest.fn().mockReturnValue(of({ data: {} }));
    const adapter = buildAdapter(httpGet);

    await adapter.exists(7);

    expect(httpGet).toHaveBeenCalledWith(
      expect.stringContaining('/airports/7'),
      expect.objectContaining({ headers: undefined }),
    );
  });
});
