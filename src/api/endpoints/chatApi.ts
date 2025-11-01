import { apiSlice } from '../apiSlice'
import {
  ChatChannel,
  ChatChannelListResponse,
  ChatMessage,
  ChatMessageListResponse,
  SendChatMessageRequest,
  EditChatMessageRequest,
  SendTypingIndicatorRequest,
  OnlineUsersResponse,
} from '@/types/api.types'

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // List all channels
    listChannels: builder.query<ChatChannelListResponse, void>({
      query: () => '/chat/channels',
      providesTags: ['Chat'],
    }),

    // Get channel details
    getChannel: builder.query<{ channel: ChatChannel }, string>({
      query: (slug) => `/chat/channels/${slug}`,
      providesTags: (_result, _error, slug) => [{ type: 'Chat', id: slug }],
    }),

    // Get message history
    getMessages: builder.query<
      ChatMessageListResponse,
      { channelSlug: string; limit?: number; before_id?: number }
    >({
      query: ({ channelSlug, limit = 100, before_id }) => {
        const params = new URLSearchParams()
        if (limit) params.append('limit', limit.toString())
        if (before_id) params.append('before_id', before_id.toString())
        const queryString = params.toString()
        return `/chat/channels/${channelSlug}/messages${queryString ? `?${queryString}` : ''}`
      },
      providesTags: (_result, _error, { channelSlug }) => [
        { type: 'Chat', id: channelSlug },
        'Chat',
      ],
    }),

    // Send message
    sendMessage: builder.mutation<
      { message: ChatMessage },
      { channelSlug: string; data: SendChatMessageRequest }
    >({
      query: ({ channelSlug, data }) => ({
        url: `/chat/channels/${channelSlug}/messages`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { channelSlug }) => [
        { type: 'Chat', id: channelSlug },
        'Chat',
      ],
    }),

    // Edit message
    editMessage: builder.mutation<
      { message: ChatMessage },
      { messageId: number; data: EditChatMessageRequest }
    >({
      query: ({ messageId, data }) => ({
        url: `/chat/messages/${messageId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Chat'],
    }),

    // Delete message
    deleteMessage: builder.mutation<{ message: string }, number>({
      query: (messageId) => ({
        url: `/chat/messages/${messageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chat'],
    }),

    // Send typing indicator
    sendTypingIndicator: builder.mutation<
      { message: string },
      { channelSlug: string; data: SendTypingIndicatorRequest }
    >({
      query: ({ channelSlug, data }) => ({
        url: `/chat/channels/${channelSlug}/typing`,
        method: 'POST',
        body: data,
      }),
      // No cache invalidation needed for typing indicators
    }),

    // Get online users
    getOnlineUsers: builder.query<OnlineUsersResponse, string>({
      query: (channelSlug) => `/chat/channels/${channelSlug}/online`,
      providesTags: (_result, _error, channelSlug) => [
        { type: 'Chat', id: `${channelSlug}-online` },
      ],
    }),
  }),
})

export const {
  useListChannelsQuery,
  useGetChannelQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useSendTypingIndicatorMutation,
  useGetOnlineUsersQuery,
} = chatApi

