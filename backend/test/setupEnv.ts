/* eslint-disable n/no-process-env */
/* cspell:ignore testsecret */

/**
 * Jest environment bootstrap
 * Runs *before* any test files (including coverage runs)
 * Ensures all required env variables exist.
 */

// Always force test environment
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

// Use any available port if not set
process.env.PORT = process.env.PORT ?? '0';

// -----------------------------------------------------------------------------
// ✅ MongoDB connection for tests
// -----------------------------------------------------------------------------
if (!process.env.MONGO_URI) {
  const host = '127.0.0.1';
  const port = '27017';
  const dbName = 'barbershop_test';

  // If you want to isolate databases per Jest worker, uncomment:
  // const worker = process.env.JEST_WORKER_ID || '1';
  // const dbName = `barbershop_test_${worker}`;

  process.env.MONGO_URI = `mongodb://${host}:${port}/${dbName}`;
}

// Also provide camelCase alias (in case ENV.ts expects it)
process.env.MongoUri = process.env.MongoUri ?? process.env.MONGO_URI;

// -----------------------------------------------------------------------------
// ✅ JWT + Booking defaults
// -----------------------------------------------------------------------------
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'testsecret';
process.env.BOOKING_BUFFER_MIN = process.env.BOOKING_BUFFER_MIN ?? '0';
process.env.BookingBufferMin =
  process.env.BookingBufferMin ?? process.env.BOOKING_BUFFER_MIN;

// No exports needed — Jest just executes this file automatically
export {};
