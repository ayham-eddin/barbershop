import StepCard from "./StepCard";

const Steps = () => {
  return (
    <section className="space-y-3 text-center" data-aos="fade-up">
      <h2 className="text-2xl font-semibold text-neutral-900">How It Works</h2>
      <p className="text-neutral-600 text-sm max-w-xl mx-auto">
        Three quick steps to get your next haircut or beard trim booked.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mt-6">
        <StepCard
          number={1}
          title="Pick a Barber"
          text="View availability and choose who you prefer."
        />
        <StepCard
          number={2}
          title="Choose Service"
          text="Haircut, beard trim, or grooming — pick what you need."
        />
        <StepCard
          number={3}
          title="Book Instantly"
          text="Get instant confirmation and manage bookings online."
        />
      </div>
    </section>
  );
};

export default Steps;
