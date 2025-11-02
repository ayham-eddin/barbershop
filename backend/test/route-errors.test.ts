import { RouteError } from '@src/common/util/route-errors';

describe('RouteError', () => {
  it('exposes status and message', () => {
    const err = new RouteError(422, 'Bad payload');
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(422);
    expect(err.message).toBe('Bad payload');
  });
});
