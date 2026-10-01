import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AirportValidationPort } from '../../domain/ports/airport-validation.port';
import { CORRELATION_ID_HEADER } from '../observability/correlation-id.middleware';
import { RequestContext } from '../observability/request-context';

/**
 * Calls the Airport Service over HTTP to confirm an airport id exists.
 */
@Injectable()
export class HttpAirportValidationAdapter implements AirportValidationPort {
  private readonly logger = new Logger(HttpAirportValidationAdapter.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('AIRPORT_SERVICE_URL', 'http://localhost:3001');
  }

  async exists(airportId: number): Promise<boolean> {
    try {
      const correlationId = RequestContext.getCorrelationId();
      const authToken = RequestContext.getAuthToken();
      const headers: Record<string, string> = {};
      if (correlationId) {
        headers[CORRELATION_ID_HEADER] = correlationId;
      }
      if (authToken) {
        // Propagates the caller's JWT to airport-service (SCRUM: JWT
        // propagation between services). airport-service doesn't currently
        // require it on its public read endpoints, but forwards it so it's
        // available if/when a protected endpoint needs it.
        headers['authorization'] = `Bearer ${authToken}`;
      }
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/airports/${airportId}`, {
          timeout: 5000,
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        }),
      );
      return true;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return false;
      }
      this.logger.error(
        `Failed to validate airport ${airportId} against airport-service: ${
          (error as Error).message
        }`,
      );
      throw error;
    }
  }
}
