import { apiSlice } from '../apiSlice'
import { UniverseMap, Ranking, ExplorationStatus, FleetRangeValidation, VisibilityResponse, UniverseConfigResponse } from '@/types/api.types'

export const universeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMap: builder.query<
      UniverseMap,
      { quadrant?: number; sector?: number; galaxy?: number; region?: number; system?: number; limit?: number; show_discovered_only?: boolean; include_uninhabitable?: boolean }
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
    getVisibility: builder.query<VisibilityResponse, void>({
      query: () => '/universe/visibility',
      providesTags: ['Universe'],
    }),
    validateFleetRange: builder.mutation<FleetRangeValidation, {
      origin_region: number
      origin_system: number
      destination_region: number
      destination_system: number
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
    getUniverseConfig: builder.query<UniverseConfigResponse, void>({
      query: () => '/universe/config',
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
  useGetDiscoverableQuery,
  useGetUniverseConfigQuery
} = universeApi

