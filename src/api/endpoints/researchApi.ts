import { apiSlice } from '../apiSlice'
import {
  ApiResponse,
  ResearchDefinition,
  ResearchProgress,
  StartResearchRequest,
  PlanetResearchItem,
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
    getPlanetAvailableResearch: builder.query<{ research: PlanetResearchItem[] }, number>({
      query: (planetId) => `/planets/${planetId}/research/available`,
      providesTags: (result, error, planetId) => [
        { type: 'Research', id: planetId },
        'Planet',
      ],
    }),
    startResearch: builder.mutation<
      ApiResponse<{ research: ResearchDefinition }>,
      StartResearchRequest
    >({
      query: (data) => ({
        url: `/planets/${data.planet_id}/research/start`,
        method: 'POST',
        body: { research_slug: data.research_slug },
      }),
      invalidatesTags: (result, error, { planet_id }) => [
        'Research',
        'Empire',
        'Universe',
        'Planet',
        { type: 'Research', id: planet_id },
        { type: 'ConstructionQueue', id: planet_id },
        { type: 'Resource', id: planet_id },
        'Buildable',
        'ConstructionQueue', // Invalidate for real-time queue updates
        'Resource', // Invalidate for resource balance updates
      ],
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
        { type: 'ConstructionQueue', id: planetId },
        { type: 'Resource', id: planetId },
        'Planet',
        'Buildable',
        'ConstructionQueue', // Invalidate for real-time queue updates
        'Resource', // Invalidate for resource balance updates
      ],
    }),
  }),
})

export const {
  useGetResearchDefinitionsQuery,
  useGetMyResearchQuery,
  useGetPlanetAvailableResearchQuery,
  useStartResearchMutation,
  useCancelResearchMutation,
} = researchApi
