import { apiSlice } from '../apiSlice'
import {
  ApiResponse,
  Alliance,
  CreateAllianceRequest,
  DonateToAllianceRequest,
} from '@/types/api.types'

export const alliancesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAlliances: builder.query<{ alliances: Alliance[] }, void>({
      query: () => '/alliances',
      providesTags: ['Alliance'],
    }),
    getAlliance: builder.query<{ alliance: Alliance }, number>({
      query: (id) => `/alliances/${Number(id)}`,
      providesTags: (_result, _error, id) => [{ type: 'Alliance', id: Number(id) }],
    }),
    createAlliance: builder.mutation<ApiResponse<{ alliance: Alliance }>, CreateAllianceRequest>({
      query: (data) => ({
        url: '/alliances',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Alliance', 'Empire'],
    }),
    getAllianceDetails: builder.query<{ alliance: Alliance }, number>({
      query: (id) => `/alliances/${Number(id)}`,
      providesTags: (result, error, id) => [{ type: 'Alliance', id: Number(id) }],
    }),
    getMyAlliance: builder.query<{ alliance: Alliance } | ApiResponse<{ alliance: Alliance }>, void>({
      query: () => '/alliances/my',
      providesTags: ['Alliance'],
    }),
    donateToAlliance: builder.mutation<
      ApiResponse<{
        alliance_id: number
        donation: { tellerium: number; krypton: number }
        new_funds: { tellerium: number; krypton: number }
      }>,
      { allianceId: number; tellerium: number; krypton: number }
    >({
      query: ({ allianceId, tellerium, krypton }) => ({
        url: `/alliances/${Number(allianceId)}/donate`,
        method: 'POST',
        body: { tellerium, krypton },
      }),
      invalidatesTags: (_result, _error, { allianceId }) => [{ type: 'Alliance', id: Number(allianceId) }, 'Alliance', 'Empire'],
    }),
  }),
})

export const {
  useGetAlliancesQuery,
  useGetAllianceQuery,
  useGetAllianceDetailsQuery,
  useGetMyAllianceQuery,
  useCreateAllianceMutation,
  useDonateToAllianceMutation,
} = alliancesApi

