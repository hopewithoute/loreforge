import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A standard utility to extract error messages from unknown errors.
 * This is particularly useful for Axios/Fetch errors where the API returns
 * a structured JSON error body (e.g., FastAPI's HTTPValidationError).
 */
export const extractError = (error: unknown, fallback: string) => {
  const err = error as {
    response?: { data?: { detail?: string | Array<{ msg: string }> } };
    message?: string;
  };
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  return err?.message || fallback;
};

/**
 * Normalizes media paths. If a path is already absolute, it keeps it.
 * If it's a relative path from the backend, it prepends the /media/ endpoint.
 */
export function getMediaUrl(path?: string | null): string {
  if (!path) return "";
  return path.startsWith("/") ? path : `/media/${path}`;
}
