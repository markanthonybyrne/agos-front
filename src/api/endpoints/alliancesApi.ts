import { apiSlice } from '../apiSlice'
import {
  ApiResponse,
  Alliance,
  CreateAllianceRequest,
  DonateToAllianceRequest,
  AllianceCreationRequest,
  CreateAllianceCreationRequest,
  SupportAllianceCreationRequest,
  AllianceJoinRequest,
  CreateJoinRequest,
  RespondToJoinRequest,
  AllianceGroup,
  CreateAllianceGroup,
  UpdateAllianceGroup,
  AllianceMember,
  AllianceStatus,
  AllianceHomepage,
  AllianceGlobalOptions,
  AllianceChatMessage,
  SendAllianceChatRequest,
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
    // Creation Requests
    createAllianceCreationRequest: builder.mutation<
      ApiResponse<{ request: AllianceCreationRequest }>,
      CreateAllianceCreationRequest
    >({
      query: (data) => ({
        url: '/alliances/create-request',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Alliance'],
    }),
    getAllianceCreationRequests: builder.query<
      { requests: AllianceCreationRequest[] },
      void
    >({
      query: () => '/alliances/create-requests',
      providesTags: ['Alliance'],
    }),
    getMyAllianceCreationRequests: builder.query<
      { requests: AllianceCreationRequest[] },
      void
    >({
      query: () => '/alliances/create-requests/my',
      providesTags: ['Alliance'],
    }),
    supportAllianceCreationRequest: builder.mutation<
      ApiResponse<{ request: AllianceCreationRequest }>,
      { requestId: number; data: SupportAllianceCreationRequest }
    >({
      query: ({ requestId, data }) => ({
        url: `/alliances/create-requests/${Number(requestId)}/support`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Alliance'],
    }),
    // Homepage
    getAllianceHomepage: builder.query<
      AllianceHomepage,
      number
    >({
      query: (id) => `/alliances/${Number(id)}/homepage`,
      providesTags: (_result, _error, id) => [{ type: 'Alliance', id: Number(id) }],
    }),
    // Join Requests
    createJoinRequest: builder.mutation<
      ApiResponse<{ request: AllianceJoinRequest }>,
      { allianceId: number; data: CreateJoinRequest }
    >({
      query: ({ allianceId, data }) => ({
        url: `/alliances/${Number(allianceId)}/join-request`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Alliance'],
    }),
    getJoinRequests: builder.query<
      { requests: AllianceJoinRequest[] },
      { allianceId: number; status?: 'pending' | 'accepted' | 'rejected' | 'all' }
    >({
      query: ({ allianceId, status }) => ({
        url: `/alliances/${Number(allianceId)}/join-requests`,
        params: status ? { status } : undefined,
      }),
      providesTags: (_result, _error, { allianceId }) => [{ type: 'Alliance', id: Number(allianceId) }],
    }),
    getMyJoinRequests: builder.query<
      { requests: AllianceJoinRequest[] },
      void
    >({
      query: () => '/alliances/join-requests/my',
      providesTags: ['Alliance'],
    }),
    respondToJoinRequest: builder.mutation<
      ApiResponse<{ request: AllianceJoinRequest }>,
      { allianceId: number; requestId: number; data: RespondToJoinRequest }
    >({
      query: ({ allianceId, requestId, data }) => ({
        url: `/alliances/${Number(allianceId)}/join-requests/${Number(requestId)}/respond`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { allianceId }) => [{ type: 'Alliance', id: Number(allianceId) }, 'Alliance', 'Empire'],
    }),
    // Members
    getAllianceMembers: builder.query<
      { members: AllianceMember[] },
      number
    >({
      query: (id) => `/alliances/${Number(id)}/members`,
      providesTags: (_result, _error, id) => [{ type: 'Alliance', id: Number(id) }],
    }),
    // Status
    getAllianceStatus: builder.query<
      AllianceStatus,
      number
    >({
      query: (id) => `/alliances/${Number(id)}/status`,
      providesTags: (_result, _error, id) => [{ type: 'Alliance', id: Number(id) }],
    }),
    // Groups
    getAllianceGroups: builder.query<
      { groups: AllianceGroup[] },
      number
    >({
      query: (id) => `/alliances/${Number(id)}/groups`,
      providesTags: (_result, _error, id) => [{ type: 'Alliance', id: Number(id) }],
    }),
    createAllianceGroup: builder.mutation<
      ApiResponse<{ group: AllianceGroup }>,
      { allianceId: number; data: CreateAllianceGroup }
    >({
      query: ({ allianceId, data }) => ({
        url: `/alliances/${Number(allianceId)}/groups`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { allianceId }) => [{ type: 'Alliance', id: Number(allianceId) }],
    }),
    updateAllianceGroup: builder.mutation<
      ApiResponse<{ group: AllianceGroup }>,
      { allianceId: number; groupId: number; data: UpdateAllianceGroup }
    >({
      query: ({ allianceId, groupId, data }) => ({
        url: `/alliances/${Number(allianceId)}/groups/${Number(groupId)}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { allianceId }) => [{ type: 'Alliance', id: Number(allianceId) }],
    }),
    deleteAllianceGroup: builder.mutation<
      ApiResponse<{ message: string }>,
      { allianceId: number; groupId: number }
    >({
      query: ({ allianceId, groupId }) => ({
        url: `/alliances/${Number(allianceId)}/groups/${Number(groupId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { allianceId }) => [{ type: 'Alliance', id: Number(allianceId) }],
    }),
    // Global Options
    updateAllianceGlobalOptions: builder.mutation<
      ApiResponse<{ alliance: Alliance }>,
      { allianceId: number; data: AllianceGlobalOptions }
    >({
      query: ({ allianceId, data }) => ({
        url: `/alliances/${Number(allianceId)}/global-options`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { allianceId }) => [{ type: 'Alliance', id: Number(allianceId) }, 'Alliance'],
    }),
    // Member Management
    kickAllianceMember: builder.mutation<
      ApiResponse<{ message: string }>,
      { allianceId: number; memberId: number }
    >({
      query: ({ allianceId, memberId }) => ({
        url: `/alliances/${Number(allianceId)}/members/${Number(memberId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { allianceId }) => [{ type: 'Alliance', id: Number(allianceId) }, 'Alliance', 'Empire'],
    }),
    transferAllianceLeadership: builder.mutation<
      ApiResponse<{ alliance: Alliance }>,
      { allianceId: number; newLeaderId: number }
    >({
      query: ({ allianceId, newLeaderId }) => ({
        url: `/alliances/${Number(allianceId)}/transfer-leadership`,
        method: 'POST',
        body: { new_leader_id: newLeaderId },
      }),
      invalidatesTags: (_result, _error, { allianceId }) => [{ type: 'Alliance', id: Number(allianceId) }, 'Alliance', 'Empire'],
    }),
    leaveAlliance: builder.mutation<
      ApiResponse<{ message: string }>,
      number
    >({
      query: (allianceId) => ({
        url: `/alliances/${Number(allianceId)}/leave`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, allianceId) => [{ type: 'Alliance', id: Number(allianceId) }, 'Alliance', 'Empire'],
    }),
    // Chat
    getAllianceChatMessages: builder.query<
      { messages: AllianceChatMessage[] },
      { allianceId: number; limit?: number; offset?: number }
    >({
      query: ({ allianceId, limit = 50, offset = 0 }) => ({
        url: `/alliances/${Number(allianceId)}/chat`,
        params: { limit, offset },
      }),
      providesTags: (_result, _error, { allianceId }) => [{ type: 'Alliance', id: Number(allianceId) }],
    }),
    sendAllianceChatMessage: builder.mutation<
      ApiResponse<{ message: AllianceChatMessage }>,
      { allianceId: number; data: SendAllianceChatRequest }
    >({
      query: ({ allianceId, data }) => ({
        url: `/alliances/${Number(allianceId)}/chat`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { allianceId }) => [{ type: 'Alliance', id: Number(allianceId) }],
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
  // Creation Requests
  useCreateAllianceCreationRequestMutation,
  useGetAllianceCreationRequestsQuery,
  useGetMyAllianceCreationRequestsQuery,
  useSupportAllianceCreationRequestMutation,
  // Homepage
  useGetAllianceHomepageQuery,
  // Join Requests
  useCreateJoinRequestMutation,
  useGetJoinRequestsQuery,
  useGetMyJoinRequestsQuery,
  useRespondToJoinRequestMutation,
  // Members
  useGetAllianceMembersQuery,
  // Status
  useGetAllianceStatusQuery,
  // Groups
  useGetAllianceGroupsQuery,
  useCreateAllianceGroupMutation,
  useUpdateAllianceGroupMutation,
  useDeleteAllianceGroupMutation,
  // Global Options
  useUpdateAllianceGlobalOptionsMutation,
  // Member Management
  useKickAllianceMemberMutation,
  useTransferAllianceLeadershipMutation,
  useLeaveAllianceMutation,
  // Chat
  useGetAllianceChatMessagesQuery,
  useSendAllianceChatMessageMutation,
} = alliancesApi

