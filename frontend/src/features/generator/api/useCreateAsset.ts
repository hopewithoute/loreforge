import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateAsset as useOrvalCreateAsset,
  getListAssetsQueryKey,
} from "@/api/endpoints/assets/assets";
import type { AssetRead, AssetCreateForm } from "@/api/model";
import { extractError } from "@/lib/utils";

export function useCreateAsset() {
  const queryClient = useQueryClient();

  const mutation = useOrvalCreateAsset({
    mutation: {
      onSuccess: (response) => {
        const newAsset = response.data as AssetRead;
        const queryKey = getListAssetsQueryKey();
        queryClient.setQueryData(queryKey, (old: { data: AssetRead[] } | undefined) => {
          if (!old) return { data: [newAsset] };
          if (old.data) return { ...old, data: [newAsset, ...old.data] };
          return old;
        });
        void queryClient.invalidateQueries({ queryKey });
      },
      onError: (error: unknown) => {
        throw new Error(extractError(error, "Failed to create asset"));
      },
    },
  });

  return {
    ...mutation,
    mutate: (
      payload: AssetCreateForm,
      options?: Parameters<typeof mutation.mutate>[1],
    ) => {
      mutation.mutate({ data: payload }, options);
    },
    mutateAsync: (
      payload: AssetCreateForm,
      options?: Parameters<typeof mutation.mutateAsync>[1],
    ) => {
      return mutation.mutateAsync({ data: payload }, options);
    },
  };
}
