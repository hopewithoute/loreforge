import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../shared/api/base';
import { Asset } from '../types';

export function useAssetStatus(assetId: string | null) {
  return useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => apiFetch<Asset>(`/api/assets/${assetId}`),
    enabled: !!assetId,
    // Polling magic: Refetch every 3 seconds ONLY if the status is still 'pending'
    refetchInterval: (query) => {
      if (!query.state.data) return 3000; // Keep polling if we haven't received data yet
      return query.state.data.status === 'pending' ? 3000 : false;
    },
    // Don't retry on 404s or other hard errors during polling to avoid infinite loops
    retry: (failureCount, error) => {
      return failureCount < 3;
    },
  });
}
