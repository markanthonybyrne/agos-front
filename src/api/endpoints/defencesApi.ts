import { apiSlice } from '../apiSlice'
import {
  ApiResponse,
  DefenceDefinition,
  Defence,
  BuildDefenceRequest,
  AvailableDefencesResponse,
  DefenceConstructionResponse,
} from '@/types/api.types'

export const defencesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDefenceDefinitions: builder.query<
      { defences: DefenceDefinition[] },
      { era?: number; specialization?: string } | void
    >({
      query: (params) => ({
        url: '/defences/definitions',
        params: params ? { era: params.era, specialization: params.specialization } : {},
      }),
      providesTags: ['Defence'],
    }),
    getPlanetDefences: builder.query<{ defences: Defence[] }, number>({
      query: (planetId) => `/planets/${Number(planetId)}/defences`,
      providesTags: (result, error, planetId) => [
        { type: 'Defence', id: planetId },
      ],
    }),
    getAvailableDefences: builder.query<AvailableDefencesResponse, number>({
      query: (planetId) => ({
        url: '/defences/available',
        params: { planet_id: Number(planetId) },
      }),
      providesTags: (result, error, planetId) => [
        { type: 'Defence', id: planetId },
        'Buildable',
      ],
    }),
    buildDefences: builder.mutation<
      DefenceConstructionResponse,
      { planetId: number; data: BuildDefenceRequest }
    >({
      query: ({ planetId, data }) => ({
        url: `/planets/${Number(planetId)}/defences`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { planetId }) => [
        { type: 'Defence', id: planetId },
        { type: 'ConstructionQueue', id: planetId },
        { type: 'Resource', id: planetId },
        'Planet',
        'Buildable', // Invalidate buildable items so new defences become available
        'ConstructionQueue', // Invalidate for real-time queue updates
        'Resource', // Invalidate for resource balance updates
      ],
    }),
    destroyDefences: builder.mutation<
      ApiResponse<{ message: string }>,
      { id: number; quantity?: number }
    >({
      query: ({ id, quantity }) => ({
        url: `/defences/${id}`,
        method: 'DELETE',
        body: quantity ? { quantity } : {},
      }),
      invalidatesTags: ['Defence', 'Planet', 'Buildable', 'ConstructionQueue', 'Resource'],
    }),
    cancelDefenceConstruction: builder.mutation<
      ApiResponse<{ message: string; refund: { tellerium: number; krypton: number } }>,
      { planetId: number; constructionId: number }
    >({
      query: ({ planetId, constructionId }) => ({
        url: `/planets/${Number(planetId)}/defences/${constructionId}/cancel`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { planetId }) => [
        { type: 'Defence', id: planetId },
        { type: 'ConstructionQueue', id: planetId },
        { type: 'Resource', id: planetId },
        'Planet',
        'Buildable',
        'ConstructionQueue',
        'Resource',
      ],
    }),
  }),
})

export const {
  useGetDefenceDefinitionsQuery,
  useGetPlanetDefencesQuery,
  useGetAvailableDefencesQuery,
  useBuildDefencesMutation,
  useDestroyDefencesMutation,
  useCancelDefenceConstructionMutation,
} = defencesApi
