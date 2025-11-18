# BarberBooking – Frontend

This is the frontend for the **BarberBooking** project – a barbershop booking system with:

- Public marketing pages (Home, About, Contact)
- Online booking for customers
- Customer dashboard & profile management
- Admin area for managing bookings, services, barbers, users and time-off
- Responsive UI optimized for desktop and mobile

Built with **React + TypeScript + Vite**.

---

## Tech Stack

  - **Framework**: React 18
  - **Language**: TypeScript
  - **Bundler/Dev server**: Vite
  - **Routing**: React Router
  - **Data fetching / cache**: @tanstack/react-query
  - **HTTP client**: axios
  - **UI styling**: Tailwind-style utility classes (compiled via PostCSS/CSS)
  - **Notifications**: react-hot-toast


----------------

## Project Structure

Only the most important folders are listed here:

```txt
frontend/
├─ public/                 # Static assets
├─ src/
│  ├─ api/                 # API client & typed endpoints (auth, bookings, admin, etc.)
│  ├─ components/
│  │  ├─ admin/            # Admin-specific UI (tables, modals, skeletons…)
│  │  ├─ booking/          # Booking cards, booking state components
│  │  ├─ home/             # Home page cards & helpers
│  │  ├─ profile/          # Profile form & skeleton
│  │  ├─ CalendarGrid.tsx  # Day-view calendar used by admin
│  │  ├─ Navbar.tsx        # Top navigation
│  │  ├─ Modal.tsx         # Reusable modal
│  │  ├─ TimeField.tsx     # Date/time picker wrapper for forms
│  │  └─ …                 # Shared UI (Spinner, StatusBadge, Toaster, etc.)
│  ├─ lib/                 # Small helpers (notifications, error mapping…)
│  ├─ pages/
│  │  ├─ HomePage.tsx
│  │  ├─ LoginPage.tsx
│  │  ├─ BookingPage.tsx
│  │  ├─ DashboardPage.tsx
│  │  ├─ ProfilePage.tsx
│  │  ├─ AboutPage.tsx
│  │  ├─ ContactPage.tsx
│  │  └─ Admin/
│  │     ├─ AdminBookingsPage.tsx
│  │     ├─ AdminServicesPage.tsx
│  │     ├─ AdminBarbersPage.tsx
│  │     ├─ AdminTimeOffPage.tsx
│  │     └─ AdminUsersPage.tsx
│  ├─ utils/               # Booking helpers, datetime formatting, etc.
│  ├─ App.tsx              # Routes & layout (Navbar + pages + footer)
│  └─ main.tsx             # React root & providers
├─ index.html
├─ package.json
└─ vite.config.ts
```
-----------------------------------

# Features Overview

## Public

  - Home – overview of services and barbers.

  - About / Contact – simple static pages.

  - Login / Register – email + password auth.

## Customer

  - Book – choose service, barber and time slot.

  - My Bookings (Dashboard) – list of own bookings with:

    - - cancel

    - - reschedule via modal (date/time picker)

  - Profile – update name, phone, address, avatar.

  - Visual warnings / block status if the user has no-shows.

## Admin

  ### Admin Bookings
    - Filter by status, barber, date range, search by customer.

    - Paginated table + optional day calendar view.

    - Actions: edit, cancel, mark as completed, mark no-show.

    - Edit modal lets you change time, duration, barber, service and notes.

  ### Admin Services
    - CRUD for services (name, duration, price).

  ### Admin Barbers
    - CRUD for barbers (name, specialties, active flag).

    - Editable weekly working hours per barber.

    - Protection against deleting barbers with future bookings (conflict panel).

  ### Admin Time Off
    - Manage barber time-off ranges (start/end + reason).

  ### Admin Users
    - Overview of users with role, warnings and block status.

    - Block/unblock from online booking, clear warnings.

    - Edit user details (name, email, phone, address, avatar, role) in a modal.

----------------------------------------

# Getting Started

## Prerequisites

  - Node.js (recommended ≥ 18)

  - npm or yarn (examples use npm)
---------------------------------------
## Install dependencies

    cd frontend
    npm install
--------------------------------------
## Configure API base URL

  The Axios client is defined in src/api/client.ts.

  If you use a Vite env variable (e.g. VITE_API_BASE_URL), create a .env file in frontend/ and set it accordingly:

  **VITE_API_BASE_URL=http://localhost:5173**
  # change to your backend URL/port


  If no env var is used, adjust the base URL directly in src/api/client.ts.

------------------------------------

## Run in development

  **npm run dev**


  This starts the Vite dev server (usually on http://localhost:5173).

--------------------------------------

## Build for production

  **npm run build**


The optimized build will be output to dist/.

To preview the production build locally:

  **npm run preview**


--------------------------------------------------

## Authentication & Roles

  - When a user logs in or registers successfully, the backend returns:

    - - a JWT token

    - - the user role (user or admin)

  - The frontend stores them in localStorage and in React state.

  - Routes are guarded in App.tsx:

    - - user-only routes: /book, /dashboard, /profile

    - - admin-only routes: /admin/* (bookings, services, barbers, users, timeoff)

  - Navbar updates based on token + role (shows Admin menu, dashboard, profile, logout, etc.).

----------------------------------------------------

## Styling

  - UI is built with Tailwind-style utility classes directly in JSX.

  - Layout:

    - - fixed top Navbar

    - - main content container (max-w-6xl) with padding

    - - simple footer with links to About/Contact

-----------------------

## Notes

  - Data fetching/mutations are all wired through React Query, with:

    - - optimistic updates where helpful (e.g. cancelling bookings, toggling user block).

    - - explicit invalidation of query keys after mutations.

  - Time and date handling for bookings uses helper functions from src/utils/datetime.ts to keep local/UTC conversions consistent (especially in admin edit/reschedule flows).

If you change the API or add new endpoints, follow the existing patterns in src/api/ and wire them into pages/components via React Query.