import { useQuery } from "@tanstack/react-query";
import { getBarbers, type Barber } from "../../api/public";
import BarberCard from "./BarberCard";
import {
  CountBadge,
  ListSkeleton,
  ErrorBox,
  EmptyBox,
} from "./HomeSectionHelpers";
import SectionCard from "../ui/SectionCard";

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
    <section id="barbers" className="space-y-5" data-aos="fade-up">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-yellow-500">
            Barbers
          </h2>
          <CountBadge loading={isLoading} count={count} label="profiles" />
        </div>
      </div>

      {isLoading && <ListSkeleton />}
      {isError && (
        <ErrorBox text="Couldn’t load barbers. Please retry." />
      )}

      {barbers && barbers.length > 0 && (
        <SectionCard className="border border-white shadow-none p-0 bg-transparent bg-gradient-to-r from-black/100 via-black/90 to-black/80">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {barbers.map((b) => (
              <BarberCard key={b._id} barber={b} />
            ))}
          </div>
        </SectionCard>
      )}

      {barbers && barbers.length === 0 && (
        <EmptyBox text="No barbers available yet." />
      )}
    </section>
  );
};

export default BarbersSection;
