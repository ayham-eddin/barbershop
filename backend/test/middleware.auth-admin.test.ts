import { api, resetDb } from './helpers';

interface LoginResponse { token: string }

describe('Auth/Admin middleware', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('401 when missing token on admin route', async () => {
    await api.get('/api/admin/services').expect(401);
  });

  it('403 when non-admin token on admin route', async () => {
    // create normal user
    await api.post('/api/auth/register').send({
      name: 'User',
      email: 'u@example.com',
      password: 'secret123',
    }).expect(201);

    const login = await api.post('/api/auth/login').send({
      email: 'u@example.com',
      password: 'secret123',
    }).expect(200);

    // ✅ make body typed instead of any
    const { token } = login.body as LoginResponse;

    await api
      .get('/api/admin/services')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
