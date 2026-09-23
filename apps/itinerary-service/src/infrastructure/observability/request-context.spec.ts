import { RequestContext } from './request-context';

describe('RequestContext', () => {
  it('returns undefined outside of any run()', () => {
    expect(RequestContext.getCorrelationId()).toBeUndefined();
    expect(RequestContext.getAuthToken()).toBeUndefined();
  });

  it('exposes the correlation id and auth token set for the current run', () => {
    RequestContext.run({ correlationId: 'abc-123', authToken: 'jwt-xyz' }, () => {
      expect(RequestContext.getCorrelationId()).toBe('abc-123');
      expect(RequestContext.getAuthToken()).toBe('jwt-xyz');
    });
  });

  it('leaves the auth token undefined when none was supplied', () => {
    RequestContext.run({ correlationId: 'abc-123' }, () => {
      expect(RequestContext.getAuthToken()).toBeUndefined();
    });
  });

  it('keeps concurrent runs isolated from each other', async () => {
    const runA = RequestContext.run({ correlationId: 'id-a' }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return RequestContext.getCorrelationId();
    });

    const runB = RequestContext.run({ correlationId: 'id-b' }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return RequestContext.getCorrelationId();
    });

    const [resultA, resultB] = await Promise.all([runA, runB]);

    expect(resultA).toBe('id-a');
    expect(resultB).toBe('id-b');
  });
});
