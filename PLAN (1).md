# Barbershop App — Delivery Plan (Stable)

> **Status:** Locked baseline v1.0 (Nov 6, 2025). Changes after this require a change request.

## 1) Project Overview
Full‑stack barbershop system:
- **Frontend:** React + Vite + TypeScript, Tailwind, TanStack Query, Axios, react-router, react-hot-toast.
- **Backend:** Node + Express + TypeScript, MongoDB (Mongoose), Zod validation, Jest tests, Day.js (UTC), JWT auth.
- **Modules:** Auth, Services, Barbers & Working Hours, Time Off, Availability, Booking (user/admin), Admin CMS.

## 2) High-Level Goals
1. Reliable online booking with live availability and conflict prevention.
2. Clean admin workflows: CRUD services, manage bookings, manage barbers, set time off.
3. Robust code quality: ESLint + Prettier + Jest coverage; UTC correctness.
4. Ready for deployment on a basic cloud setup (e.g., Render/Fly/Heroku + Mongo Atlas).

## 3) Scope (MVP)
- Public pages: Home, Services list, Booking flow (choose barber, service, date; view slots; confirm).
- User: dashboard (list own bookings, cancel future), auth (register/login).
- Admin: services CRUD, bookings list with filters and actions (edit/cancel/complete), barbers (seed/show), time-off (API + basic UI).
- Backend APIs with Zod validation; scheduling service with buffer; overlap checks.
- Tests: unit/integration for validators, scheduling, services, bookings core.
- UX: toasts, loading states, error states.

## 4) Non-Goals (v1)
- Payments, reminders, multi-branch support, i18n, complex reporting, staff app, calendar sync.

## 5) Architecture Decisions
- **Time:** store as UTC in DB; convert to Europe/Berlin for display.
- **Availability:** calculated server-side from working hours, time-off, and existing appointments; 15-min step.
- **Security:** JWT (http-only cookie or Authorization header), role-based middleware (`user`, `admin`).

## 6) Milestones & Order
**A. Quality & UX polish (current)**
- A1: Ensure barber names appear for users (not just IDs) — fix `/api/bookings/me` response shape & UI binding.
- A2: Unify toasts/error messages; show server errors from Axios.
- A3: ESLint/TS cleanup in backend (no-unsafe, consistent types) and frontend (`react-refresh` rule).
- A4: Time handling audit (UTC storage, Berlin display).

**B. Admin CMS completion**
- B1: Service CRUD final pass (validation & optimistic updates).
- B2: Admin bookings edit modal (already implemented), verify validation parity with backend.
- B3: Time-Off endpoints + minimal UI (add/remove blocks).

**C. Testing & CI**
- C1: Expand booking tests (edit/overlap/cancel edge cases).
- C2: Scheduling edge cases (buffer-today, boundary ends, time-off overlaps).
- C3: Lint & test CI workflow. Coverage baseline: statements 70%, lines 71%.

**D. Deployment**
- D1: Production builds, environment config, health checks.
- D2: Seed admin, default services/barbers, backup script.

## 7) Deliverables
- Working app (frontend + backend).
- Test suite with coverage reports.
- Seeds + .env.example + README (run/dev/prod instructions).
- This plan + Lastenheft + Pflichtenheft.

## 8) Risks & Mitigations
- **Timezones:** Strict UTC in DB; helper formatters for display. Tests include winter/summer dates.
- **Data races in tests:** Run tests serially (maxWorkers:1).
- **Overbooking:** Single overlap check in create & admin update endpoints; unique scheduling service.
- **Scope creep:** This plan is locked; changes require explicit ticket/change request.

## 9) Tracking “Done”
A task is **Done** when: (1) code merged, (2) tests pass locally, (3) lint/ts clean, (4) manual acceptance criteria met in Pflichtenheft.
