import { useQuery } from '@tanstack/react-query';
import { client } from '../../../shared/api/base';
import { Asset } from '../types';

export function useAssetStatus(assetId: string | null) {
  return useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      if (!assetId) throw new Error("No asset ID");
      
      const { data, error } = await client.GET("/api/assets/{asset_id}", {
        params: {
          path: { asset_id: assetId }
        }
      });
      
      if (error) {
        throw new Error("Failed to fetch asset");
      }
      
      return data as Asset;
    },
    enabled: !!assetId,
    // Polling magic: Refetch every 3 seconds ONLY if the status is still 'pending'
    refetchInterval: (query) => {
      if (!query.state.data) return 3000;
      return query.state.data.status === 'pending' ? 3000 : false;
    },
    // Don't retry on 404s or other hard errors during polling to avoid infinite loops
    retry: (failureCount, error) => {
      return failureCount < 3;
    },
  });
}
