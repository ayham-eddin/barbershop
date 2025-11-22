import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import about from "../../assets/about.jpeg";

const Hero = () => {
  const [offset, setOffset] = useState(0);

  // Simple parallax on scroll
  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY * 0.15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      className="relative rounded-3xl overflow-hidden shadow-xl"
      data-aos="fade-up"
    >
      <div className="relative h-[420px]">
        <img
          src={about}
          alt="Barbershop interior"
          style={{ transform: `translateY(${offset}px)` }}
          className="w-full h-full object-cover transition-transform duration-300"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/45 to-black/20 flex flex-col items-center justify-center text-center px-4">
          <span className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-neutral-100 mb-3">
            Premium Barbershop Experience
          </span>

          <h1
            data-aos="fade-down"
            className="text-3xl sm:text-4xl font-bold text-white drop-shadow"
          >
            A Modern Way to Book Your Barber
          </h1>

          <p
            data-aos="fade-up"
            data-aos-delay="200"
            className="text-neutral-100 mt-3 max-w-xl text-sm sm:text-base"
          >
            No calls. No waiting. Just a smooth, premium grooming experience —
            booked online in seconds.
          </p>

          <div
            data-aos="zoom-in"
            data-aos-delay="350"
            className="flex gap-3 mt-6"
          >
            <Link
              to="/book"
              className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-5 py-2 text-sm hover:bg-amber-300 transition"
            >
              Book Now
            </Link>

            <Link
              to="/services"
              className="rounded-lg border border-white/70 text-white font-semibold px-5 py-2 text-sm hover:bg-white/10 transition"
            >
              View Services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
