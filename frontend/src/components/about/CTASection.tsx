import { Link } from "react-router-dom";
import Button from "../ui/Button";

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
      <Button
        className="bg-yellow-500 font-semibold"
        variant="secondary"
        asChild
      >
        <Link to="/book">Book Now</Link>
      </Button>
      <Button
        className="border border-yellow-500/70 font-semibold text-white hover:bg-yellow-500/50 hover:text-black"
        variant="secondary"
        asChild
      >
        <Link to="/services">View Services</Link>
      </Button>
    </div>
  </section>
);

export default CTASection;
