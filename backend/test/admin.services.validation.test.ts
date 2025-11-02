import { api, resetDb, createAdminToken } from './helpers';

describe('Admin Services – validation errors', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('rejects creating a service without required fields', async () => {
    const admin = await createAdminToken({});
    // Missing name/durationMin/price → should be 400 from validator
    await api.post('/api/admin/services')
      .set('Authorization', `Bearer ${admin}`)
      .send({}) // empty body
      .expect(400);
  });

  it('rejects invalid types (e.g. non-number durationMin)', async () => {
    const admin = await createAdminToken({});
    await api.post('/api/admin/services')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'X', durationMin: 'thirty', price: 10 }) // wrong type
      .expect(400);
  });

  it('rejects negative price', async () => {
    const admin = await createAdminToken({});
    await api.post('/api/admin/services')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'BadPrice', durationMin: 30, price: -1 })
      .expect(400);
  });
});
