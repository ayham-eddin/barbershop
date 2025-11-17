type ErrorBoxProps = {
  text: string;
};

export function BookingsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-24 rounded-xl bg-neutral-200 animate-pulse"
        />
      ))}
    </div>
  );
}

export function ErrorBox({ text }: ErrorBoxProps) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
      {text}
    </div>
  );
}

export function NoBookingsCard() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-center">
      <p className="text-neutral-600">No bookings yet.</p>
      <a
        href="/book"
        className="inline-flex mt-3 rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2 hover:bg-amber-300 transition"
      >
        Book your first appointment
      </a>
    </div>
  );
}
