import { api, resetDb, createAdminToken } from './helpers';

interface ServiceOut {
  _id: string;
  name: string;
  durationMin: number;
  price: number;
}

describe('Admin services CRUD', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetDb();
    adminToken = await createAdminToken({});
  });

  it('can create, list, update and delete a service', async () => {
    // CREATE
    const createRes = await api.post('/api/admin/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Kids Cut', durationMin: 25, price: 15 })
      .expect(201);

    const created = (createRes.body as { service: ServiceOut }).service;
    expect(created.name).toBe('Kids Cut');

    // LIST
    const listRes = await api.get('/api/admin/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const list = (listRes.body as { services: ServiceOut[] }).services;
    const found = list.find((s) => s._id === created._id);
    expect(found?.name).toBe('Kids Cut');

    // UPDATE
    const updateRes = await api.patch(`/api/admin/services/${created._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 18 })
      .expect(200);

    const updated = (updateRes.body as { service: ServiceOut }).service;
    expect(updated.price).toBe(18);

    // DELETE
    const delRes = await api.delete(`/api/admin/services/${created._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const deleted = (delRes.body as { deleted: ServiceOut }).deleted;
    expect(deleted._id).toBe(created._id);
  });
});
