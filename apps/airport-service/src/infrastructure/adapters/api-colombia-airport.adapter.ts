import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { Airport } from '../../domain/airport.entity';
import { AirportProvider } from '../../domain/ports/airport-provider.port';

interface ApiColombiaAirportDto {
  id: number;
  name: string;
  city?: { name?: string; country?: { name?: string } };
  iataCode?: string;
  latitude?: number;
  longitude?: number;
}

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 300;

/**
 * Adapter implementing AirportProvider by calling the public api-colombia service.
 * Adds a request timeout and a small manual retry loop for basic resilience.
 */
@Injectable()
export class ApiColombiaAirportAdapter implements AirportProvider {
  private readonly logger = new Logger(ApiColombiaAirportAdapter.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'API_COLOMBIA_BASE_URL',
      'https://api-colombia.com/api/v1',
    );
  }

  async findAll(): Promise<Airport[]> {
    const dtos = await this.requestWithRetry<ApiColombiaAirportDto[]>(`${this.baseUrl}/Airport`);
    return dtos.map((dto) => this.toDomain(dto));
  }

  async findById(id: number): Promise<Airport | null> {
    try {
      const dto = await this.requestWithRetry<ApiColombiaAirportDto>(
        `${this.baseUrl}/Airport/${id}`,
      );
      return dto ? this.toDomain(dto) : null;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  private async requestWithRetry<T>(url: string): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<T>(url, { timeout: DEFAULT_TIMEOUT_MS }),
        );
        return response.data;
      } catch (error) {
        lastError = error;
        if (error instanceof AxiosError && error.response?.status === 404) {
          throw error;
        }
        this.logger.warn(
          `Request to ${url} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${
            (error as Error).message
          }`,
        );
        if (attempt < MAX_RETRIES) {
          await this.delay(RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }
    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private toDomain(dto: ApiColombiaAirportDto): Airport {
    return Airport.create({
      id: dto.id,
      name: dto.name,
      city: dto.city?.name ?? '',
      country: dto.city?.country?.name ?? '',
      iataCode: dto.iataCode ?? '',
      latitude: dto.latitude ?? 0,
      longitude: dto.longitude ?? 0,
    });
  }
}
