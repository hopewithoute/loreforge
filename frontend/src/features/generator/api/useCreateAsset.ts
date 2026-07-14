import { useMutation } from '@tanstack/react-query';
import { client } from '../../../shared/api/base';
import { Asset } from '../types';

export function useCreateAsset() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      // openapi-fetch automatically sets the proper headers for FormData
      // when passed as the body and the schema expects multipart/form-data
      const { data, error } = await client.POST("/api/assets/", {
        body: formData as any,
      });

      if (error) {
        throw new Error("Failed to create asset");
      }
      
      return data as Asset;
    },
  });
}
