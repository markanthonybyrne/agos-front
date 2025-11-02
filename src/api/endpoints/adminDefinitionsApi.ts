import { apiSlice } from '../apiSlice'
import {
  DefinitionListResponse,
  DefinitionDetailResponse,
  CreateDefinitionRequest,
  CreateDefinitionResponse,
  UpdateDefinitionRequest,
  UpdateDefinitionResponse,
  DeleteDefinitionResponse,
  DefinitionImpactAnalysisRequest,
  DefinitionImpactAnalysisResponse,
  DefinitionHistoryResponse,
  CompareVersionsRequest,
  CompareVersionsResponse,
  RollbackDefinitionRequest,
  RollbackDefinitionResponse,
} from '@/types/api.types'

type DefinitionType = 'facilities' | 'ships' | 'defences' | 'research'

export const adminDefinitionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // List Definitions
    listDefinitions: builder.query<
      DefinitionListResponse,
      { type: DefinitionType; page?: number; per_page?: number }
    >({
      query: ({ type, page, per_page }) => ({
        url: `/admin/definitions/${type}`,
        params: { page, per_page },
      }),
      providesTags: (result, error, { type }) => [{ type: 'Definition', id: type }],
    }),

    // Get Definition
    getDefinition: builder.query<
      DefinitionDetailResponse,
      { type: DefinitionType; id: number }
    >({
      query: ({ type, id }) => `/admin/definitions/${type}/${id}`,
      providesTags: (result, error, { type, id }) => [
        { type: 'Definition', id },
        { type: 'DefinitionVersion', id },
      ],
    }),

    // Create Definition
    createDefinition: builder.mutation<
      CreateDefinitionResponse,
      { type: DefinitionType; data: CreateDefinitionRequest }
    >({
      query: ({ type, data }) => ({
        url: `/admin/definitions/${type}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { type }) => [
        { type: 'Definition', id: type },
        'Definition',
      ],
    }),

    // Update Definition
    updateDefinition: builder.mutation<
      UpdateDefinitionResponse,
      { type: DefinitionType; id: number; data: UpdateDefinitionRequest }
    >({
      query: ({ type, id, data }) => ({
        url: `/admin/definitions/${type}/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { type, id }) => [
        { type: 'Definition', id },
        { type: 'Definition', id: type },
        'Definition',
        { type: 'DefinitionVersion', id },
      ],
    }),

    // Delete Definition
    deleteDefinition: builder.mutation<
      DeleteDefinitionResponse,
      { type: DefinitionType; id: number }
    >({
      query: ({ type, id }) => ({
        url: `/admin/definitions/${type}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { type }) => [
        { type: 'Definition', id: type },
        'Definition',
      ],
    }),

    // Impact Analysis
    getDefinitionImpactAnalysis: builder.mutation<
      DefinitionImpactAnalysisResponse,
      { type: DefinitionType; id: number; data: DefinitionImpactAnalysisRequest }
    >({
      query: ({ type, id, data }) => ({
        url: `/admin/definitions/${type}/${id}/impact-analysis`,
        method: 'POST',
        body: data,
      }),
    }),

    // Version History
    getDefinitionHistory: builder.query<
      DefinitionHistoryResponse,
      { type: DefinitionType; id: number }
    >({
      query: ({ type, id }) => `/admin/definitions/${type}/${id}/history`,
      providesTags: (result, error, { id }) => [{ type: 'DefinitionVersion', id }],
    }),

    // Compare Versions
    compareDefinitionVersions: builder.mutation<
      CompareVersionsResponse,
      { type: DefinitionType; id: number; data: CompareVersionsRequest }
    >({
      query: ({ type, id, data }) => ({
        url: `/admin/definitions/${type}/${id}/compare`,
        method: 'POST',
        body: data,
      }),
    }),

    // Rollback Definition
    rollbackDefinition: builder.mutation<
      RollbackDefinitionResponse,
      { type: DefinitionType; id: number; data: RollbackDefinitionRequest }
    >({
      query: ({ type, id, data }) => ({
        url: `/admin/definitions/${type}/${id}/rollback`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { type, id }) => [
        { type: 'Definition', id },
        { type: 'DefinitionVersion', id },
        'Definition',
      ],
    }),
  }),
})

export const {
  useListDefinitionsQuery,
  useGetDefinitionQuery,
  useCreateDefinitionMutation,
  useUpdateDefinitionMutation,
  useDeleteDefinitionMutation,
  useGetDefinitionImpactAnalysisMutation,
  useGetDefinitionHistoryQuery,
  useCompareDefinitionVersionsMutation,
  useRollbackDefinitionMutation,
} = adminDefinitionsApi

