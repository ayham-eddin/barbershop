import mongoose from 'mongoose';
import request from 'supertest';
import app from '@src/server';
import { User } from '@src/models/User';

export const api = request(app);

/** Drop the current test database (fast + clean) */
export async function resetDb(): Promise<void> {
  const conn = mongoose.connection;
  if (conn.readyState !== 1) throw new Error('mongoose not connected');
  // optional chaining avoids the TS18048 warning
  await conn.db?.dropDatabase();
}

/** Register a user and return JWT token */
export async function createUserToken(
  {
    name = 'User',
    email,
    password = 'secret123',
  }: { name?: string; email: string; password?: string },
): Promise<string> {
  await api.post('/api/auth/register').send({ name, email, password });
  const login = await api.post('/api/auth/login').send({ email, password });

  // narrow the type safely
  const token = (login.body as { token?: string }).token;
  if (!token) throw new Error('Login response missing token');
  return token;
}

/** Register a user, promote to admin in DB, then login and return JWT */
export async function createAdminToken(
  {
    email = 'admin@example.com',
    password = 'secret123',
  }: { email?: string; password?: string } = {},
): Promise<string> {
  await api.post('/api/auth/register').send({ name: 'Admin', email, password });

  // promote directly via model to keep the test API-only afterwards
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { role: 'admin' } },
    { new: true },
  );
  if (!user) throw new Error('admin user not found after register');

  const login = await api.post('/api/auth/login').send({ email, password });
  const token = (login.body as { token?: string }).token;
  if (!token) throw new Error('Login response missing token');
  return token;
}
