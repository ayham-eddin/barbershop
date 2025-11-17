import type { ReactNode } from "react";

type ProfileInfoItemProps = {
  label: string;
  value: ReactNode;
};

export const ProfileInfoItem = ({ label, value }: ProfileInfoItemProps) => {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

type ProfileBookingStatusProps = {
  isBlocked: boolean;
  warningCount: number;
  blockReason: string | null;
};

export const ProfileBookingStatus = ({
  isBlocked,
  warningCount,
  blockReason,
}: ProfileBookingStatusProps) => {
  const badgeClasses = isBlocked
    ? "bg-rose-100 text-rose-800 border-rose-200"
    : "bg-emerald-100 text-emerald-800 border-emerald-200";

  const warningText =
    warningCount === 0
      ? "No warnings on your account."
      : warningCount === 1
      ? "1 warning on your account."
      : `${warningCount} warnings on your account.`;

  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">
        Booking status
      </dt>
      <dd className="mt-1 flex flex-col gap-1">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClasses}`}
        >
          {isBlocked ? "Blocked" : "OK"}
        </span>
        <span className="text-xs text-neutral-500">{warningText}</span>
        {blockReason && (
          <span className="text-xs text-neutral-600">
            Reason: {blockReason}
          </span>
        )}
      </dd>
    </div>
  );
}
