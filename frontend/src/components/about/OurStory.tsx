import { Scissors, Users, Clock, HeartHandshake } from "lucide-react";

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
    <section className="space-y-4" data-aos="fade-up">
      <h2 className="text-2xl font-semibold text-neutral-900">Our Story</h2>
      <p className="text-neutral-600 max-w-xl">
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
    </section>
  );
};

export default OurStory;
