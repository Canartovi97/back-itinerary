import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

/**
 * Validates a JWT issued by itinerary-service (same shared JWT_SECRET).
 * Not currently applied to any route — the /airports endpoints are meant
 * to stay publicly browsable (RF-01/RF-02) — but kept ready, tested, and
 * documented for whenever a genuinely sensitive endpoint is added here.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.header('authorization');

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const secret = this.configService.get<string>('JWT_SECRET', 'dev-secret-change-me');

    try {
      const payload = jwt.verify(header.slice('Bearer '.length), secret);
      (req as Request & { user?: unknown }).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
