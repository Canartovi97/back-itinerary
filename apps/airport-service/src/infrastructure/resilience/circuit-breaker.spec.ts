import { CircuitBreaker, CircuitOpenError, CircuitState } from './circuit-breaker';

describe('CircuitBreaker', () => {
  it('stays closed while actions succeed', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1000 });

    await breaker.execute(async () => 'ok');

    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('opens after reaching the failure threshold and fails fast', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1000 });
    const failingAction = () => Promise.reject(new Error('boom'));

    await expect(breaker.execute(failingAction)).rejects.toThrow('boom');
    await expect(breaker.execute(failingAction)).rejects.toThrow('boom');
    expect(breaker.getState()).toBe(CircuitState.OPEN);

    await expect(breaker.execute(failingAction)).rejects.toThrow(CircuitOpenError);
  });

  it('moves to half-open after the reset timeout and closes again on success', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 10 });
    const failingAction = () => Promise.reject(new Error('boom'));

    await expect(breaker.execute(failingAction)).rejects.toThrow('boom');
    expect(breaker.getState()).toBe(CircuitState.OPEN);

    await new Promise((resolve) => setTimeout(resolve, 15));

    const result = await breaker.execute(async () => 'recovered');

    expect(result).toBe('recovered');
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('re-opens if the half-open trial request also fails', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 10 });
    const failingAction = () => Promise.reject(new Error('boom'));

    await expect(breaker.execute(failingAction)).rejects.toThrow('boom');
    await new Promise((resolve) => setTimeout(resolve, 15));

    await expect(breaker.execute(failingAction)).rejects.toThrow('boom');
    expect(breaker.getState()).toBe(CircuitState.OPEN);
  });
});
