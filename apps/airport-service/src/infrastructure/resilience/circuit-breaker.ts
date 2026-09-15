export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export class CircuitOpenError extends Error {
  constructor(message = 'Circuit breaker is open') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

export interface CircuitBreakerOptions {
  /** Consecutive failures required to trip the circuit open. */
  failureThreshold: number;
  /** Time to wait before allowing a single trial request through (half-open). */
  resetTimeoutMs: number;
}

/**
 * Minimal circuit breaker: CLOSED -> (N failures) -> OPEN -> (timeout elapsed)
 * -> HALF_OPEN -> (success) -> CLOSED, or (failure) -> OPEN again.
 * While OPEN, calls fail fast via CircuitOpenError instead of reaching the network.
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private consecutiveFailures = 0;
  private nextAttemptAt = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  getState(): CircuitState {
    return this.state;
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptAt) {
        throw new CircuitOpenError();
      }
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(): void {
    this.consecutiveFailures += 1;
    if (
      this.state === CircuitState.HALF_OPEN ||
      this.consecutiveFailures >= this.options.failureThreshold
    ) {
      this.state = CircuitState.OPEN;
      this.nextAttemptAt = Date.now() + this.options.resetTimeoutMs;
    }
  }
}
