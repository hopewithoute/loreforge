import { useQueryClient } from "@tanstack/react-query";
import {
  useRetryAsset as useOrvalRetryAsset,
  getListAssetsQueryKey,
} from "@/api/endpoints/assets/assets";
import type { AssetRead } from "@/api/model";
import { extractError } from "@/lib/utils";

export function useRetryAsset() {
  const queryClient = useQueryClient();

  const mutation = useOrvalRetryAsset({
    mutation: {
      onSuccess: (response) => {
        const data = response.data as AssetRead;
        const queryKey = getListAssetsQueryKey();
        queryClient.setQueryData(queryKey, (old: { data: AssetRead[] } | undefined) => {
          if (!old) return old;
          if (old.data) {
            return {
              ...old,
              data: old.data.map((a: AssetRead) => (a.id === data.id ? data : a)),
            };
          }
          return old;
        });
        void queryClient.invalidateQueries({ queryKey });
      },
      onError: (error: unknown) => {
        throw new Error(extractError(error, "Failed to retry asset"));
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
