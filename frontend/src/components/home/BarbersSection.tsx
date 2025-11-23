import { useQuery } from "@tanstack/react-query";
import { getBarbers, type Barber } from "../../api/public";
import BarberCard from "./BarberCard";
import {
  CountBadge,
  ListSkeleton,
  ErrorBox,
  EmptyBox,
} from "./HomeSectionHelpers";
import Section from "../ui/Section";

const BarbersSection = () => {
  const {
    data: barbers,
    isLoading,
    isError,
  } = useQuery<Barber[]>({
    queryKey: ["barbers"],
    queryFn: getBarbers,
  });

  const count = barbers?.length ?? 0;

  return (
    <Section
      id="barbers"
      className="space-y-3 rounded-2xl bg-neutral-900 border-2 border-amber-500/40 shadow-lg p-6 sm:flex-row sm:items-center sm:justify-between gap-4"
      data-aos="fade-up"
    >
      {" "}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-yellow-500">Barbers</h2>
          <CountBadge loading={isLoading} count={count} label="profiles" />
        </div>
      </div>
      {isLoading && <ListSkeleton />}
      {isError && <ErrorBox text="Couldn’t load barbers. Please retry." />}
      {barbers && barbers.length > 0 && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {barbers.map((b) => (
            <BarberCard key={b._id} barber={b} />
          ))}
        </div>
      )}
      {barbers && barbers.length === 0 && (
        <EmptyBox text="No barbers available yet." />
      )}
    </Section>
  );
};

export default BarbersSection;
