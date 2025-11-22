import { Link } from "react-router-dom";

const CTASection = () => (
  <section className="rounded-2xl bg-neutral-900 border border-amber-500/40 shadow-lg p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h3 className="text-lg font-semibold text-white">
        Ready for your next fresh cut?
      </h3>
      <p className="text-sm text-neutral-300 mt-1">
        Choose your barber, pick a service, and secure your spot in seconds.
      </p>
    </div>

    <div className="flex gap-3 justify-center sm:justify-end">
      <Link
        to="/book"
        className="rounded-lg bg-amber-400 text-neutral-900 px-4 py-2 text-sm font-semibold hover:bg-amber-300 transition"
      >
        Book Now
      </Link>
      <Link
        to="/services"
        className="rounded-lg border border-neutral-500 text-white px-4 py-2 text-sm font-semibold hover:bg-neutral-800 transition"
      >
        View Services
      </Link>
    </div>
  </section>
);

export default CTASection;
