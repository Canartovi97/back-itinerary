import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../domain/errors/auth-domain.errors';
import { PASSWORD_HASHER, PasswordHasher } from '../domain/ports/password-hasher.port';
import { TOKEN_ISSUER, TokenIssuer } from '../domain/ports/token-issuer.port';
import { USER_REPOSITORY, UserRepository } from '../domain/ports/user-repository.port';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_ISSUER) private readonly tokens: TokenIssuer,
  ) {}

  async execute(email: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.users.findByEmail(email.toLowerCase().trim());
    if (!user) {
      // Same error for "no such user" and "wrong password" — don't leak
      // which one it was.
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.hasher.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const accessToken = this.tokens.issue({ sub: user.id, email: user.email });
    return { accessToken };
  }
}
