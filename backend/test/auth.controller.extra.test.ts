/* =================== IMPORTS =================== */
import { Types } from 'mongoose';
import { api, resetDb } from './helpers';
import { createToken } from '@src/utils/auth';

/* ------------ safe readers (no any / no unsafe access) ------------ */
const readPath = (obj: unknown, path: string[]): unknown => {
  let cur: unknown = obj;
  for (const key of path) {
    if (
      typeof cur !== 'object' ||
      cur === null ||
      !(key in (cur as Record<string, unknown>))
    ) {
      throw new Error(`Response body missing path: ${path.join('.')}`);
    }
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
};

const readString = (obj: unknown, path: string[]): string => {
  const v = readPath(obj, path);
  if (typeof v !== 'string') {
    throw new Error(`Expected string at ${path.join('.')}`);
  }
  return v;
};

const readArray = (obj: unknown, path: string[]): unknown[] => {
  const v = readPath(obj, path);
  if (!Array.isArray(v)) {
    throw new Error(`Expected array at ${path.join('.')}`);
  }
  return v;
};

/* =================== TESTS =================== */

describe('AuthController – extra cases', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('rejects registering with duplicate email (409)', async () => {
    const email = 'dup@example.com';

    await api.post('/api/auth/register')
      .send({ name: 'User1', email, password: 'secret123' })
      .expect(201);

    const res = await api.post('/api/auth/register')
      .send({ name: 'User2', email, password: 'another123' })
      .expect(409);

    const error = readString(res.body, ['error']);
    expect(error).toBe('Email in use');
  });

  it('rejects login with non-existing email (401)', async () => {
    const res = await api.post('/api/auth/login')
      .send({ email: 'does-not-exist@example.com', password: 'secret123' })
      .expect(401);

    const error = readString(res.body, ['error']);
    expect(error).toBe('Invalid login');
  });

  it('rejects login with wrong password (401)', async () => {
    const email = 'login-wrong-pw@example.com';

    await api.post('/api/auth/register')
      .send({ name: 'User', email, password: 'secret123' })
      .expect(201);

    const res = await api.post('/api/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);

    const error = readString(res.body, ['error']);
    expect(error).toBe('Invalid login');
  });

  it('returns validation error when PATCH /auth/me receives invalid body (400)', async () => {
    const email = 'update-me-invalid@example.com';
    const password = 'secret123';

    // Register
    await api.post('/api/auth/register')
      .send({ name: 'User', email, password })
      .expect(201);

    // Login and get token
    const loginRes = await api.post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const token = readString(loginRes.body, ['token']);

    // Send invalid payload (name should be string, not number)
    const res = await api.patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 123 })
      .expect(400);

    const error = readString(res.body, ['error']);
    expect(error).toBe('Validation error');

    const details = readArray(res.body, ['details']);
    expect(details.length).toBeGreaterThan(0);
  });

  it('returns current user with extended profile fields in GET /auth/me (200)', async () => {
    const email = 'me-success@example.com';
    const password = 'secret123';

    // Register + login
    await api.post('/api/auth/register')
      .send({ name: 'User', email, password })
      .expect(201);

    const loginRes = await api.post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const token = readString(loginRes.body, ['token']);

    // Update profile fields
    const patchRes = await api.patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
        phone: '+491234567',
        address: 'Somewhere 1',
        avatarUrl: 'https://example.com/avatar.png',
      })
      .expect(200);

    const patchedName = readString(patchRes.body, ['user', 'name']);
    expect(patchedName).toBe('Updated Name');

    // Fetch /auth/me
    const meRes = await api.get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const name = readString(meRes.body, ['user', 'name']);
    const phone = readString(meRes.body, ['user', 'phone']);
    const address = readString(meRes.body, ['user', 'address']);
    const avatarUrl = readString(meRes.body, ['user', 'avatarUrl']);

    expect(name).toBe('Updated Name');
    expect(phone).toBe('+491234567');
    expect(address).toBe('Somewhere 1');
    expect(avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('GET /auth/me returns 401 when token sub is not a valid ObjectId', async () => {
    const fakeToken = createToken({
      sub: 'not-a-valid-object-id',
      role: 'user',
    });

    const res = await api.get('/api/auth/me')
      .set('Authorization', `Bearer ${fakeToken}`)
      .expect(401);

    const error = readString(res.body, ['error']);
    expect(error).toBe('Invalid token');
  });

  it('PATCH /auth/me returns 404 when user does not exist', async () => {
    const missingId = new Types.ObjectId().toHexString();
    const token = createToken({ sub: missingId, role: 'user' });

    const res = await api.patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Whatever' })
      .expect(404);

    const error = readString(res.body, ['error']);
    expect(error).toBe('User not found');
  });
});
