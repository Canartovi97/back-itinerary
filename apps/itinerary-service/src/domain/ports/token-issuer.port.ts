export interface AuthTokenPayload {
  sub: string;
  email: string;
}

export interface TokenIssuer {
  issue(payload: AuthTokenPayload): string;
  verify(token: string): AuthTokenPayload;
}

export const TOKEN_ISSUER = Symbol('TOKEN_ISSUER');
