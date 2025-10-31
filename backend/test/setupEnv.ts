/* eslint-disable n/no-process-env */
/* cspell:ignore testsecret */

// Ensure we’re in the test environment
process.env.NODE_ENV = 'test';

// Some code paths might read `PORT`; zero means “pick any free port”
process.env.PORT = process.env.PORT ?? '0';

// Mongo connection used during tests
process.env.MONGO_URI =
  process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/barbershop_test';
// Provide camelCase alias too, in case ENV.ts reads that shape
process.env.MongoUri = process.env.MongoUri ?? process.env.MONGO_URI;

// JWT secret for signing test tokens
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'testsecret';

// Booking buffer (minutes) — 0 so slots appear immediately in tests
process.env.BOOKING_BUFFER_MIN = process.env.BOOKING_BUFFER_MIN ?? '0';
process.env.BookingBufferMin =
  process.env.BookingBufferMin ?? process.env.BOOKING_BUFFER_MIN;
