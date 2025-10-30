import { apiSlice } from '../apiSlice'
import { ApiResponse, AllianceChatMessage, AllianceChatMeta, SendAllianceChatRequest } from '@/types/api.types'

export const allianceChatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllianceChat: builder.query<
      ApiResponse<{ data: AllianceChatMessage[]; meta: AllianceChatMeta }>,
      { allianceId: number; page?: number; per_page?: number }
    >({
      query: ({ allianceId, page = 1, per_page = 50 }) => ({
        url: `/alliances/${Number(allianceId)}/chat`,
        params: { page, per_page },
      }),
      providesTags: (result, error, { allianceId }) => [
        { type: 'Alliance', id: Number(allianceId) },
        'Alliance',
      ],
    }),
    sendAllianceChat: builder.mutation<ApiResponse<{ message: string }>, { allianceId: number; data: SendAllianceChatRequest }>({
      query: ({ allianceId, data }) => ({
        url: `/alliances/${Number(allianceId)}/chat`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { allianceId }) => [
        { type: 'Alliance', id: Number(allianceId) },
        'Alliance',
      ],
    }),
  }),
})

export const {
  useGetAllianceChatQuery,
  useSendAllianceChatMutation,
} = allianceChatApi
