import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import {
  AirportNotFoundError,
  ItineraryDomainError,
  ItineraryNotFoundError,
} from '../../domain/errors/itinerary-domain.errors';

/**
 * Translates domain-level errors into appropriate HTTP responses.
 */
@Catch(ItineraryDomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: ItineraryDomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number = HttpStatus.BAD_REQUEST;
    if (exception instanceof ItineraryNotFoundError || exception instanceof AirportNotFoundError) {
      status = HttpStatus.NOT_FOUND;
    }

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    });
  }
}
