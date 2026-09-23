import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { AuthTokenPayload, TokenIssuer } from '../../domain/ports/token-issuer.port';

/**
 * Issues and verifies JWTs signed with a shared secret. airport-service
 * verifies tokens with the same JWT_SECRET, so a token issued here is
 * valid for internal calls to airport-service too (see
 * HttpAirportValidationAdapter, which forwards the caller's token).
 */
@Injectable()
export class JwtTokenIssuerAdapter implements TokenIssuer {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<string>('JWT_SECRET', 'dev-secret-change-me');
    this.expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1h');
  }

  issue(payload: AuthTokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn } as jwt.SignOptions);
  }

  verify(token: string): AuthTokenPayload {
    return jwt.verify(token, this.secret) as AuthTokenPayload;
  }
}
