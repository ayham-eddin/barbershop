import type { AxiosError } from "axios";

export function extractErrorMessage(
  err: unknown,
  fallback = "Request failed",
): string {
  if (typeof err === "string") return err;

  if (err && typeof err === "object") {
    const ax = err as AxiosError<{ error?: string; message?: string }>;
    const msg =
      ax.response?.data?.error ??
      ax.response?.data?.message ??
      (ax.message || fallback);

    return typeof msg === "string" ? msg : fallback;
  }

  return fallback;
}
