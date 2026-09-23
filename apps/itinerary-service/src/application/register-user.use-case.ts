import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EmailAlreadyRegisteredError } from '../domain/errors/auth-domain.errors';
import { PASSWORD_HASHER, PasswordHasher } from '../domain/ports/password-hasher.port';
import { USER_REPOSITORY, UserRepository } from '../domain/ports/user-repository.port';
import { User } from '../domain/user.entity';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(email: string, password: string): Promise<User> {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await this.users.findByEmail(normalizedEmail);
    if (existing) {
      throw new EmailAlreadyRegisteredError(normalizedEmail);
    }

    const passwordHash = await this.hasher.hash(password);
    const user = User.create({ id: randomUUID(), email: normalizedEmail, passwordHash });
    return this.users.save(user);
  }
}
