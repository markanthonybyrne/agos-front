import { apiSlice } from '../apiSlice'
import {
  ApiResponse,
  FacilityDefinition,
  Facility,
  BuildFacilityRequest,
} from '@/types/api.types'

export const facilitiesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFacilityDefinitions: builder.query<
      { facilities: FacilityDefinition[] },
      { era?: number; specialization?: string } | void
    >({
      query: (params) => ({
        url: '/facilities/definitions',
        params: params ? { era: params.era, specialization: params.specialization } : {},
      }),
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
    previewFacility: builder.query<
      {
        facility: {
          slug: string
          name: string
          per_tick: Record<string, number>
          upkeep: Record<string, number>
        }
        projected_production: {
          tellerium_per_tick: number
          krypton_per_tick: number
          dark_matter_per_tick?: number
        }
        projected_upkeep: {
          tellerium_per_tick: number
          krypton_per_tick: number
        }
        net_production: {
          tellerium_per_tick: number
          krypton_per_tick: number
          dark_matter_per_tick?: number
        }
        applied_multipliers: Record<string, number>
      },
      { planetId: number; facilitySlug: string }
    >({
      query: ({ planetId, facilitySlug }) => ({
        url: '/facilities/preview',
        params: {
          planet_id: planetId,
          facility_slug: facilitySlug,
        },
      }),
      providesTags: (result, error, { planetId }) => [
        { type: 'Facility', id: planetId },
        'Empire',
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
  usePreviewFacilityQuery,
} = facilitiesApi
