import { useGetAsset } from "@/api/endpoints/assets/assets";

import type { AssetRead } from "@/api/model";

export function useAssetStatus(assetId: string | null) {
  const query = useGetAsset(assetId as string, {
    query: {
      enabled: !!assetId,
      refetchInterval: (query) => {
        const data = query.state?.data?.data as AssetRead | undefined;
        if (!data) return 3000;
        return data.status === "pending" ? 3000 : false;
      },
      retry: (failureCount: number) => {
        return failureCount < 3;
      },
    },
  });

  return {
    ...query,
    data: query.data ? (query.data.data as AssetRead) : undefined,
  };
}
