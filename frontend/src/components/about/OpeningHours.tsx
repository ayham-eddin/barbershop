const OpeningHours = () => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
    <h2 className="text-lg font-semibold text-neutral-900">Opening Hours</h2>
    <dl className="mt-3 space-y-2 text-sm text-neutral-700">
      <div className="flex justify-between">
        <dt>Mon – Fri</dt>
        <dd className="font-medium">09:00 – 18:00</dd>
      </div>
      <div className="flex justify-between">
        <dt>Saturday</dt>
        <dd className="font-medium">10:00 – 16:00</dd>
      </div>
      <div className="flex justify-between">
        <dt>Sunday</dt>
        <dd className="font-medium text-neutral-500">Closed</dd>
      </div>
    </dl>
    <p className="text-xs text-neutral-500 mt-3">Admins can edit hours anytime.</p>
  </div>
);

export default OpeningHours;
