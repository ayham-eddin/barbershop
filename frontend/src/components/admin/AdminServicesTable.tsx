import { Section } from "lucide-react";
import Button from "../ui/Button";

export type Service = {
  _id: string;
  name: string;
  durationMin: number;
  price: number;
};

interface AdminServicesTableProps {
  services: Service[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (service: Service) => void;
  onBumpPrice: (service: Service) => void;
  onDPrice: (service: Service) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

const AdminServicesTable = ({
  services,
  isLoading,
  isError,
  onEdit,
  onBumpPrice,
  onDPrice,
  onDelete,
  isUpdating,
  isDeleting,
}: AdminServicesTableProps) => {
  if (isLoading) {
    return (
      <Section className="text-center text-neutral-500 py-12">
        Loading…
      </Section>
    );
  }

  if (isError) {
    return (
      <Section className="text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-lg py-4">
        Failed to load services.
      </Section>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-sm">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-neutral-100 text-neutral-700 uppercase text-xs">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Duration</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s._id} className="border-t border-neutral-100">
              <td className="px-4 py-3">{s.name}</td>
              <td className="px-4 py-3">{s.durationMin} min</td>
              <td className="px-4 py-3">€{s.price}</td>
              <td className="px-4 py-3 space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(s)}
                  className="bg-neutral-200 text-black border border-amber-400 hover:bg-amber-100"
                >
                  Edit
                </Button>
                <Button
                  variant="normal"
                  onClick={() => onBumpPrice(s)}
                  className="border-2 border-green-500 hover:border-green-300 text-neutral-800 hover:bg-neutral-100"
                  disabled={isUpdating}
                  title="+€1"
                >
                  +€1
                </Button>
                <Button
                  variant="normal"
                  onClick={() => onDPrice(s)}
                  className="border-2 border-red-500 hover:border-red-300 text-neutral-800 hover:bg-neutral-100"
                  disabled={isUpdating}
                  title="-€1"
                >
                  -€1
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDelete(s._id)}
                  disabled={isDeleting}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}

          {services.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-8 text-center text-neutral-500"
              >
                No services yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export default AdminServicesTable;