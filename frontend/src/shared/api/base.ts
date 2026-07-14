/**
 * Base API wrapper that automatically includes credentials (server-owned session cookies).
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: "include", // Crucial for server-owned session cookies
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error: ${response.status}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.detail || errorBody.message || errorMessage;
    } catch {
      // Body might not be JSON
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content or empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
