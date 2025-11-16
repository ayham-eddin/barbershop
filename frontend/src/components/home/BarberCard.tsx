import type { Barber } from "../../api/public";

type Props = {
  barber: Barber;
};

export default function BarberCard({ barber }: Props) {
  const initials = barber.name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article className="rounded-2xl bg-white border border-neutral-200 p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-neutral-900 text-white flex items-center justify-center font-semibold">
          {initials}
        </div>
        <div>
          <h3 className="font-medium text-neutral-900">{barber.name}</h3>
          <p className="text-sm text-neutral-600">
            {Array.isArray(barber.workingHours) && barber.workingHours.length
              ? `Mon–Fri ${barber.workingHours[0].start}–${barber.workingHours[0].end}`
              : "Hours not set"}
          </p>
        </div>
      </div>
    </article>
  );
}
