import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { JwtAuthGuard } from './jwt-auth.guard';

const SECRET = 'test-secret';

function buildContext(authorizationHeader?: string): ExecutionContext {
  const req = {
    header: (name: string) => (name === 'authorization' ? authorizationHeader : undefined),
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function buildGuard(): JwtAuthGuard {
  const configService = {
    get: (_key: string, fallback?: unknown) => (_key === 'JWT_SECRET' ? SECRET : fallback),
  } as unknown as ConfigService;
  return new JwtAuthGuard(configService);
}

describe('JwtAuthGuard (airport-service)', () => {
  it('allows a request signed with the shared secret', () => {
    const guard = buildGuard();
    const token = jwt.sign({ sub: 'user-1' }, SECRET);

    expect(guard.canActivate(buildContext(`Bearer ${token}`))).toBe(true);
  });

  it('rejects a request with no authorization header', () => {
    const guard = buildGuard();
    expect(() => guard.canActivate(buildContext(undefined))).toThrow(UnauthorizedException);
  });

  it('rejects a token signed with a different secret', () => {
    const guard = buildGuard();
    const token = jwt.sign({ sub: 'user-1' }, 'some-other-secret');

    expect(() => guard.canActivate(buildContext(`Bearer ${token}`))).toThrow(UnauthorizedException);
  });
});
