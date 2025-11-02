import { api, resetDb, createAdminToken } from './helpers';

describe('TimeOff query validation', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('400 on invalid barberId query', async () => {
    const admin = await createAdminToken({});
    await api
      .get('/api/admin/timeoff?barberId=not-an-objectid')
      .set('Authorization', `Bearer ${admin}`)
      .expect(400);
  });
});
