import { api } from './setup';

describe('Auth routes', () => {
  it('should register a user', async () => {
    const res = await api.post('/api/auth/register').send({
      name: 'Test',
      email: 't@example.com',
      password: 'secret123',
    });
    expect(res.status).toBe(201);
  });
});
