import { AsyncLocalStorage } from 'async_hooks';

interface RequestContextStore {
  correlationId: string;
}

/**
 * Carries the correlation ID for the lifetime of a single request without
 * threading it through every function signature. Set once at the entry
 * point (see CorrelationIdMiddleware) and read anywhere downstream —
 * including the logger — via getCorrelationId().
 */
export class RequestContext {
  private static readonly storage = new AsyncLocalStorage<RequestContextStore>();

  static run<T>(correlationId: string, fn: () => T): T {
    return this.storage.run({ correlationId }, fn);
  }

  static getCorrelationId(): string | undefined {
    return this.storage.getStore()?.correlationId;
  }
}
