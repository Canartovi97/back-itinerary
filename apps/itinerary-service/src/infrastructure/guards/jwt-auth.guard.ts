import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TOKEN_ISSUER, TokenIssuer } from '../../domain/ports/token-issuer.port';

/**
 * Protects the itinerary endpoints — itineraries are personal data, not
 * public browsing like the Airport Service's read endpoints.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_ISSUER) private readonly tokens: TokenIssuer) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.header('authorization');

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = this.tokens.verify(header.slice('Bearer '.length));
      (req as Request & { user?: unknown }).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
