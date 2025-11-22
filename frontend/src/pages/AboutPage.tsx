// src/pages/AboutPage.tsx
import Hero from "../components/about/Hero";
import Steps from "../components/about/Steps";
import OpeningHours from "../components/about/OpeningHours";
import InfoCard from "../components/about/InfoCard";
import CTASection from "../components/about/CTASection";
import OurStory from "../components/about/OurStory";
import OurBarbers from "../components/about/OurBarbers";

const AboutPage = () => {
  return (
    <div className="space-y-20">
      <Hero />
      <Steps />
      <OurStory />
      <OurBarbers />
      <div className="grid gap-6 md:grid-cols-2">
        <OpeningHours />
        <InfoCard />
      </div>
      <CTASection />
    </div>
  );
};

export default AboutPage;
