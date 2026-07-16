export const customFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, options);

  const isNoContent = [204, 205, 304].includes(response.status);
  const text = isNoContent ? null : await response.text();
  const data = text ? JSON.parse(text) : undefined;

  const result = { data, status: response.status, headers: response.headers };

  if (!response.ok) {
    const error = new Error("HTTP Error");
    (error as any).response = result;
    throw error;
  }

  return result as unknown as T;
};

export default customFetch;
