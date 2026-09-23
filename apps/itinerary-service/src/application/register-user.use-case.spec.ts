import { EmailAlreadyRegisteredError } from '../domain/errors/auth-domain.errors';
import { PasswordHasher } from '../domain/ports/password-hasher.port';
import { UserRepository } from '../domain/ports/user-repository.port';
import { User } from '../domain/user.entity';
import { RegisterUserUseCase } from './register-user.use-case';

class FakeUserRepository implements UserRepository {
  private byEmail = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    return this.byEmail.get(email) ?? null;
  }

  async save(user: User): Promise<User> {
    this.byEmail.set(user.email, user);
    return user;
  }
}

const fakeHasher: PasswordHasher = {
  hash: async (plain) => `hashed:${plain}`,
  compare: async (plain, hash) => hash === `hashed:${plain}`,
};

describe('RegisterUserUseCase', () => {
  it('hashes the password and stores a new user', async () => {
    const users = new FakeUserRepository();
    const useCase = new RegisterUserUseCase(users, fakeHasher);

    const user = await useCase.execute('New.User@Example.com', 'super-secret');

    expect(user.email).toBe('new.user@example.com');
    expect(user.passwordHash).toBe('hashed:super-secret');
    await expect(users.findByEmail('new.user@example.com')).resolves.toEqual(user);
  });

  it('rejects registering an email that already exists', async () => {
    const users = new FakeUserRepository();
    const useCase = new RegisterUserUseCase(users, fakeHasher);
    await useCase.execute('taken@example.com', 'first-password');

    await expect(useCase.execute('taken@example.com', 'second-password')).rejects.toThrow(
      EmailAlreadyRegisteredError,
    );
  });
});
