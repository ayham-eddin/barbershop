// test/setup.ts
import request from 'supertest';
import app from '@src/server';
import { connectDB } from '@src/config/db';
import mongoose from 'mongoose';

// make supertest agent available to tests
export const api = request(app);

// give slow CI a bit more headroom
jest.setTimeout(15_000);

beforeAll(async () => {
  // ensure the test DB is connected before any test runs
  await connectDB();
});

afterAll(async () => {
  // close mongoose connection to avoid open handle (TCPSERVERWRAP)
  await mongoose.connection.close();
});
