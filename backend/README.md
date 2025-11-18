# Barbershop Booking – Backend (Node + Express + Mongo)

This is the backend API for the Barbershop Booking app.  
It handles authentication, services, barbers, user bookings, admin management, and time-off.

---

## 1. Stack

**Runtime & Language**

- Node.js (TypeScript)
- Express.js HTTP server
- MongoDB with Mongoose ODM

**Auth & Security**

- JWT-based authentication (Bearer token)
- Role-based access: `user` vs `admin`
- Password hashing with bcrypt (or similar)

**Tooling**

- Jest + ts-jest for unit/integration tests
- Supertest for HTTP endpoint tests
- ESLint + Prettier (TypeScript-aware config)
- Nodemon / ts-node-dev (or similar) for local dev

---

## 2. Project structure (high level)

Main folders (simplified):

- `src/server.ts` – App entry (Express + Mongo connection)
- `src/routes/` – Route definitions
  - `authRoutes.ts` – Login / register
  - `bookingRoutes.ts` – User bookings & admin booking actions
  - `adminServiceRoutes.ts` – Admin CRUD for services
  - `adminBarberRoutes.ts` – Admin CRUD for barbers
  - `adminUserRoutes.ts` – Admin user management
  - `timeOffRoutes.ts` – Barber time-off management
  - `meRoutes.ts` – Current logged-in user (`/api/me`)
  - `publicRoutes.ts` – Public catalog (services, barbers, availability)
- `src/controllers/` – Business logic (one controller per route group)
- `src/models/` – Mongoose models (User, Service, Barber, Booking, TimeOff, etc.)
- `src/middleware/` – Auth, error handling, validation helpers
- `src/config/` – Environment config (Mongo URL, JWT secret, etc.)
- `test/` – Jest tests + coverage config

(Names may vary slightly, but the structure follows this pattern.)

---

## 3. Running the backend locally

### Prerequisites

- Node.js 18+ (or 20+ recommended)
- MongoDB instance (local Docker or cloud)
- A `.env` file with at least:

  ```bash
  MONGO_URL=mongodb://localhost:27017/barbershop
  JWT_SECRET=changeme
  PORT=4000
  NODE_ENV=development

# install dependencies
npm install

# run in development mode
npm run dev    # or whatever dev script is defined in package.json


The API will then be available at e.g. http://localhost:4000.

-------------------------------

# Tests

## unit/integration tests
npm test

## tests with coverage
npm run test:cov
----------------------------------

4. # API overview – groups

This is not full documentation, just a high-level map of the main API groups.

## 4.1 Auth & current user

Purpose: registering & logging in users; reading/updating their own profile.

Typical endpoints:

  - POST /api/auth/register – Create a new user account

  - POST /api/auth/login – Login, returns { token, user }

  - GET /api/me – Get current user profile (requires JWT)

  - PATCH /api/me – Update name, phone, address, avatar, etc.

Used by: Login page, Profile page, and general authenticated requests.

-------------------

## 4.2 Public catalog (no auth or optional)

Purpose: data needed to browse before booking.

Typical endpoints:

  - GET /api/services – List services (name, duration, price)

  - GET /api/barbers – List barbers (name, working hours)

  - GET /api/availability – Available time slots for a service/barber/date

Used by: Home page, “Book now” flow.

---------------------

## 4.3 User bookings

Purpose: normal customers creating and managing their own bookings.

Typical endpoints:

  - POST /api/bookings – Create a booking (service, barber, startsAt)

  - GET /api/me/bookings – List user’s bookings

  - PATCH /api/me/bookings/:id – Reschedule an existing booking

  - POST /api/me/bookings/:id/cancel – Cancel own booking

Used by: DashboardPage (My Bookings) & booking flow.

---------------------

## 4.4 Admin – services

Purpose: manage the catalog of services (haircut, beard, combo, etc.).

Typical endpoints:

  - GET /api/admin/services – List all services

  - POST /api/admin/services – Create a service

  - PATCH /api/admin/services/:id – Update name/duration/price

  - DELETE /api/admin/services/:id – Delete a service

Used by: AdminServicesPage.

-------------------------------------------

## 4.5 Admin – barbers

Purpose: manage barbers & their working hours.

Typical endpoints:

  - GET /api/admin/barbers

  - POST /api/admin/barbers

  - PATCH /api/admin/barbers/:id

  - DELETE /api/admin/barbers/:id

Special behavior:

Deleting a barber may fail with a “future_bookings” conflict if they still have upcoming bookings.

Used by: AdminBarbersPage.

------------------------------------------------

## 4.6 Admin – bookings

Purpose: full calendar + table view for all bookings.

Typical endpoints:

  - GET /api/bookings/admin/all – List bookings with filters:

    - - status, barberId, dateFrom, dateTo, page, q (search)

  - POST /api/bookings/admin/:id/cancel – Cancel booking

  - POST /api/bookings/admin/:id/complete – Mark as completed

  - POST /api/bookings/admin/:id/no-show – Mark as no-show (adds warning)

Used by: AdminBookingsPage (table + day calendar).

--------------------------------------

## 4.7 Admin – users

Purpose: manage users, roles, warnings, and blocks.

Typical endpoints:

  - GET /api/admin/users – List users

  - GET /api/admin/users/:id – Get single user (admin view)

  - PATCH /api/admin/users/:id – Update name, email, role, profile fields

  - POST /api/admin/users/:id/block – Block from online booking (with reason)

  - POST /api/admin/users/:id/unblock – Remove block

  - POST /api/admin/users/:id/warnings/clear-one – Remove one warning

Used by: AdminUsersPage (table + details modal).

-------------------------------------------------------

## 4.8 Admin – time off

Purpose: mark barbers as unavailable for certain date/times.

Typical endpoints:

  - GET /api/admin/timeoff – List time-off entries (optionally filter by barberId)

  - POST /api/admin/timeoff – Create time-off (barberId, start, end, reason?)

  - DELETE /api/admin/timeoff/:id – Remove a time-off entry

Used by: AdminTimeOffPage.

--------------------------------------------------------------

# 5. Frontend integration

The React frontend (Vite + TypeScript) consumes this API via a shared Axios client and React Query.
Every group above maps directly to a set of frontend/src/api/*.ts helpers:

  - api/client.ts – Axios instance

  - api/auth.ts, api/bookings.ts, api/adminBookings.ts, api/adminUsers.ts, api/timeoff.ts, api/public.ts, api/me.ts, etc.

Those helpers are the recommended way to explore the exact request/response shapes while working on the frontend.