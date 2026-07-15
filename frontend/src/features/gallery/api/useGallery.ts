import { useQuery } from "@tanstack/react-query";
import { client } from "../../../shared/api/base";

export function useGallery() {
  return useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/assets/", {});

      if (error) {
        throw new Error("Failed to fetch gallery");
      }

      return data;
    },
  });
}
