import Section from "../components/ui/Section";
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
      <Section className="grid gap-6 md:grid-cols-2 space-y-3 text-center rounded-2xl bg-neutral-900 border border-amber-500/40 shadow-lg p-6 sm:flex-row sm:items-center sm:justify-between gap-4" data-aos="fade-up">
        <OpeningHours />
        <InfoCard />
      </Section>
      <CTASection />
    </div>
  );
};

export default AboutPage;
