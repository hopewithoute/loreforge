import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../shared/api/base";
import type { Asset } from "../../generator/types";

export function useRetryAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ asset_id }: { asset_id: string }) => {
      const { data, error } = await client.POST("/api/assets/{asset_id}/retry", {
        params: {
          path: { asset_id },
        },
      });

      if (error) {
        let msg = "Failed to retry asset";
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
      // Optimistically update the gallery to reflect the pending status
      queryClient.setQueryData(["gallery"], (old: Asset[] | undefined) => {
        if (!old) return old;
        return old.map((asset) => (asset.id === data.id ? data : asset));
      });
      void queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}
