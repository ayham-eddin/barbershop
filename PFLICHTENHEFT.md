# PFLICHTENHEFT (Functional Specification — Contractor Perspective)

> **Purpose:** How the system **will be built** to satisfy the Lastenheft.

## 1) System Architecture
- **Frontend:** React (Vite, TS), Tailwind, React Router, TanStack Query, Axios, react-hot-toast.
- **Backend:** Express (TS), MongoDB (Mongoose), Zod validation, Day.js (UTC), JWT auth.
- **Folders:**
  - `backend/src/models`: `User`, `Barber`, `Service`, `Appointment`, `TimeOff`
  - `backend/src/routes`: grouped routers; `controllers`, `validators`
  - `backend/src/services`: `scheduling.ts` (availability & overlap)
  - `frontend/src/pages`: `BookingPage`, `DashboardPage`, `Admin/*`
  - `frontend/src/api`: `client.ts`, `public.ts`, `bookings.ts`, `adminBookings.ts`

## 2) Data Contracts (API Shapes)
### Booking (DB)
```
{
  _id: ObjectId,
  userId: ObjectId,
  barberId: ObjectId,
  serviceName: string,
  durationMin: number,
  startsAt: Date (UTC),
  endsAt: Date (UTC),
  status: 'booked' | 'cancelled' | 'completed',
  notes?: string
}
```

### GET `/api/bookings/availability`
Query: `barberId`, `date` (YYYY‑MM‑DD), `durationMin` (int).  
Response: `{ slots: {start: ISO, end: ISO}[] }`

### POST `/api/bookings`
Body: `{ barberId, serviceName, durationMin, startsAt, notes? }`  
Response: `{ booking }`

### GET `/api/bookings/me`
Response: `{ bookings: Array<Booking & { barber?: { id: string, name?: string } }> }`

### POST `/api/bookings/:id/cancel`
Response: `{ booking }`

### Admin
- `GET /api/bookings/admin/all` → filters + `{ bookings, page, pages, total }` (enriched with `user` and `barber` objects).
- `POST /api/bookings/admin/:id/cancel|complete`
- `PATCH /api/bookings/admin/:id` (startsAt/durationMin/barberId/serviceName/notes).

## 3) Core Algorithms
- **getAvailableSlots(barberId, dateISO, durationMin, step=15):**
  - Translate working hours into minute range.
  - Pull appointments/time off that intersect the day range.
  - Slide window by `step`, exclude windows overlapping any block.
  - Apply `BookingBufferMin` only if `dateISO` is today (UTC).
- **hasOverlap(barberId, start, end, excludeId?):**
  - `countDocuments({barberId, status:'booked', startsAt:{$lt:end}, endsAt:{$gt:start}, _id:{$ne:excludeId?}})` > 0

## 4) Validation
- Zod: `createBookingSchema`, `adminUpdateBookingSchema`, etc.
- Server checks for ObjectId validity and ISO times even after Zod.

## 5) Frontend Flows
- **BookingPage:** loads barbers/services, queries availability, posts booking, shows toasts, redirects to dashboard.
- **DashboardPage:** lists `/api/bookings/me`, allows cancel if future. Shows barber name when available, falls back to id.
- **AdminBookingsPage:** filters, pagination, optimistic update for cancel/complete, edit modal → `PATCH`.

## 6) Error Handling
- Axios error extraction helper in admin page; similar pattern elsewhere.
- Backend returns `{ error: string }` consistently with proper HTTP codes (400/401/403/404/409).

## 7) Acceptance Criteria (Measurable)
1. **AC‑A1 Barber names:** User dashboard shows **barber name** for bookings when a matching barber exists; otherwise shows id fallback.
2. **AC‑A2 Overlap safety:** Creating a booking that overlaps any existing `booked` appointment returns **409**.
3. **AC‑A3 Buffer today:** Slots earlier than `now + BookingBufferMin` are not offered for **today**.
4. **AC‑A4 Admin edit parity:** If an admin changes start, duration, or barber, the server recomputes `endsAt` and rejects overlaps with **409**.
5. **AC‑A5 Validation:** Non‑ISO `startsAt`, invalid `ObjectId`, or `durationMin` outside 1..480 yield **400**.
6. **AC‑A6 Lint/TS:** Repo builds cleanly with ESLint (no‑unsafe, no‑explicit‑any) and TypeScript.
7. **AC‑A7 Tests:** Existing booking/service/scheduling tests pass; coverage ≥ thresholds in Jest config.

## 8) Test Plan (Summary)
- Unit: scheduling helpers, validators.
- Integration: POST book (ok/overlap), GET availability (time‑off), admin patch (exclude current id).
- E2E-lite: happy path book → dashboard cancel; admin cancel/complete.

## 9) Deployment
- `.env.example` for server and client; production build scripts.
- Seed script for services/barbers; one admin user.
- Health check: `/healthz` basic ping.

## 10) Open Items (Post‑MVP Backlog)
- Payments, reminders, multi‑branch, i18n, reports, barber calendar feed, roles per‑barber.
