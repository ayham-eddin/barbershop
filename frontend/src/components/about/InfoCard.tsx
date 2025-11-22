const InfoCard = () => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
    <h2 className="text-lg font-semibold text-neutral-900">
      Why Clients Love Online Booking
    </h2>
    <ul className="mt-3 space-y-2 text-sm text-neutral-600 list-disc list-inside">
      <li>No need to call during busy hours.</li>
      <li>See real-time availability for each barber.</li>
      <li>Fewer no-shows with clear confirmations.</li>
      <li>The team stays organised and focused on great cuts.</li>
    </ul>
  </div>
);

export default InfoCard;
