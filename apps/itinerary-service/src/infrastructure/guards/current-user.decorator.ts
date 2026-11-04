import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthTokenPayload } from '../../domain/ports/token-issuer.port';

/**
 * Injects the authenticated user's JWT payload, which JwtAuthGuard attaches
 * to the request. Only usable on routes protected by JwtAuthGuard.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthTokenPayload =>
    (context.switchToHttp().getRequest<Request>() as Request & { user: AuthTokenPayload }).user,
);
