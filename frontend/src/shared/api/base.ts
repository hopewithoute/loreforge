import createClient from "openapi-fetch";
import type { paths } from "./schema";

/**
 * Type-safe API client generated from the FastAPI OpenAPI schema.
 */
export const client = createClient<paths>({
  baseUrl: "/", // Base URL. The OpenAPI paths already include `/api/` (e.g. /api/assets/)
  credentials: "include", // Crucial for server-owned session cookies
});
