/* eslint-disable */
// @ts-nocheck
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  DataTag,
  DefinedInitialDataOptions,
  DefinedUseQueryResult,
  MutationFunction,
  QueryClient,
  QueryFunction,
  QueryKey,
  UndefinedInitialDataOptions,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

import type {
  AssetCreateForm,
  AssetEvolve,
  AssetRead,
  HTTPValidationError,
} from "../../model";

import { customFetch } from "../../mutator/customFetch";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

const withQueryKey = <T extends object, K>(
  query: T,
  queryKey: K,
): T & { queryKey: K } => {
  const result = { queryKey } as T & { queryKey: K };
  for (const key of Object.keys(query)) {
    // The explicit queryKey always wins, matching the previous
    // `{ ...query, queryKey }` spread where it was set last.
    if (key === "queryKey") continue;
    Object.defineProperty(result, key, {
      enumerable: true,
      configurable: true,
      get: () => (query as Record<string, unknown>)[key],
    });
  }
  return result;
};

export type createAssetResponse202 = {
  data: AssetRead;
  status: 202;
};

export type createAssetResponse422 = {
  data: HTTPValidationError;
  status: 422;
};

export type createAssetResponseSuccess = createAssetResponse202 & {
  headers: Headers;
};
export type createAssetResponseError = createAssetResponse422 & {
  headers: Headers;
};

export type createAssetResponse = createAssetResponseSuccess | createAssetResponseError;

export const getCreateAssetUrl = () => {
  return `/api/assets/`;
};

/**
 * @summary Create Asset
 */
export const createAsset = async (
  assetCreateForm: AssetCreateForm,
  options?: RequestInit,
): Promise<createAssetResponse> => {
  const formData = new FormData();
  formData.append(`category`, assetCreateForm.category);
  formData.append(`style`, assetCreateForm.style);
  if (assetCreateForm.prompt !== undefined) {
    formData.append(`prompt`, assetCreateForm.prompt);
  }
  if (
    assetCreateForm.reference_image !== undefined &&
    assetCreateForm.reference_image !== null
  ) {
    formData.append(`reference_image`, assetCreateForm.reference_image);
  }
  if (
    assetCreateForm.existing_reference_id !== undefined &&
    assetCreateForm.existing_reference_id !== null
  ) {
    formData.append(`existing_reference_id`, assetCreateForm.existing_reference_id);
  }
  if (assetCreateForm.sibling_id !== undefined && assetCreateForm.sibling_id !== null) {
    formData.append(`sibling_id`, assetCreateForm.sibling_id);
  }

  return customFetch<createAssetResponse>(getCreateAssetUrl(), {
    ...options,
    method: "POST",
    body: formData,
  });
};

export const getCreateAssetMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createAsset>>,
    TError,
    { data: AssetCreateForm },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof createAsset>>,
  TError,
  { data: AssetCreateForm },
  TContext
> => {
  const mutationKey = ["createAsset"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createAsset>>,
    { data: AssetCreateForm }
  > = (props) => {
    const { data } = props ?? {};

    return createAsset(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type CreateAssetMutationResult = NonNullable<
  Awaited<ReturnType<typeof createAsset>>
>;
export type CreateAssetMutationBody = AssetCreateForm;
export type CreateAssetMutationError = HTTPValidationError;

/**
 * @summary Create Asset
 */
export const useCreateAsset = <TError = HTTPValidationError, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof createAsset>>,
      TError,
      { data: AssetCreateForm },
      TContext
    >;
    request?: SecondParameter<typeof customFetch>;
  },
  queryClient?: QueryClient,
): UseMutationResult<
  Awaited<ReturnType<typeof createAsset>>,
  TError,
  { data: AssetCreateForm },
  TContext
> => {
  return useMutation(getCreateAssetMutationOptions(options), queryClient);
};
export type listAssetsResponse200 = {
  data: AssetRead[];
  status: 200;
};

export type listAssetsResponse422 = {
  data: HTTPValidationError;
  status: 422;
};

export type listAssetsResponseSuccess = listAssetsResponse200 & {
  headers: Headers;
};
export type listAssetsResponseError = listAssetsResponse422 & {
  headers: Headers;
};

export type listAssetsResponse = listAssetsResponseSuccess | listAssetsResponseError;

export const getListAssetsUrl = () => {
  return `/api/assets/`;
};

/**
 * @summary List Assets
 */
export const listAssets = async (options?: RequestInit): Promise<listAssetsResponse> => {
  return customFetch<listAssetsResponse>(getListAssetsUrl(), {
    ...options,
    method: "GET",
  });
};

export const getListAssetsQueryKey = () => {
  return [`/api/assets/`] as const;
};

export const getListAssetsQueryOptions = <
  TData = Awaited<ReturnType<typeof listAssets>>,
  TError = HTTPValidationError,
>(options?: {
  query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listAssets>>, TError, TData>>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getListAssetsQueryKey();

  const queryFn: QueryFunction<Awaited<ReturnType<typeof listAssets>>> = ({ signal }) =>
    listAssets({ signal, ...requestOptions });

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof listAssets>>,
    TError,
    TData
  > & { queryKey: DataTag<QueryKey, TData, TError> };
};

export type ListAssetsQueryResult = NonNullable<Awaited<ReturnType<typeof listAssets>>>;
export type ListAssetsQueryError = HTTPValidationError;

export function useListAssets<
  TData = Awaited<ReturnType<typeof listAssets>>,
  TError = HTTPValidationError,
>(
  options: {
    query: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof listAssets>>, TError, TData>
    > &
      Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAssets>>,
          TError,
          Awaited<ReturnType<typeof listAssets>>
        >,
        "initialData"
      >;
    request?: SecondParameter<typeof customFetch>;
  },
  queryClient?: QueryClient,
): DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };
export function useListAssets<
  TData = Awaited<ReturnType<typeof listAssets>>,
  TError = HTTPValidationError,
>(
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof listAssets>>, TError, TData>
    > &
      Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAssets>>,
          TError,
          Awaited<ReturnType<typeof listAssets>>
        >,
        "initialData"
      >;
    request?: SecondParameter<typeof customFetch>;
  },
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };
export function useListAssets<
  TData = Awaited<ReturnType<typeof listAssets>>,
  TError = HTTPValidationError,
>(
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof listAssets>>, TError, TData>
    >;
    request?: SecondParameter<typeof customFetch>;
  },
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };
/**
 * @summary List Assets
 */

export function useListAssets<
  TData = Awaited<ReturnType<typeof listAssets>>,
  TError = HTTPValidationError,
>(
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof listAssets>>, TError, TData>
    >;
    request?: SecondParameter<typeof customFetch>;
  },
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {
  const queryOptions = getListAssetsQueryOptions(options);

  const query = useQuery(queryOptions, queryClient) as UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
  };

  return withQueryKey(query, queryOptions.queryKey);
}

export type evolveAssetResponse202 = {
  data: AssetRead;
  status: 202;
};

export type evolveAssetResponse422 = {
  data: HTTPValidationError;
  status: 422;
};

export type evolveAssetResponseSuccess = evolveAssetResponse202 & {
  headers: Headers;
};
export type evolveAssetResponseError = evolveAssetResponse422 & {
  headers: Headers;
};

export type evolveAssetResponse = evolveAssetResponseSuccess | evolveAssetResponseError;

export const getEvolveAssetUrl = (assetId: string) => {
  return `/api/assets/${assetId}/evolve`;
};

/**
 * @summary Evolve Asset
 */
export const evolveAsset = async (
  assetId: string,
  assetEvolve: AssetEvolve,
  options?: RequestInit,
): Promise<evolveAssetResponse> => {
  return customFetch<evolveAssetResponse>(getEvolveAssetUrl(assetId), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(assetEvolve),
  });
};

export const getEvolveAssetMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof evolveAsset>>,
    TError,
    { assetId: string; data: AssetEvolve },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof evolveAsset>>,
  TError,
  { assetId: string; data: AssetEvolve },
  TContext
> => {
  const mutationKey = ["evolveAsset"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof evolveAsset>>,
    { assetId: string; data: AssetEvolve }
  > = (props) => {
    const { assetId, data } = props ?? {};

    return evolveAsset(assetId, data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type EvolveAssetMutationResult = NonNullable<
  Awaited<ReturnType<typeof evolveAsset>>
>;
export type EvolveAssetMutationBody = AssetEvolve;
export type EvolveAssetMutationError = HTTPValidationError;

/**
 * @summary Evolve Asset
 */
export const useEvolveAsset = <TError = HTTPValidationError, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof evolveAsset>>,
      TError,
      { assetId: string; data: AssetEvolve },
      TContext
    >;
    request?: SecondParameter<typeof customFetch>;
  },
  queryClient?: QueryClient,
): UseMutationResult<
  Awaited<ReturnType<typeof evolveAsset>>,
  TError,
  { assetId: string; data: AssetEvolve },
  TContext
> => {
  return useMutation(getEvolveAssetMutationOptions(options), queryClient);
};
export type getAssetResponse200 = {
  data: AssetRead;
  status: 200;
};

export type getAssetResponse422 = {
  data: HTTPValidationError;
  status: 422;
};

export type getAssetResponseSuccess = getAssetResponse200 & {
  headers: Headers;
};
export type getAssetResponseError = getAssetResponse422 & {
  headers: Headers;
};

export type getAssetResponse = getAssetResponseSuccess | getAssetResponseError;

export const getGetAssetUrl = (assetId: string) => {
  return `/api/assets/${assetId}`;
};

/**
 * @summary Get Asset
 */
export const getAsset = async (
  assetId: string,
  options?: RequestInit,
): Promise<getAssetResponse> => {
  return customFetch<getAssetResponse>(getGetAssetUrl(assetId), {
    ...options,
    method: "GET",
  });
};

export const getGetAssetQueryKey = (assetId: string) => {
  return [`/api/assets/${assetId}`] as const;
};

export const getGetAssetQueryOptions = <
  TData = Awaited<ReturnType<typeof getAsset>>,
  TError = HTTPValidationError,
>(
  assetId: string,
  options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAsset>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getGetAssetQueryKey(assetId);

  const queryFn: QueryFunction<Awaited<ReturnType<typeof getAsset>>> = ({ signal }) =>
    getAsset(assetId, { signal, ...requestOptions });

  return {
    queryKey,
    queryFn,
    enabled: assetId !== null && assetId !== undefined,
    ...queryOptions,
  } as UseQueryOptions<Awaited<ReturnType<typeof getAsset>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
  };
};

export type GetAssetQueryResult = NonNullable<Awaited<ReturnType<typeof getAsset>>>;
export type GetAssetQueryError = HTTPValidationError;

export function useGetAsset<
  TData = Awaited<ReturnType<typeof getAsset>>,
  TError = HTTPValidationError,
>(
  assetId: string,
  options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAsset>>, TError, TData>> &
      Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getAsset>>,
          TError,
          Awaited<ReturnType<typeof getAsset>>
        >,
        "initialData"
      >;
    request?: SecondParameter<typeof customFetch>;
  },
  queryClient?: QueryClient,
): DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };
export function useGetAsset<
  TData = Awaited<ReturnType<typeof getAsset>>,
  TError = HTTPValidationError,
>(
  assetId: string,
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof getAsset>>, TError, TData>
    > &
      Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getAsset>>,
          TError,
          Awaited<ReturnType<typeof getAsset>>
        >,
        "initialData"
      >;
    request?: SecondParameter<typeof customFetch>;
  },
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };
export function useGetAsset<
  TData = Awaited<ReturnType<typeof getAsset>>,
  TError = HTTPValidationError,
>(
  assetId: string,
  options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAsset>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
  },
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };
/**
 * @summary Get Asset
 */

export function useGetAsset<
  TData = Awaited<ReturnType<typeof getAsset>>,
  TError = HTTPValidationError,
>(
  assetId: string,
  options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAsset>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
  },
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {
  const queryOptions = getGetAssetQueryOptions(assetId, options);

  const query = useQuery(queryOptions, queryClient) as UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
  };

  return withQueryKey(query, queryOptions.queryKey);
}

export type deleteAssetResponse204 = {
  data: void;
  status: 204;
};

export type deleteAssetResponse422 = {
  data: HTTPValidationError;
  status: 422;
};

export type deleteAssetResponseSuccess = deleteAssetResponse204 & {
  headers: Headers;
};
export type deleteAssetResponseError = deleteAssetResponse422 & {
  headers: Headers;
};

export type deleteAssetResponse = deleteAssetResponseSuccess | deleteAssetResponseError;

export const getDeleteAssetUrl = (assetId: string) => {
  return `/api/assets/${assetId}`;
};

/**
 * @summary Delete Asset
 */
export const deleteAsset = async (
  assetId: string,
  options?: RequestInit,
): Promise<deleteAssetResponse> => {
  return customFetch<deleteAssetResponse>(getDeleteAssetUrl(assetId), {
    ...options,
    method: "DELETE",
  });
};

export const getDeleteAssetMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof deleteAsset>>,
    TError,
    { assetId: string },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof deleteAsset>>,
  TError,
  { assetId: string },
  TContext
> => {
  const mutationKey = ["deleteAsset"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof deleteAsset>>,
    { assetId: string }
  > = (props) => {
    const { assetId } = props ?? {};

    return deleteAsset(assetId, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type DeleteAssetMutationResult = NonNullable<
  Awaited<ReturnType<typeof deleteAsset>>
>;

export type DeleteAssetMutationError = HTTPValidationError;

/**
 * @summary Delete Asset
 */
export const useDeleteAsset = <TError = HTTPValidationError, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof deleteAsset>>,
      TError,
      { assetId: string },
      TContext
    >;
    request?: SecondParameter<typeof customFetch>;
  },
  queryClient?: QueryClient,
): UseMutationResult<
  Awaited<ReturnType<typeof deleteAsset>>,
  TError,
  { assetId: string },
  TContext
> => {
  return useMutation(getDeleteAssetMutationOptions(options), queryClient);
};
