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
    uploadAllianceAvatar: builder.mutation<
      { avatar_url: string },
      { allianceId: number; formData: FormData }
    >({
      query: ({ allianceId, formData }) => ({
        url: `/alliances/${Number(allianceId)}/avatar`,
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: { status: string; data?: { avatar_url: string }; avatar_url?: string }) => {
        if (response.status === 'ok' && response.data?.avatar_url) {
          return { avatar_url: response.data.avatar_url }
        }
        if (response.status === 'ok' && response.avatar_url) {
          return { avatar_url: response.avatar_url }
        }
        return response as unknown as { avatar_url: string }
      },
      invalidatesTags: (_result, _error, { allianceId }) => [{ type: 'Alliance', id: Number(allianceId) }, 'Alliance'],
    }),
    deleteAllianceAvatar: builder.mutation<
      { message: string },
      number
    >({
      query: (allianceId) => ({
        url: `/alliances/${Number(allianceId)}/avatar`,
        method: 'DELETE',
      }),
      transformResponse: (response: { status: string; message?: string; data?: { message: string } }) => {
        if (response.status === 'ok' && response.message) {
          return { message: response.message }
        }
        if (response.status === 'ok' && response.data?.message) {
          return { message: response.data.message }
        }
        return { message: 'Avatar deleted successfully' }
      },
      invalidatesTags: (_result, _error, allianceId) => [{ type: 'Alliance', id: Number(allianceId) }, 'Alliance'],
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
  useUploadAllianceAvatarMutation,
  useDeleteAllianceAvatarMutation,
} = alliancesApi

