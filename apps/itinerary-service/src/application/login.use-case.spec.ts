import { InvalidCredentialsError } from '../domain/errors/auth-domain.errors';
import { PasswordHasher } from '../domain/ports/password-hasher.port';
import { AuthTokenPayload, TokenIssuer } from '../domain/ports/token-issuer.port';
import { UserRepository } from '../domain/ports/user-repository.port';
import { User } from '../domain/user.entity';
import { LoginUseCase } from './login.use-case';

const fakeHasher: PasswordHasher = {
  hash: async (plain) => `hashed:${plain}`,
  compare: async (plain, hash) => hash === `hashed:${plain}`,
};

class FakeTokenIssuer implements TokenIssuer {
  issued: AuthTokenPayload[] = [];

  issue(payload: AuthTokenPayload): string {
    this.issued.push(payload);
    return `token-for-${payload.sub}`;
  }

  verify(): AuthTokenPayload {
    throw new Error('not used in these tests');
  }
}

describe('LoginUseCase', () => {
  const existingUser = User.create({
    id: 'user-1',
    email: 'jane@example.com',
    passwordHash: 'hashed:correct-password',
  });

  function buildRepo(users: User[]): UserRepository {
    return {
      findByEmail: async (email) => users.find((u) => u.email === email) ?? null,
      save: async (u) => u,
    };
  }

  it('issues a token for correct credentials', async () => {
    const tokens = new FakeTokenIssuer();
    const useCase = new LoginUseCase(buildRepo([existingUser]), fakeHasher, tokens);

    const result = await useCase.execute('jane@example.com', 'correct-password');

    expect(result.accessToken).toBe('token-for-user-1');
    expect(tokens.issued).toEqual([{ sub: 'user-1', email: 'jane@example.com' }]);
  });

  it('rejects an unknown email without revealing that it does not exist', async () => {
    const useCase = new LoginUseCase(buildRepo([]), fakeHasher, new FakeTokenIssuer());

    await expect(useCase.execute('nobody@example.com', 'whatever')).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it('rejects a wrong password', async () => {
    const useCase = new LoginUseCase(buildRepo([existingUser]), fakeHasher, new FakeTokenIssuer());

    await expect(useCase.execute('jane@example.com', 'wrong-password')).rejects.toThrow(
      InvalidCredentialsError,
    );
  });
});
