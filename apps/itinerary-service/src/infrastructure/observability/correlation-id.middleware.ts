import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { RequestContext } from './request-context';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
const BEARER_PREFIX = 'Bearer ';

/**
 * The system-wide entry point for correlation IDs on this service: reuses
 * one supplied by an upstream caller (frontend or another service), or
 * mints a new one when this is the first hop. Echoes it back on the
 * response so callers can correlate their own logs too. Also captures the
 * caller's bearer token (if any) into the same request context so outbound
 * adapters can forward it — see HttpAirportValidationAdapter.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId = (req.header(CORRELATION_ID_HEADER) || randomUUID()).toString();
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    const authHeader = req.header('authorization');
    const authToken = authHeader?.startsWith(BEARER_PREFIX)
      ? authHeader.slice(BEARER_PREFIX.length)
      : undefined;

    RequestContext.run({ correlationId, authToken }, () => next());
  }
}
