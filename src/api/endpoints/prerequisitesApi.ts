import { apiSlice } from '../apiSlice'
import { ApiResponse } from '@/types/api.types'

export interface CheckPrerequisitesRequest {
  type: 'facility' | 'research' | 'ship' | 'defence'
  slug: string
}

export interface CheckPrerequisitesResponse {
  can_build: boolean
  errors: string[]
  missing_prerequisites?: {
    era?: number
    specialization?: string[]
    facilities?: string[]
    research?: string[]
  }
}

export const prerequisitesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    checkPrerequisites: builder.mutation<
      ApiResponse<CheckPrerequisitesResponse>,
      CheckPrerequisitesRequest
    >({
      query: (data) => ({
        url: '/prerequisites/check',
        method: 'POST',
        body: data,
      }),
    }),
  }),
})

export const { useCheckPrerequisitesMutation } = prerequisitesApi

