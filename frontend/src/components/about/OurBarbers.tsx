import { getBarbers, type Barber } from "../../api/public";
import { useQuery } from "@tanstack/react-query";
import { ListSkeleton, ErrorBox } from "../home/HomeSectionHelpers";
import Section from "../ui/Section";

const OurBarbers = () => {
  const {
    data: barbers,
    isLoading: bLoading,
    isError: bError,
  } = useQuery<Barber[]>({ queryKey: ["barbers"], queryFn: getBarbers });

  return (
    <Section className="space-y-3 text-center rounded-2xl bg-neutral-900 border border-amber-500/40 shadow-lg p-6 sm:flex-row sm:items-center sm:justify-between gap-4" data-aos="fade-up">
      <h2 className="text-2xl font-semibold text-yellow-500">
        Meet Our Barbers
      </h2>

      {bLoading && <ListSkeleton />}
      {bError && <ErrorBox text="Couldn’t load barbers. Please retry." />}

      {barbers && (
        <div className="grid gap-6 sm:grid-cols-3">
          {barbers.map((b, i) => (
            <div
              key={b._id ?? i}
              data-aos="fade-up"
              data-aos-delay={i * 120}
              className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-5 flex flex-col items-center text-center hover:border-amber-400/70 transition"
            >
              <h3 className="text-neutral-900 font-semibold mt-2">{b.name}</h3>
              <p className="text-xs text-neutral-500 mt-1 tracking-wide uppercase">
                Barber
              </p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
};

export default OurBarbers;
