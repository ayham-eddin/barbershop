import Button from "../../ui/Button";

const DayNavigator = ({
  date,
  onPrev,
  onNext,
  onToday,
  onChange,
}: {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onChange: (newDate: Date) => void;
}) => {
  const ymd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={onPrev}
      >
        ←
      </Button>

      <input
        type="date"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        value={ymd(date)}
        onChange={(e) => {
          const d = e.target.value ? new Date(e.target.value) : new Date();
          onChange(d);
        }}
      />

      <Button
        variant="secondary"
        size="sm"
        onClick={onToday}
      >
        Today
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={onNext}
      >
        →
      </Button>
    </div>
  );
};

export default DayNavigator;
