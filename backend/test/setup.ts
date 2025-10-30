import request from 'supertest';
// this works because tsconfig paths maps @src/* -> src/*
import app from '@src/server';

// Expose a typed supertest agent if you want to reuse it in tests
let server: import('http').Server;
export const api = request(app);

beforeAll( () => {
  // If your app connects DB in index.ts, we can still listen here in tests
  // but normally supertest can hit `app` directly without listen().
  server = app.listen(0);
});

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

// Optional: simple health-check to verify the setup (can be removed)
test('setup: /api/health returns ok', async () => {
  const res = await request(app).get('/api/health');
  expect([200, 404]).toContain(res.status); // depending on your route
});
