import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../../shared/api/base';

interface CreateAssetResponse {
  asset_id: string;
  status: string;
}

export function useCreateAsset() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      return apiFetch<CreateAssetResponse>('/api/assets', {
        method: 'POST',
        body: formData,
      });
    },
  });
}
