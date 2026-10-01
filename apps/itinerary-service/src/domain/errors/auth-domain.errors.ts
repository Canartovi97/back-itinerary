export class AuthDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EmailAlreadyRegisteredError extends AuthDomainError {
  constructor(email: string) {
    super(`An account with email ${email} already exists`);
  }
}

export class InvalidCredentialsError extends AuthDomainError {
  constructor() {
    super('Invalid email or password');
  }
}
