import { apiSlice } from '../apiSlice'
import { ApiResponse, UniverseMap, Ranking } from '@/types/api.types'

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
  }),
})

export const { useGetMapQuery, useGetTopQuery, useGetUniverseStructureQuery } = universeApi

