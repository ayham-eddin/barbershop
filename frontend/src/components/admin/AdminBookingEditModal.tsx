import Modal from "../Modal";
import TimeField from "../TimeField";
import Button from "../ui/Button";

export type BarberOption = {
  _id: string;
  name: string;
};

export type ServiceOption = {
  _id: string;
  name: string;
  durationMin: number;
};

type AdminBookingEditModalProps = {
  open: boolean;
  onClose: () => void;

  barbers: BarberOption[];
  services: ServiceOption[];

  startsAtLocal: string;
  onChangeStartsAtLocal: (value: string) => void;

  durationMin: number;
  onChangeDurationMin: (value: number) => void;

  barberId: string;
  onChangeBarberId: (value: string) => void;

  serviceName: string;
  onChangeServiceName: (value: string) => void;

  notes: string;
  onChangeNotes: (value: string) => void;

  onSubmit: () => void;
  isSubmitting: boolean;
};

const AdminBookingEditModal = ({
  open,
  onClose,
  barbers,
  services,
  startsAtLocal,
  onChangeStartsAtLocal,
  durationMin,
  onChangeDurationMin,
  barberId,
  onChangeBarberId,
  serviceName,
  onChangeServiceName,
  notes,
  onChangeNotes,
  onSubmit,
  isSubmitting,
}: AdminBookingEditModalProps) => {
  const handleServiceChange = (value: string) => {
    onChangeServiceName(value);
    const svc = services.find((s) => s.name === value);
    if (svc && typeof svc.durationMin === "number") {
      onChangeDurationMin(svc.durationMin);
    }
  };

  const hasCurrentInOptions = services.some((s) => s.name === serviceName);

  return (
    <Modal
      open={open}
      title="Edit booking"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2 pt-2">
          <Button
            onClick={onClose}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-admin-booking-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      }
    >
      <form
        id="edit-admin-booking-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-3"
      >
        <TimeField
          value={startsAtLocal}
          onChange={(iso) => onChangeStartsAtLocal(iso)}
          label="Starts at"
          required
        />

        <label className="block text-sm font-medium text-neutral-700">
          Duration (min)
          <input
            type="number"
            min={5}
            max={480}
            value={durationMin}
            onChange={(e) => onChangeDurationMin(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            required
          />
        </label>

        <label className="block text-sm font-medium text-neutral-700">
          Barber
          <select
            value={barberId}
            onChange={(e) => onChangeBarberId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            required
          >
            <option value="" disabled>
              Select barber…
            </option>
            {barbers.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-neutral-700">
          Service
          <select
            value={serviceName || ""}
            onChange={(e) => handleServiceChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
          >
            {/* Placeholder if nothing selected yet */}
            {!serviceName && (
              <option value="" disabled>
                Select service…
              </option>
            )}
            {services.map((s) => (
              <option key={s._id} value={s.name}>
                {s.name}
              </option>
            ))}
            {/* Fallback option when the booking has a name not in the current services list */}
            {serviceName && !hasCurrentInOptions && (
              <option value={serviceName}>{serviceName} (current)</option>
            )}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Changing the service will also update the duration to the default
            for that service.
          </p>
        </label>

        <label className="block text-sm font-medium text-neutral-700">
          Notes (optional)
          <input
            type="text"
            value={notes}
            onChange={(e) => onChangeNotes(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            placeholder="Optional note for this booking"
          />
        </label>
      </form>
    </Modal>
  );
};

export default AdminBookingEditModal;
