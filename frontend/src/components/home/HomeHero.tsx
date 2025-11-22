import { Link } from "react-router-dom";
import homeHero from "../../assets/home-hero.jpeg";
import Button from "../ui/Button";

type Props = {
  role: "user" | "admin" | null;
};

const HomeHero = ({ role }: Props) => {
  const isAdmin = role === "admin";

  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-neutral-950 text-white shadow-xl border border-white"
      data-aos="fade-up"
    >
      {/* Background image */}
      <img
        src={homeHero}
        alt="Premium barbershop interior"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

      {/* Content */}
      <div className="relative px-6 py-10 md:px-10 md:py-16">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300/80">
            Premium Barbershop · Düsseldorf
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Look sharp. Feel confident.
          </h1>
          <p className="text-sm md:text-base text-neutral-200 max-w-xl">
            Book your next haircut or beard trim in seconds. Real-time
            availability, trusted barbers, and a smooth booking experience.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {isAdmin ? (
              <>
                <Button className="bg-yellow-500" variant="secondary" asChild>
                  <Link to="/admin/bookings">Go to Admin Bookings</Link>
                </Button>
                <Button className="border border-yellow-500 text-white hover:bg-yellow-500 hover:text-black" variant="secondary" asChild>
                  <Link to="/admin/services">Manage Services</Link>
                </Button>
              </>
            ) : (
              <>
                <Button className="bg-yellow-500" variant="secondary" asChild>
                  <Link to="/book">Book an Appointment</Link>
                </Button>
                <Button className="border border-yellow-500 text-white hover:bg-yellow-500 hover:text-black" variant="secondary" asChild>
                  <Link to="/about">How it works</Link>
                </Button>
                <Button className="border border-yellow-500 text-white hover:bg-yellow-500 hover:text-black" variant="secondary" size="sm" asChild>
                    <a href="#services">View services</a>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Small “stats” strip */}
        <div className="mt-8 flex flex-wrap gap-4 text-xs md:text-sm text-neutral-200">
          <div className="rounded-full bg-black/40 px-3 py-1 border border-white/10">
            <span className="font-semibold text-amber-300">30s</span> average
            booking time
          </div>
          <div className="rounded-full bg-black/40 px-3 py-1 border border-white/10">
            Real-time availability
          </div>
          <div className="rounded-full bg-black/40 px-3 py-1 border border-white/10">
            Cancel &amp; reschedule online
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
