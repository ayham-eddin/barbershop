// frontend/src/pages/HomePage.tsx
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  getServices,
  getBarbers,
  type Service,
  type Barber,
} from "../api/public";
import ServiceCard from "../components/home/ServiceCard";
import BarberCard from "../components/home/BarberCard";
import {
  CountBadge,
  ListSkeleton,
  ErrorBox,
  EmptyBox,
} from "../components/home/HomeSectionHelpers";

const HomePage = () => {
  const [role, setRole] = useState<"user" | "admin" | null>(null);

  useEffect(() => {
    setRole(
      (localStorage.getItem("role") as "user" | "admin" | null) || null,
    );
    const onStorage = () =>
      setRole(
        (localStorage.getItem("role") as "user" | "admin" | null) || null,
      );
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const {
    data: services,
    isLoading: sLoading,
    isError: sError,
  } = useQuery<Service[]>({ queryKey: ["services"], queryFn: getServices });

  const {
    data: barbers,
    isLoading: bLoading,
    isError: bError,
  } = useQuery<Barber[]>({ queryKey: ["barbers"], queryFn: getBarbers });

  const servicesCount = services?.length ?? 0;
  const barbersCount = barbers?.length ?? 0;

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
            {role !== "admin" ? (
              <Link
                to="/book"
                className="inline-flex items-center rounded-lg bg-amber-400 px-5 py-2.5 text-neutral-900 font-semibold hover:bg-amber-300 transition shadow-sm"
              >
                Book now
              </Link>
            ) : (
              <>
                <Link
                  to="/admin/bookings"
                  className="inline-flex items-center rounded-lg bg-amber-400 px-5 py-2.5 text-neutral-900 font-semibold hover:bg-amber-300 transition shadow-sm"
                >
                  Admin Bookings
                </Link>
                <Link
                  to="/admin/services"
                  className="inline-flex items-center rounded-lg border border-amber-400/70 text-white px-5 py-2.5 hover:bg-neutral-800 transition"
                >
                  Manage Services
                </Link>
              </>
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
            <Link
              to="/about"
              className="inline-flex items-center rounded-lg border border-neutral-700 px-5 py-2.5 text-white hover:bg-neutral-800 transition"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center rounded-lg border border-neutral-700 px-5 py-2.5 text-white hover:bg-neutral-800 transition"
            >
              Contact
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="space-y-5">
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-neutral-900">
              Services
            </h2>
            <CountBadge loading={sLoading} count={servicesCount} label="items" />
          </div>
        </div>

        {sLoading && <ListSkeleton />}
        {sError && (
          <ErrorBox text="Couldn’t load services. Please retry." />
        )}

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
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-neutral-900">
              Barbers
            </h2>
            <CountBadge
              loading={bLoading}
              count={barbersCount}
              label="profiles"
            />
          </div>
        </div>

        {bLoading && <ListSkeleton />}
        {bError && (
          <ErrorBox text="Couldn’t load barbers. Please retry." />
        )}

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

export default HomePage;
