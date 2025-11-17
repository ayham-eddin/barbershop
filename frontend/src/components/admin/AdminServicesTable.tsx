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
  onDelete,
  isUpdating,
  isDeleting,
}: AdminServicesTableProps) => {
  if (isLoading) {
    return (
      <div className="text-center text-neutral-500 py-12">
        Loading…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-lg py-4">
        Failed to load services.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
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
                <button
                  onClick={() => onEdit(s)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => onBumpPrice(s)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
                  disabled={isUpdating}
                  title="+€1"
                >
                  +€1
                </button>
                <button
                  onClick={() => onDelete(s._id)}
                  className="rounded-md border border-rose-300 text-rose-700 px-3 py-1.5 hover:bg-rose-50"
                  disabled={isDeleting}
                >
                  Delete
                </button>
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