import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import {
  AuthDomainError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
} from '../../domain/errors/auth-domain.errors';

@Catch(AuthDomainError)
export class AuthDomainErrorFilter implements ExceptionFilter {
  catch(exception: AuthDomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    let status: number = HttpStatus.BAD_REQUEST;
    if (exception instanceof InvalidCredentialsError) {
      status = HttpStatus.UNAUTHORIZED;
    } else if (exception instanceof EmailAlreadyRegisteredError) {
      status = HttpStatus.CONFLICT;
    }

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    });
  }
}
