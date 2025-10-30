import { apiSlice } from '../apiSlice'
import {
  ApiResponse,
  DefenceDefinition,
  Defence,
  BuildDefenceRequest,
} from '@/types/api.types'

export const defencesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDefenceDefinitions: builder.query<{ defences: DefenceDefinition[] }, void>({
      query: () => '/defences/definitions',
      providesTags: ['Defence'],
    }),
    getPlanetDefences: builder.query<{ defences: Defence[] }, number>({
      query: (planetId) => `/planets/${Number(planetId)}/defences`,
      providesTags: (result, error, planetId) => [
        { type: 'Defence', id: planetId },
      ],
    }),
    buildDefences: builder.mutation<
      ApiResponse<{ defence: Defence }>,
      { planetId: number; data: BuildDefenceRequest }
    >({
      query: ({ planetId, data }) => ({
        url: `/planets/${Number(planetId)}/defences`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { planetId }) => [
        { type: 'Defence', id: planetId },
        'Planet',
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
      invalidatesTags: ['Defence', 'Planet'],
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
        'Planet',
        'Buildable',
      ],
    }),
  }),
})

export const {
  useGetDefenceDefinitionsQuery,
  useGetPlanetDefencesQuery,
  useBuildDefencesMutation,
  useDestroyDefencesMutation,
  useCancelDefenceConstructionMutation,
} = defencesApi
