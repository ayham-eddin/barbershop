// test/admin.services.dup.test.ts
import { api, resetDb, createAdminToken } from './helpers';

interface ServiceOut { _id: string; name: string; durationMin: number; price: number }

describe('Admin services – duplicate protection', () => {
  let admin: string;

  beforeEach(async () => {
    await resetDb();
    admin = await createAdminToken({});

    // seed one service
    await api.post('/api/admin/services')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Haircut', durationMin: 30, price: 20 })
      .expect(201);
  });

  it('POST rejects creating a duplicate name with 409', async () => {
    await api.post('/api/admin/services')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Haircut', durationMin: 45, price: 25 })
      .expect(409);
  });

  it('PATCH rejects renaming to an existing name with 409', async () => {
    // add a different service name
    const res2 = await api.post('/api/admin/services')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Beard Trim', durationMin: 20, price: 12 })
      .expect(201);

    const other = (res2.body as { service: ServiceOut }).service;

    // try to rename second one to "Haircut"
    await api.patch(`/api/admin/services/${other._id}`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Haircut' })
      .expect(409);
  });
});
