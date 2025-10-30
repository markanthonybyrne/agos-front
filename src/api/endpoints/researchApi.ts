import { apiSlice } from '../apiSlice'
import {
  ApiResponse,
  ResearchDefinition,
  ResearchProgress,
  StartResearchRequest,
} from '@/types/api.types'

export const researchApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getResearchDefinitions: builder.query<{ research: ResearchDefinition[] }, void>({
      query: () => '/research/definitions',
      providesTags: ['Research'],
    }),
    getMyResearch: builder.query<ResearchProgress, void>({
      query: () => '/research/my',
      providesTags: ['Research'],
    }),
    startResearch: builder.mutation<
      ApiResponse<{ research: ResearchDefinition }>,
      StartResearchRequest
    >({
      query: (data) => ({
        url: '/research/start',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Research'],
    }),
    cancelResearch: builder.mutation<
      ApiResponse<{ message: string; refund: { tellerium: number; krypton: number } }>,
      { planetId: number; constructionId: number }
    >({
      query: ({ planetId, constructionId }) => ({
        url: `/planets/${Number(planetId)}/research/${constructionId}/cancel`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { planetId }) => [
        { type: 'Research', id: planetId },
        'Planet',
        'Buildable',
      ],
    }),
  }),
})

export const {
  useGetResearchDefinitionsQuery,
  useGetMyResearchQuery,
  useStartResearchMutation,
  useCancelResearchMutation,
} = researchApi
