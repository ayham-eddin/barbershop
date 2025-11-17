import { Link } from "react-router-dom";
import type { Service } from "../../api/public";

type Props = {
  service: Service;
  role: "user" | "admin" | null;
};

const ServiceCard = ({ service, role }: Props) => {
  const isAdmin = role === "admin";

  return (
    <article className="group relative rounded-2xl bg-white border border-neutral-200 p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-medium text-neutral-900">{service.name}</h3>
        <span className="rounded-full bg-amber-100 text-amber-900 text-xs px-3 py-1 font-semibold">
          €{service.price}
        </span>
      </div>

      <p className="text-sm text-neutral-600 mt-1">
        {service.durationMin} min
      </p>

      {!isAdmin ? (
        <Link
          to="/book"
          className="mt-4 inline-flex items-center rounded-lg bg-neutral-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-800 transition"
        >
          Book
        </Link>
      ) : (
        <Link
          to="/admin/services"
          className="mt-4 inline-flex items-center rounded-lg bg-neutral-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-800 transition"
        >
          Manage
        </Link>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-neutral-200" />
    </article>
  );
}
export default ServiceCard;