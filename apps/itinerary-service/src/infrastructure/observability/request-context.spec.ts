import { RequestContext } from './request-context';

describe('RequestContext', () => {
  it('returns undefined outside of any run()', () => {
    expect(RequestContext.getCorrelationId()).toBeUndefined();
  });

  it('exposes the correlation id set for the current run', () => {
    RequestContext.run('abc-123', () => {
      expect(RequestContext.getCorrelationId()).toBe('abc-123');
    });
  });

  it('keeps concurrent runs isolated from each other', async () => {
    const runA = RequestContext.run('id-a', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return RequestContext.getCorrelationId();
    });

    const runB = RequestContext.run('id-b', async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return RequestContext.getCorrelationId();
    });

    const [resultA, resultB] = await Promise.all([runA, runB]);

    expect(resultA).toBe('id-a');
    expect(resultB).toBe('id-b');
  });
});
