import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../shared/api/base";
import type { Asset } from "../../generator/types";

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      // openapi-fetch automatically sets the proper headers for FormData
      // when passed as the body and the schema expects multipart/form-data
      const { data, error } = await client.POST("/api/assets/", {
        body: formData as never,
      });

      if (error) {
        let msg = "Failed to create asset";
        if (typeof error.detail === "string") {
          msg = error.detail;
        } else if (Array.isArray(error.detail)) {
          msg = error.detail[0]?.msg || msg;
        }
        throw new Error(msg);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["gallery"], (old: Asset[] | undefined) => {
        if (!old) return [data];
        return [data, ...old];
      });
      // Also invalidate the query to ensure we get the real data from the server eventually
      void queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}
