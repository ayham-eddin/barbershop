import { useQuery } from "@tanstack/react-query";
import {
  getServices,
  type Service as PublicService,
} from "../../api/public";
import ServiceCard from "./ServiceCard";
import {
  CountBadge,
  ListSkeleton,
  ErrorBox,
  EmptyBox,
} from "./HomeSectionHelpers";
import SectionCard from "../ui/SectionCard";

type Props = {
  role: "user" | "admin" | null;
};

const ServicesSection = ({ role }: Props) => {
  const {
    data: services,
    isLoading,
    isError,
  } = useQuery<PublicService[]>({
    queryKey: ["services"],
    queryFn: getServices,
  });

  const count = services?.length ?? 0;

  return (
    <section id="services" className="space-y-5" data-aos="fade-up">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-yellow-500">
            Services
          </h2>
          <CountBadge loading={isLoading} count={count} label="items" />
        </div>
      </div>

      {isLoading && <ListSkeleton />}
      {isError && (
        <ErrorBox text="Couldn’t load services. Please retry." />
      )}

      {services && services.length > 0 && (
        <SectionCard className="border border-white shadow-none p-0 bg-gradient-to-r from-black/100 via-black/90 to-black/80">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s._id} service={s} role={role} />
            ))}
          </div>
        </SectionCard>
      )}

      {services && services.length === 0 && (
        <EmptyBox text="No services available yet." />
      )}
    </section>
  );
};

export default ServicesSection;
