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
        'Planet',
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
      invalidatesTags: ['Facility', 'Planet'],
    }),
    destroyFacility: builder.mutation<
      ApiResponse<{ message: string }>,
      number
    >({
      query: (facilityId) => ({
        url: `/facilities/${facilityId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Facility', 'Planet'],
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
        'Planet',
        'Buildable',
      ],
    }),
  }),
})

export const {
  useGetFacilityDefinitionsQuery,
  useGetPlanetFacilitiesQuery,
  useBuildFacilityMutation,
  useUpgradeFacilityMutation,
  useDestroyFacilityMutation,
  useCancelFacilityConstructionMutation,
} = facilitiesApi
