import Modal from "../Modal";
import TimeField from "../TimeField";

export type BarberOption = {
  _id: string;
  name: string;
};

type AdminBookingEditModalProps = {
  open: boolean;
  onClose: () => void;

  barbers: BarberOption[];

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
  return (
    <Modal open={open} title="Edit booking" onClose={onClose}>
      <form
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
          Service name
          <input
            type="text"
            value={serviceName}
            onChange={(e) => onChangeServiceName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            required
          />
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

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-neutral-900 text-white px-4 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default AdminBookingEditModal;