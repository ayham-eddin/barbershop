import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../ui/Button";
import Section from "../ui/Section";
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
    <Section
      className="relative rounded-3xl overflow-hidden shadow-xl border-2 border-amber-500/40"
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
            <Button className="bg-yellow-500 font-semibold" variant="secondary" asChild>
              <Link to="/book">Book Now</Link>
            </Button>
            <Button className="border border-yellow-500/70 font-semibold text-white hover:bg-yellow-500/50 hover:text-black" variant="secondary" asChild>
              <Link to="/services">View Services</Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Hero;
