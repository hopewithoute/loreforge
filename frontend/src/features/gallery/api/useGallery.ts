import { useListAssets } from "@/api/endpoints/assets/assets";

import type { AssetRead } from "@/api/model";

export function useGallery() {
  const query = useListAssets();
  return {
    ...query,
    data: query.data ? (query.data.data as AssetRead[]) : undefined,
  };
}
