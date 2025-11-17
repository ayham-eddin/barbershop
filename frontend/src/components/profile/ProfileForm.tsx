import { useEffect, useState } from "react";

export type ProfileFormValues = {
  name: string;
  phone: string;
  address: string;
  avatarUrl: string;
};

type ProfileFormProps = {
  initialValues: ProfileFormValues;
  isSubmitting: boolean;
  onSubmit: (values: ProfileFormValues) => void;
};

type Errors = Partial<Record<keyof ProfileFormValues, string>>;

const ProfileForm = ({
  initialValues,
  isSubmitting,
  onSubmit,
}: ProfileFormProps) => {
  const [values, setValues] = useState<ProfileFormValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});

  // re-hydrate when user data changes
  useEffect(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  const setField =
    (field: keyof ProfileFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setValues((v) => ({ ...v, [field]: next }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const validate = (v: ProfileFormValues): Errors => {
    const next: Errors = {};
    const trimmedName = v.name.trim();
    const trimmedPhone = v.phone.trim();
    const trimmedAvatar = v.avatarUrl.trim();

    if (trimmedName && trimmedName.length < 2) {
      next.name = "Name must be at least 2 characters.";
    }

    if (trimmedPhone && !/^\+?[0-9\s\-()]{6,}$/.test(trimmedPhone)) {
      next.phone = "Enter a valid phone number.";
    }

    if (trimmedAvatar && !/^https?:\/\//i.test(trimmedAvatar)) {
      next.avatarUrl = "Avatar URL must start with http:// or https://";
    }

    return next;
  };

  // simple dirty check (trimmed comparison)
  const isDirty =
    values.name.trim() !== (initialValues.name ?? "").trim() ||
    values.phone.trim() !== (initialValues.phone ?? "").trim() ||
    values.address.trim() !== (initialValues.address ?? "").trim() ||
    values.avatarUrl.trim() !== (initialValues.avatarUrl ?? "").trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDirty) {
      // nothing changed -> no request
      return;
    }

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    onSubmit({
      name: values.name.trim(),
      phone: values.phone.trim(),
      address: values.address.trim(),
      avatarUrl: values.avatarUrl.trim(),
    });
  };

  const showAvatarPreview =
    values.avatarUrl.trim() &&
    /^https?:\/\//i.test(values.avatarUrl.trim());

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      {/* Name */}
      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Name</span>
        <input
          type="text"
          value={values.name}
          onChange={setField("name")}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
          placeholder="Your name"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-rose-600">{errors.name}</p>
        )}
      </label>

      {/* Phone */}
      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Phone</span>
        <input
          type="text"
          value={values.phone}
          onChange={setField("phone")}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
          placeholder="+49 …"
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>
        )}
      </label>

      {/* Address */}
      <label className="block sm:col-span-2">
        <span className="text-sm font-medium text-neutral-700">Address</span>
        <input
          type="text"
          value={values.address}
          onChange={setField("address")}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
          placeholder="Street, City"
        />
      </label>

      {/* Avatar URL */}
      <label className="block sm:col-span-2">
        <span className="text-sm font-medium text-neutral-700">
          Avatar URL
        </span>
        <input
          type="url"
          value={values.avatarUrl}
          onChange={setField("avatarUrl")}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
          placeholder="https://…"
        />
        {errors.avatarUrl && (
          <p className="mt-1 text-xs text-rose-600">{errors.avatarUrl}</p>
        )}
      </label>

      {/* Avatar preview */}
      {showAvatarPreview && (
        <div className="sm:col-span-2">
          <span className="text-xs uppercase tracking-wide text-neutral-500">
            Preview
          </span>
          <div className="mt-2 flex items-center gap-3">
            <img
              src={values.avatarUrl}
              alt="Avatar preview"
              className="h-16 w-16 rounded-full border border-neutral-200 object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="text-xs text-neutral-500">
              If the image doesn’t load, check the URL.
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="sm:col-span-2 flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
        <span className="text-xs text-neutral-500">
          {isSubmitting
            ? "Saving your changes…"
            : isDirty
            ? "Changes apply immediately."
            : "No changes to save."}
        </span>
      </div>
    </form>
  );
}
export default ProfileForm;