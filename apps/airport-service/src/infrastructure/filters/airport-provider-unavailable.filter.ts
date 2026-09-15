import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AirportProviderUnavailableError } from '../../domain/errors/airport-provider-unavailable.error';

/**
 * Maps the domain-level "external provider unavailable" error to HTTP 503,
 * so a degraded api-colombia integration surfaces as a clear, controlled
 * response instead of an unhandled 500.
 */
@Catch(AirportProviderUnavailableError)
export class AirportProviderUnavailableFilter implements ExceptionFilter {
  catch(exception: AirportProviderUnavailableError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: exception.message,
      error: 'Service Unavailable',
    });
  }
}
