import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { Airport } from '../../domain/airport.entity';
import { AirportProviderUnavailableError } from '../../domain/errors/airport-provider-unavailable.error';
import { AirportProvider } from '../../domain/ports/airport-provider.port';
import { CircuitBreaker, CircuitOpenError } from '../resilience/circuit-breaker';

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
const DEFAULT_FAILURE_THRESHOLD = 3;
const DEFAULT_RESET_TIMEOUT_MS = 30_000;

/**
 * Adapter implementing AirportProvider by calling the public api-colombia service.
 * Combines a request timeout, a manual retry loop, and a circuit breaker so a
 * degraded upstream fails fast instead of piling up slow/hanging requests.
 * Endpoints consumed: GET {baseUrl}/Airport and GET {baseUrl}/Airport/{id}.
 */
@Injectable()
export class ApiColombiaAirportAdapter implements AirportProvider {
  private readonly logger = new Logger(ApiColombiaAirportAdapter.name);
  private readonly baseUrl: string;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'API_COLOMBIA_BASE_URL',
      'https://api-colombia.com/api/v1',
    );
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: this.configService.get<number>(
        'CIRCUIT_BREAKER_FAILURE_THRESHOLD',
        DEFAULT_FAILURE_THRESHOLD,
      ),
      resetTimeoutMs: this.configService.get<number>(
        'CIRCUIT_BREAKER_RESET_TIMEOUT_MS',
        DEFAULT_RESET_TIMEOUT_MS,
      ),
    });
  }

  async findAll(): Promise<Airport[]> {
    const result = await this.guarded<ApiColombiaAirportDto[]>(`${this.baseUrl}/Airport`);
    return result.notFound ? [] : result.data.map((dto) => this.toDomain(dto));
  }

  async findById(id: number): Promise<Airport | null> {
    const result = await this.guarded<ApiColombiaAirportDto>(`${this.baseUrl}/Airport/${id}`);
    return result.notFound ? null : this.toDomain(result.data);
  }

  /**
   * Runs a request through the circuit breaker. A 404 resolves as a
   * `notFound` result rather than throwing, so it is never mistaken for an
   * upstream outage and never trips the breaker. When the breaker is open,
   * fails fast with a domain-level AirportProviderUnavailableError instead
   * of reaching the network — the fallback signal use cases react to.
   */
  private async guarded<T>(
    url: string,
  ): Promise<{ notFound: false; data: T } | { notFound: true }> {
    try {
      return await this.circuitBreaker.execute(() => this.requestWithRetry<T>(url));
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        this.logger.warn({
          event: 'api_colombia_circuit_open',
          url,
          message: 'Circuit breaker open, failing fast without calling api-colombia',
        });
        throw new AirportProviderUnavailableError();
      }
      this.logger.error({
        event: 'api_colombia_request_exhausted',
        url,
        message: 'All retry attempts failed',
        error: (error as Error).message,
      });
      throw new AirportProviderUnavailableError();
    }
  }

  private async requestWithRetry<T>(
    url: string,
  ): Promise<{ notFound: false; data: T } | { notFound: true }> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<T>(url, { timeout: DEFAULT_TIMEOUT_MS }),
        );
        return { notFound: false, data: response.data };
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return { notFound: true };
        }
        lastError = error;
        this.logger.warn({
          event: 'api_colombia_request_failed',
          url,
          attempt: attempt + 1,
          maxAttempts: MAX_RETRIES + 1,
          error: (error as Error).message,
        });
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
      // api-colombia serves these two fields swapped at the source (verified
      // against BOG: its "latitude" field holds -74.15, which is actually a
      // longitude). Swap them here so the rest of the system sees correct,
      // standard lat/lng — this is exactly what the Adapter pattern is for:
      // absorbing an external provider's quirks before they reach our domain.
      latitude: dto.longitude ?? 0,
      longitude: dto.latitude ?? 0,
    });
  }
}
