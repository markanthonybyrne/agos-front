import { apiSlice } from '../apiSlice'
import { ApiResponse, Empire, Planet, Fleet, PaginatedResponse } from '@/types/api.types'

export const empiresApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEmpires: builder.query<
      { data: Empire[]; meta: { current_page: number; per_page: number; total: number; last_page: number } },
      { q?: string; page?: number; per_page?: number }
    >({
      query: (params) => ({
        url: '/empires',
        params,
      }),
      providesTags: ['Empire'],
    }),
    getEmpire: builder.query<{ empire: Empire & { planets: Planet[]; fleets: Fleet[] } }, number>(
      {
        query: (id) => `/empires/${id}`,
        providesTags: (_result, _error, id) => [{ type: 'Empire', id }],
      }
    ),
  }),
})

export const { useGetEmpiresQuery, useGetEmpireQuery } = empiresApi

