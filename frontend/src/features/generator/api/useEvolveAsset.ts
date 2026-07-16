import { useQueryClient } from "@tanstack/react-query";
import {
  useEvolveAsset as useOrvalEvolveAsset,
  getListAssetsQueryKey,
} from "@/api/endpoints/assets/assets";
import type { AssetCategory, AssetStyle } from "@/api/model";
import { extractError } from "@/lib/utils";

export interface EvolveAssetPayload {
  prompt: string;
  category: AssetCategory;
  style: AssetStyle;
}

export function useEvolveAsset() {
  const queryClient = useQueryClient();

  const mutation = useOrvalEvolveAsset({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: getListAssetsQueryKey(),
        });
      },
      onError: (error: unknown) => {
        throw new Error(extractError(error, "Failed to evolve asset"));
      },
    },
  });

  return {
    ...mutation,
    mutate: (
      { parentId, payload }: { parentId: string; payload: EvolveAssetPayload },
      options?: Parameters<typeof mutation.mutate>[1],
    ) => mutation.mutate({ assetId: parentId, data: payload }, options),
    mutateAsync: (
      { parentId, payload }: { parentId: string; payload: EvolveAssetPayload },
      options?: Parameters<typeof mutation.mutateAsync>[1],
    ) => mutation.mutateAsync({ assetId: parentId, data: payload }, options),
  };
}
