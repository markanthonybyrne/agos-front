import { apiSlice } from '../apiSlice'
import { ApiResponse, UniverseMap, Ranking, ExplorationStatus, FleetRangeValidation } from '@/types/api.types'

export const universeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMap: builder.query<
      UniverseMap,
      { quadrant?: number; sector?: number; galaxy?: number }
    >({
      query: (params) => ({
        url: '/universe/map',
        params,
      }),
      providesTags: ['Universe'],
    }),
    getTop: builder.query<
      { top_empires: Ranking[]; top_galaxies: Ranking[] },
      void
    >({
      query: () => '/universe/top',
      providesTags: ['Universe'],
    }),
    getUniverseStructure: builder.query<
      {
        structure: Array<{
          quadrant: number
          sectors: Array<{
            sector: number
            galaxies: Array<{
              galaxy: number
              planet_count: number
            }>
          }>
        }>
      },
      void
    >({
      query: () => '/universe/structure',
      providesTags: ['Universe'],
    }),
    getExplorationStatus: builder.query<ExplorationStatus, void>({
      query: () => '/empires/my/exploration',
      providesTags: ['Empire', 'Universe'],
    }),
    getVisibility: builder.query<{
      visibility_level: string
      visible_galaxies: Array<{
        quadrant: number
        sector: number
        galaxy: number
        discovery_method: string
      }>
      visible_sectors: Array<{
        quadrant: number
        sector: number
      }>
      visible_quadrants: Array<{
        quadrant: number
      }>
      unlocked_by: {
        sensor_technology: boolean
        deep_space_scanning: boolean
      }
      fleet_range: {
        level: string
        can_travel_to_sector: boolean
        can_travel_to_quadrant: boolean
        unlocked_by: {
          propulsion_tech: boolean
          warp_technology: boolean
        }
      }
    }, void>({
      query: () => '/universe/visibility',
      providesTags: ['Universe'],
    }),
    validateFleetRange: builder.mutation<FleetRangeValidation, {
      origin_quadrant: number
      origin_sector: number
      origin_galaxy: number
      destination_quadrant: number
      destination_sector: number
      destination_galaxy: number
    }>({
      query: (data) => ({
        url: '/universe/can-reach',
        method: 'POST',
        body: data,
      }),
    }),
    getDiscoverable: builder.query<{
      discoverable_galaxies: Array<{
        quadrant: number
        sector: number
        galaxy: number
      }>
    }, void>({
      query: () => '/universe/discoverable',
      providesTags: ['Universe'],
    }),
  }),
})

export const { 
  useGetMapQuery, 
  useGetTopQuery, 
  useGetUniverseStructureQuery,
  useGetExplorationStatusQuery,
  useGetVisibilityQuery,
  useValidateFleetRangeMutation,
  useGetDiscoverableQuery
} = universeApi

