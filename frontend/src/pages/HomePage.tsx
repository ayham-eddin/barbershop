import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  getServices,
  getBarbers,
  type Service,
  type Barber,
} from "../api/public";

export default function HomePage() {
  const [role, setRole] = useState<'user' | 'admin' | null>(null);

  useEffect(() => {
    setRole((localStorage.getItem('role') as 'user' | 'admin' | null) || null);
    const onStorage = () => setRole((localStorage.getItem('role') as 'user' | 'admin' | null) || null);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const {
    data: services,
    isLoading: sLoading,
    isError: sError,
  } = useQuery({ queryKey: ["services"], queryFn: getServices });

  const {
    data: barbers,
    isLoading: bLoading,
    isError: bError,
  } = useQuery({ queryKey: ["barbers"], queryFn: getBarbers });

  return (
    <div className="space-y-14">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-amber-500/20 blur-2xl" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-amber-400/10 blur-2xl" />

        <div className="relative p-10 md:p-14">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Look sharp. Book fast.
          </h1>
          <p className="mt-4 text-neutral-300 max-w-xl">
            Choose your barber, pick a service, and reserve your spot in
            seconds — all online.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {/* Show "Book now" only for users, admins get Admin link */}
            {role !== 'admin' ? (
              <Link
                to="/book"
                className="inline-flex items-center rounded-lg bg-amber-400 px-5 py-2.5 text-neutral-900 font-semibold hover:bg-amber-300 transition shadow-sm"
              >
                Book now
              </Link>
            ) : (
              <Link
                to="/admin/bookings"
                className="inline-flex items-center rounded-lg bg-amber-400 px-5 py-2.5 text-neutral-900 font-semibold hover:bg-amber-300 transition shadow-sm"
              >
                Go to Admin
              </Link>
            )}

            <a
              href="#services"
              className="inline-flex items-center rounded-lg border border-neutral-700 px-5 py-2.5 text-white hover:bg-neutral-800 transition"
            >
              View Services
            </a>
            <a
              href="#barbers"
              className="inline-flex items-center rounded-lg border border-neutral-700 px-5 py-2.5 text-white hover:bg-neutral-800 transition"
            >
              Meet Barbers
            </a>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-neutral-900">Services</h2>
        </div>

        {sLoading && <ListSkeleton />}
        {sError && <ErrorBox text="Couldn’t load services. Please retry." />}

        {services && (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s._id} service={s} role={role} />
            ))}
          </div>
        )}

        {services && services.length === 0 && (
          <EmptyBox text="No services available yet." />
        )}
      </section>

      {/* BARBERS */}
      <section id="barbers" className="space-y-5">
        <h2 className="text-2xl font-semibold text-neutral-900">Barbers</h2>

        {bLoading && <ListSkeleton />}
        {bError && <ErrorBox text="Couldn’t load barbers. Please retry." />}

        {barbers && (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {barbers.map((b) => (
              <BarberCard key={b._id} barber={b} />
            ))}
          </div>
        )}

        {barbers && barbers.length === 0 && (
          <EmptyBox text="No barbers available yet." />
        )}
      </section>
    </div>
  );
}

/* ---------------------------- UI SUBCOMPONENTS ---------------------------- */

function ServiceCard({ service, role }: { service: Service; role: 'user' | 'admin' | null }) {
  return (
    <article className="group relative rounded-2xl bg-white border border-neutral-200 p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-medium text-neutral-900">{service.name}</h3>
        <span className="rounded-full bg-amber-100 text-amber-900 text-xs px-3 py-1 font-semibold">
          €{service.price}
        </span>
      </div>
      <p className="text-sm text-neutral-600 mt-1">{service.durationMin} min</p>

      {role !== 'admin' ? (
        <Link
          to="/book"
          className="mt-4 inline-flex items-center rounded-lg bg-neutral-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-800 transition"
        >
          Book
        </Link>
      ) : (
        <Link
          to="/admin/bookings"
          className="mt-4 inline-flex items-center rounded-lg bg-neutral-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-800 transition"
        >
          Manage
        </Link>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-neutral-200" />
    </article>
  );
}

function BarberCard({ barber }: { barber: Barber }) {
  const initials = barber.name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article className="rounded-2xl bg-white border border-neutral-200 p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-neutral-900 text-white flex items-center justify-center font-semibold">
          {initials}
        </div>
        <div>
          <h3 className="font-medium text-neutral-900">{barber.name}</h3>
          <p className="text-sm text-neutral-600">
            {Array.isArray(barber.workingHours) && barber.workingHours.length
              ? `Mon–Fri ${barber.workingHours[0].start}–${barber.workingHours[0].end}`
              : "Hours not set"}
          </p>
        </div>
      </div>
    </article>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-28 rounded-2xl bg-gradient-to-r from-neutral-200 to-neutral-100 animate-pulse"
        />
      ))}
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
      {text}
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-center text-neutral-600">
      {text}
    </div>
  );
}
