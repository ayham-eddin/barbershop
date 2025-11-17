import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <section className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold text-neutral-900">
          About BarberBooking
        </h1>
        <p className="mt-2 text-neutral-600 text-sm md:text-base">
          BarberBooking is a simple online system that helps clients reserve their spot
          with their favourite barber — without phone calls or waiting in line.
        </p>
      </header>

      {/* Grid content */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">
            How it works
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Choose a barber, pick a service and time, then confirm your booking.
            You&apos;ll immediately see your appointment in{' '}
            <span className="font-medium">My Bookings</span>, where you can
            also reschedule or cancel if needed.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">
            Opening hours
          </h2>
          <dl className="mt-3 space-y-2 text-sm text-neutral-700">
            <div className="flex items-center justify-between gap-4">
              <dt>Mon – Fri</dt>
              <dd className="font-medium">09:00 – 18:00</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Saturday</dt>
              <dd className="font-medium">10:00 – 16:00</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Sunday</dt>
              <dd className="font-medium text-neutral-500">Closed</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-neutral-500">
            Actual opening hours can be adjusted in the admin area.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">
            Why online booking?
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600 list-disc list-inside">
            <li>No need to call during busy hours.</li>
            <li>Clients can see live availability and choose what fits.</li>
            <li>Reduces no-shows with clearer confirmations.</li>
            <li>Admins keep track of bookings and client history.</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/book"
          className="inline-flex items-center rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2 text-sm hover:bg-amber-300 transition"
        >
          Book an appointment
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center rounded-lg border border-neutral-300 text-neutral-800 font-semibold px-4 py-2 text-sm hover:bg-neutral-100 transition"
        >
          Contact us
        </Link>
      </div>
    </section>
  );
}

export default AboutPage;
