import { RequestContext } from '../observability/request-context';

type LogLevel = 'log' | 'error' | 'warn';

/**
 * Plain (non-NestJS) equivalent of the other services' StructuredLogger:
 * emits one JSON object per line, tagged with the current correlation ID
 * when one is active, so log aggregators can trace an event across
 * services instead of grepping free text.
 */
export class StructuredLogger {
  static log(message: string, extra?: Record<string, unknown>): void {
    this.write('log', message, extra);
  }

  static warn(message: string, extra?: Record<string, unknown>): void {
    this.write('warn', message, extra);
  }

  static error(message: string, extra?: Record<string, unknown>): void {
    this.write('error', message, extra);
  }

  private static write(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
    const correlationId = RequestContext.getCorrelationId();
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context: 'notification-function',
      message,
      ...(correlationId ? { correlationId } : {}),
      ...extra,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
  }
}
