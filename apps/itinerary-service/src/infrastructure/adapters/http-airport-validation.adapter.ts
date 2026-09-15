import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AirportValidationPort } from '../../domain/ports/airport-validation.port';

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
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/airports/${airportId}`, { timeout: 5000 }),
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
