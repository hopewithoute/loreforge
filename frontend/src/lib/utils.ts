import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ERROR_MAPPING: Record<string, string> = {
  INTERNAL_ERROR: "An unexpected internal server error occurred.",
  INVALID_FILE_TYPE: "Unsupported file format. Please upload a PNG or JPG image.",
  UPLOAD_TOO_LARGE:
    "The uploaded image is too large. Please upload an image smaller than 4MB.",
  AI_TIMEOUT: "The AI provider took too long to respond. Please try again.",
  BROKEN_RESPONSE: "Received an invalid response from the AI provider.",
  PROVIDER_CONFIG_ERROR: "The AI provider is misconfigured. Please contact support.",
  RATE_LIMITED: "You have requested too many generations. Please wait a moment.",
  PROVIDER_UNAVAILABLE: "The AI provider is currently offline or unavailable.",
  INVALID_PROMPT: "Your prompt violates safety guidelines or is otherwise invalid.",
};

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
  if (typeof detail === "string") return ERROR_MAPPING[detail] || detail;
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
