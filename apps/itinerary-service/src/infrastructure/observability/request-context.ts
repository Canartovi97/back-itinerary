import { AsyncLocalStorage } from 'async_hooks';

interface RequestContextStore {
  correlationId: string;
  /** Raw bearer token (no "Bearer " prefix) from the inbound request, if any. */
  authToken?: string;
}

/**
 * Carries per-request data (correlation ID, and the caller's auth token)
 * for the lifetime of a request without threading them through every
 * function signature. Set once at the entry point (see
 * CorrelationIdMiddleware) and read anywhere downstream — including the
 * logger and outbound adapters — via the getters below.
 */
export class RequestContext {
  private static readonly storage = new AsyncLocalStorage<RequestContextStore>();

  static run<T>(store: RequestContextStore, fn: () => T): T {
    return this.storage.run(store, fn);
  }

  static getCorrelationId(): string | undefined {
    return this.storage.getStore()?.correlationId;
  }

  static getAuthToken(): string | undefined {
    return this.storage.getStore()?.authToken;
  }
}
