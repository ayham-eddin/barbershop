import { Scissors, Users, Clock, HeartHandshake } from "lucide-react";
import Section from "../ui/Section";

const items = [
  {
    icon: Scissors,
    title: "Craftsmanship",
    text: "Every cut is treated with precision and attention to detail.",
  },
  {
    icon: Users,
    title: "Community",
    text: "We’re more than a barbershop — we’re part of your neighborhood.",
  },
  {
    icon: Clock,
    title: "Convenience",
    text: "Book anytime, manage appointments easily, avoid long waits.",
  },
  {
    icon: HeartHandshake,
    title: "Trust",
    text: "Built on genuine relationships and consistent results.",
  },
];

const OurStory = () => {
  return (
    <Section className="space-y-3 text-center rounded-2xl bg-neutral-900 border border-amber-500/40 shadow-lg p-6 sm:flex-row sm:items-center sm:justify-between gap-4" data-aos="fade-up">
      <h2 className="text-2xl font-semibold text-white">Our Story</h2>
      <p className="text-neutral-600 text-white text-sm max-w-xl mx-auto">
        We started with a simple idea: keep the classic barbershop feeling, but
        make booking as seamless as the cut.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {items.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            data-aos="fade-up"
            className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-5 hover:border-amber-400/70 transition"
          >
            <Icon className="w-6 h-6 text-neutral-900 mb-2" />
            <h3 className="font-semibold text-neutral-900">{title}</h3>
            <p className="text-sm text-neutral-600 mt-1">{text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default OurStory;
