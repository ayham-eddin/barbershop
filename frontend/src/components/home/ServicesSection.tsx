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

import Section from "../ui/Section";
import Pagination from "../ui/Pagination";
import { useState } from "react";

type Props = {
  role: "user" | "admin" | null;
  perPage?: number; // <= configurable
};

const ServicesSection = ({ role, perPage = 3 }: Props) => {
  const {
    data: services,
    isLoading,
    isError,
  } = useQuery<PublicService[]>({
    queryKey: ["services"],
    queryFn: getServices,
  });

  const [page, setPage] = useState(1);

  const count = services?.length ?? 0;

  const totalPages = Math.ceil(count / perPage);

  const paginated =
    services?.slice((page - 1) * perPage, page * perPage) ?? [];

  return (
    <Section
      id="services"
      className="space-y-6 rounded-2xl bg-neutral-900 border-2 border-amber-500/40 shadow-lg p-6"
      data-aos="fade-up"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-yellow-500">
            Services
          </h2>
          <CountBadge loading={isLoading} count={count} label="items" />
        </div>
      </div>

      {/* LIST */}
      {isLoading && <ListSkeleton />}
      {isError && <ErrorBox text="Couldn’t load services. Please retry." />}

      {services && services.length > 0 && (
        <>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((s) => (
              <ServiceCard key={s._id} service={s} role={role} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
          />
        </>
      )}

      {services && services.length === 0 && (
        <EmptyBox text="No services available yet." />
      )}
    </Section>
  );
};

export default ServicesSection;
