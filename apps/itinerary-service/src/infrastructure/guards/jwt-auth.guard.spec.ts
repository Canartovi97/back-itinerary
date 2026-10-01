import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthTokenPayload, TokenIssuer } from '../../domain/ports/token-issuer.port';
import { JwtAuthGuard } from './jwt-auth.guard';

function buildContext(authorizationHeader?: string): ExecutionContext {
  const req = {
    header: (name: string) => (name === 'authorization' ? authorizationHeader : undefined),
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const validPayload: AuthTokenPayload = { sub: 'user-1', email: 'jane@example.com' };

  function buildTokens(overrides: Partial<TokenIssuer> = {}): TokenIssuer {
    return {
      issue: () => 'unused',
      verify: () => validPayload,
      ...overrides,
    };
  }

  it('allows the request through and attaches the payload when the token is valid', () => {
    const guard = new JwtAuthGuard(buildTokens());
    const context = buildContext('Bearer good-token');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a request with no authorization header', () => {
    const guard = new JwtAuthGuard(buildTokens());
    const context = buildContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects a request whose header is not a bearer token', () => {
    const guard = new JwtAuthGuard(buildTokens());
    const context = buildContext('Basic dXNlcjpwYXNz');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects a request whose token fails verification', () => {
    const guard = new JwtAuthGuard(
      buildTokens({
        verify: () => {
          throw new Error('invalid signature');
        },
      }),
    );
    const context = buildContext('Bearer bad-token');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
