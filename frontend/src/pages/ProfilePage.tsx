import type { ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getMe, updateMe, type MeUser, type UpdateMePayload } from "../api/me";
import ProfileForm, {
  type ProfileFormValues,
} from "../components/profile/ProfileForm";
import ProfileSkeleton from "../components/profile/ProfileSkeleton";

export default function ProfilePage() {
  const qc = useQueryClient();

  // load current profile
  const { data, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  const mut = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const patch: UpdateMePayload = {
        name: values.name.trim() || null,
        phone: values.phone.trim() || null,
        address: values.address.trim() || null,
        avatarUrl: values.avatarUrl.trim() || null,
      };
      return updateMe(patch);
    },
    onMutate: async (values) => {
      await qc.cancelQueries({ queryKey: ["me"] });
      const previous = qc.getQueryData<MeUser>(["me"]);

      if (previous) {
        const optimistic: MeUser = {
          ...previous,
          name: values.name.trim() || previous.name,
          phone:
            (values.phone.trim() || previous.phone || "") as string | null,
          address:
            (values.address.trim() || previous.address || "") as
              | string
              | null,
          avatarUrl:
            (values.avatarUrl.trim() || previous.avatarUrl || "") as
              | string
              | null,
        };
        qc.setQueryData(["me"], optimistic);
      }

      return { previous };
    },
    onSuccess: () => {
      toast.success("Profile updated.");
      qc.invalidateQueries({ queryKey: ["me"] }).catch(() => {});
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["me"], ctx.previous);
      toast.error("Could not update profile.");
    },
  });

  const initialValues: ProfileFormValues | null = data
    ? {
        name: data.name ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        avatarUrl: data.avatarUrl ?? "",
      }
    : null;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">My Profile</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Update your personal information.
        </p>
      </header>

      {isLoading && <ProfileSkeleton />}

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
          Couldn’t load your profile.
        </div>
      )}

      {data && initialValues && (
        <div className="rounded-2xl bg-white border border-neutral-200 p-6 shadow-sm">
          <ProfileForm
            initialValues={initialValues}
            isSubmitting={mut.isPending}
            onSubmit={(values) => mut.mutate(values)}
          />

          {/* read-only bits */}
          <div className="mt-6 grid sm:grid-cols-3 gap-4 text-sm">
            <Info label="Email" value={data.email} />
            <Info label="Role" value={data.role} />
            <BookingStatus
              isBlocked={data.is_online_booking_blocked}
              warningCount={data.warning_count}
              blockReason={data.block_reason}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function BookingStatus(props: {
  isBlocked: boolean;
  warningCount: number;
  blockReason: string | null;
}) {
  const { isBlocked, warningCount, blockReason } = props;

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
