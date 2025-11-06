# LASTENHEFT (Requirements Specification — Customer Perspective)

> **Purpose:** What the system **shall achieve** from a business perspective, independent of implementation details.

## 1) Context
The barbershop needs an online booking system enabling customers to see real‑time availability and place/cancel bookings, and staff to manage services and appointments.

## 2) Stakeholders
- **Customers (End Users):** Book, view, and cancel upcoming appointments.
- **Admin (Shop Owner/Staff):** Maintain services, manage barbers & schedules, handle bookings.
- **Developer/Operator:** Deploy, maintain, and support the system.

## 3) Goals (Business)
1. Increase booking convenience and reduce phone traffic.
2. Eliminate double-booking through conflict checks.
3. Keep admin workload low with simple management screens.
4. Ensure reliability and transparency (time correctness, clear statuses).

## 4) Use Cases (Scope)
### UC‑1: Browse & Book
- Select barber, service, date; view available time slots; confirm booking.
- Receive immediate feedback (success/error).

### UC‑2: Manage My Bookings
- View upcoming/past bookings.
- Cancel a future booking.

### UC‑3: Admin — Manage Services
- Create/edit/delete a service with name, duration, price.
- See list of services.

### UC‑4: Admin — Manage Bookings
- View all bookings with filters (status, barber, date range, query by customer name/email).
- Edit a booking (start/duration/barber/service/notes), cancel, or complete.

### UC‑5: Admin — Manage Barbers & Time Off
- View barbers and their working hours.
- Add/remove time off (blocks that remove availability).

## 5) Functional Requirements (FR)
- FR‑1: Real‑time availability endpoint returns slots based on working hours, time off, and existing bookings.
- FR‑2: Booking creation prevents overlaps and respects minimum buffer for “today”.
- FR‑3: Customers can list and cancel their own bookings.
- FR‑4: Admin can list, filter, edit, cancel, complete bookings.
- FR‑5: Admin can CRUD services.
- FR‑6: Authentication with roles (user/admin).
- FR‑7: Consistent error responses with human‑readable messages.

## 6) Non‑Functional Requirements (NFR)
- NFR‑1: Time stored in UTC; UI displays Berlin time.
- NFR‑2: Availability computation within 500ms for typical days.
- NFR‑3: Reliability: overlap checks at create/update; tests cover core flows.
- NFR‑4: Usability: clear toasts and loading states.
- NFR‑5: Security: protected admin endpoints, authenticated user actions.
- NFR‑6: Quality: ESLint + TypeScript clean build; Jest coverage baseline (see Plan).

## 7) Constraints
- Tech stack fixed as per Architecture (React/Node/Mongo).
- Single shop instance (no multi‑branch in v1).

## 8) Acceptance (Business)
The system is accepted when all use cases UC‑1…UC‑5 are demonstrably supported, key NFRs are met, and Pflichtenheft acceptance criteria pass.
