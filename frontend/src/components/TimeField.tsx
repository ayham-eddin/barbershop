// src/components/TimeField.tsx
import { useEffect, useState } from "react";

interface TimeFieldProps {
  value: string; // ISO string or local "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

/**
 * A reusable date+time picker that stores local values but lets you
 * easily convert to ISO for backend use. It normalizes display to local time.
 */
export default function TimeField({
  value,
  onChange,
  label = "Starts at",
  required = false,
}: TimeFieldProps) {
  const [localValue, setLocalValue] = useState("");

  // Convert ISO → local for display
  useEffect(() => {
    if (!value) return;
    const d = new Date(value);
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setLocalValue(local);
  }, [value]);

  return (
    <label className="block text-sm font-medium text-neutral-700">
      {label}
      <input
        type="datetime-local"
        value={localValue}
        required={required}
        onChange={(e) => {
          setLocalValue(e.target.value);
          // Convert local → ISO before sending up
          const iso = e.target.value
            ? new Date(e.target.value).toISOString()
            : "";
          onChange(iso);
        }}
        className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
      />
    </label>
  );
}
