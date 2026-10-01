/**
 * Domain entity for a registered account. Password is always stored as an
 * already-computed hash — the domain never sees or handles plaintext
 * passwords itself (that stays at the infrastructure boundary via
 * PasswordHasher).
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string;
    email: string;
    passwordHash: string;
    createdAt?: Date;
  }): User {
    return new User(
      props.id,
      props.email.toLowerCase().trim(),
      props.passwordHash,
      props.createdAt ?? new Date(),
    );
  }
}
