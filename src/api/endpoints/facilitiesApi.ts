import { apiSlice } from '../apiSlice'
import {
  ApiResponse,
  FacilityDefinition,
  Facility,
  BuildFacilityRequest,
} from '@/types/api.types'

export const facilitiesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFacilityDefinitions: builder.query<{ facilities: FacilityDefinition[] }, void>({
      query: () => '/facilities/definitions',
      providesTags: ['Facility'],
    }),
    getPlanetFacilities: builder.query<{ facilities: Facility[] }, number>({
      query: (planetId) => `/planets/${Number(planetId)}/facilities`,
      providesTags: (result, error, planetId) => [
        { type: 'Facility', id: planetId },
      ],
    }),
    buildFacility: builder.mutation<
      ApiResponse<{ facility: Facility }>,
      { planetId: number; data: BuildFacilityRequest }
    >({
      query: ({ planetId, data }) => ({
        url: `/planets/${Number(planetId)}/facilities`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { planetId }) => [
        { type: 'Facility', id: planetId },
        { type: 'ConstructionQueue', id: planetId },
        { type: 'Resource', id: planetId },
        'Planet',
        'Buildable', // Invalidate buildable items so new facilities become available
        'ConstructionQueue', // Invalidate for real-time queue updates
        'Resource', // Invalidate for resource balance updates
      ],
    }),
    upgradeFacility: builder.mutation<
      ApiResponse<{ facility: Facility }>,
      number
    >({
      query: (facilityId) => ({
        url: `/facilities/${facilityId}/upgrade`,
        method: 'PUT',
      }),
      invalidatesTags: ['Facility', 'Planet', 'Buildable', 'ConstructionQueue', 'Resource'],
    }),
    upgradeFacilityBySlug: builder.mutation<
      ApiResponse<{ facility: Facility }>,
      { planetId: number; facilitySlug: string }
    >({
      query: ({ planetId, facilitySlug }) => ({
        url: `/facilities/${facilitySlug}/upgrade`,
        method: 'PUT',
        body: { planet_id: Number(planetId) },
      }),
      invalidatesTags: (result, error, { planetId }) => [
        { type: 'Facility', id: planetId },
        { type: 'ConstructionQueue', id: planetId },
        { type: 'Resource', id: planetId },
        'Facility',
        'Planet',
        'Buildable',
        'ConstructionQueue',
        'Resource',
      ],
    }),
    destroyFacility: builder.mutation<
      ApiResponse<{ message: string }>,
      number
    >({
      query: (facilityId) => ({
        url: `/facilities/${facilityId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Facility', 'Planet', 'Buildable', 'ConstructionQueue', 'Resource'],
    }),
    cancelFacilityConstruction: builder.mutation<
      ApiResponse<{ message: string; refund: { tellerium: number; krypton: number } }>,
      { planetId: number; constructionId: number }
    >({
      query: ({ planetId, constructionId }) => ({
        url: `/planets/${Number(planetId)}/facilities/${constructionId}/cancel`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { planetId }) => [
        { type: 'Facility', id: planetId },
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
  useGetFacilityDefinitionsQuery,
  useGetPlanetFacilitiesQuery,
  useBuildFacilityMutation,
  useUpgradeFacilityMutation,
  useUpgradeFacilityBySlugMutation,
  useDestroyFacilityMutation,
  useCancelFacilityConstructionMutation,
} = facilitiesApi
