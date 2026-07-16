import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteAsset as useOrvalDeleteAsset,
  getListAssetsQueryKey,
} from "@/api/endpoints/assets/assets";
import type { AssetRead } from "@/api/model";
import { extractError } from "@/lib/utils";

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  const mutation = useOrvalDeleteAsset({
    mutation: {
      onSuccess: (_, variables) => {
        const queryKey = getListAssetsQueryKey();
        queryClient.setQueryData(queryKey, (old: { data: AssetRead[] } | undefined) => {
          if (!old) return old;
          if (old.data) {
            return {
              ...old,
              data: old.data.filter((a: AssetRead) => a.id !== variables.assetId),
            };
          }
          return old;
        });
        void queryClient.invalidateQueries({ queryKey });
      },
      onError: (error: unknown) => {
        throw new Error(extractError(error, "Failed to delete asset"));
      },
    },
  });

  return {
    ...mutation,
    mutate: (
      { assetId }: { assetId: string },
      options?: Parameters<typeof mutation.mutate>[1],
    ) => mutation.mutate({ assetId }, options),
    mutateAsync: (
      { assetId }: { assetId: string },
      options?: Parameters<typeof mutation.mutateAsync>[1],
    ) => mutation.mutateAsync({ assetId }, options),
  };
}
