import { LoggerService } from '@nestjs/common';
import { RequestContext } from '../observability/request-context';

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

/**
 * Emits every log line as a single JSON object, tagged with the current
 * request's correlation ID when one is active, so log aggregators can
 * parse fields and trace a request across services instead of grepping
 * free text.
 */
export class StructuredLogger implements LoggerService {
  log(message: unknown, context?: string): void {
    this.write('log', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write('error', message, context, trace ? { trace } : undefined);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('verbose', message, context);
  }

  private write(
    level: LogLevel,
    message: unknown,
    context?: string,
    extra?: Record<string, unknown>,
  ): void {
    const correlationId = RequestContext.getCorrelationId();
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      ...(correlationId ? { correlationId } : {}),
      ...(typeof message === 'object' ? (message as Record<string, unknown>) : { message }),
      ...extra,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
  }
}
