// Allow more time when running with coverage
jest.setTimeout(30_000);
jest.retryTimes(1);

import { api, resetDb, createAdminToken } from './helpers';

interface ServiceOut {
  _id: string;
  name: string;
  durationMin: number;
  price: number;
  // timestamps/other props may exist but are not used here
}

describe('Public services', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('lists services after admin creates some', async () => {
    const admin = await createAdminToken({});

    // create a couple services
    await api.post('/api/admin/services')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Haircut', durationMin: 30, price: 20 })
      .expect(201);

    await api.post('/api/admin/services')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Beard Trim', durationMin: 20, price: 12 })
      .expect(201);

    const res = await api.get('/api/services').expect(200);
    const services = (res.body as { services: ServiceOut[] }).services;

    expect(Array.isArray(services)).toBe(true);
    const names = services.map((s) => s.name);
    expect(names).toEqual(expect.arrayContaining(['Haircut', 'Beard Trim']));
  });
});
