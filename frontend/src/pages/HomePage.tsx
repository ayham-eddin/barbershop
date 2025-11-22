import { useEffect, useState } from "react";
import HomeHero from "../components/home/HomeHero";
import ServicesSection from "../components/home/ServicesSection";
import BarbersSection from "../components/home/BarbersSection";

const HomePage = () => {
  const [role, setRole] = useState<"user" | "admin" | null>(null);

  useEffect(() => {
    const readRole = () =>
      (localStorage.getItem("role") as "user" | "admin" | null) || null;

    setRole(readRole());

    const onStorage = () => setRole(readRole());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <div className="space-y-16">
      <HomeHero role={role} />
      <ServicesSection role={role} />
      <BarbersSection />
    </div>
  );
};

export default HomePage;
