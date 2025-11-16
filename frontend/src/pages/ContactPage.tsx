// frontend/src/pages/ContactPage.tsx
import { type FormEvent, useState } from 'react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // In this project we don’t actually send the message anywhere.
    // This just shows a simple UI confirmation.
    setSubmitted(true);
  }

  return (
    <section className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold text-neutral-900">
          Contact
        </h1>
        <p className="mt-2 text-neutral-600 text-sm md:text-base">
          Have a question about your booking, services, or anything else?
          Send us a message and we&apos;ll get back to you as soon as we can.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start">
        {/* Form */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">
            Send a message
          </h2>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-neutral-700">
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              Message
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
            </label>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-semibold hover:bg-neutral-800 transition disabled:opacity-60"
                disabled={submitted}
              >
                {submitted ? 'Message sent' : 'Send message'}
              </button>

              {submitted && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-1">
                  This is a demo form – your message was not actually sent,
                  but the UI flow works.
                </p>
              )}
            </div>
          </form>
        </section>

        {/* Contact details */}
        <aside className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Shop details
          </h2>

          <div className="space-y-2 text-sm text-neutral-700">
            <p className="font-medium">BarberBooking Barbershop</p>
            <p>Sample Street 123</p>
            <p>40210 Düsseldorf</p>
          </div>

          <div className="space-y-1 text-sm text-neutral-700">
            <p>
              Phone:{' '}
              <a
                href="tel:+490000000000"
                className="text-neutral-900 underline underline-offset-2"
              >
                +49 0000 000000
              </a>
            </p>
            <p>
              Email:{' '}
              <a
                href="mailto:info@example.com"
                className="text-neutral-900 underline underline-offset-2"
              >
                info@example.com
              </a>
            </p>
          </div>

          <div className="space-y-1 text-sm text-neutral-700">
            <p className="font-medium">Walk-in & bookings</p>
            <p>We accept walk-ins when possible, but booking online is recommended.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
