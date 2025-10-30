import { apiSlice } from '../apiSlice'
import {
  ApiResponse,
  PlanetResources,
  EmpireResourceSummary,
  TransferResourcesRequest,
} from '@/types/api.types'

export const resourcesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPlanetResources: builder.query<PlanetResources, number>({
      query: (planetId) => `/planets/${Number(planetId)}/resources`,
      providesTags: (result, error, planetId) => [
        { type: 'Resource', id: planetId },
      ],
    }),
    transferResources: builder.mutation<
      ApiResponse<{ transfer: { tellerium: number; krypton: number } }>,
      { planetId: number; data: TransferResourcesRequest }
    >({
      query: ({ planetId, data }) => ({
        url: `/planets/${Number(planetId)}/resources/transfer`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { planetId }) => [
        { type: 'Resource', id: planetId },
        'Planet',
      ],
    }),
    getEmpireResourceSummary: builder.query<EmpireResourceSummary, number>({
      query: (empireId) => `/empires/${empireId}/resources/summary`,
      providesTags: (result, error, empireId) => [
        { type: 'Resource', id: empireId },
      ],
    }),
  }),
})

export const {
  useGetPlanetResourcesQuery,
  useTransferResourcesMutation,
  useGetEmpireResourceSummaryQuery,
} = resourcesApi
