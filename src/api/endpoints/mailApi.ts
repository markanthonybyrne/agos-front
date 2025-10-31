import { apiSlice } from '../apiSlice'
import { ApiResponse, PaginatedResponse, Mail, MailMeta, SendMailRequest, ReplyMailRequest } from '@/types/api.types'

export const mailApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMail: builder.query<
      { type: string; data: Mail[]; meta: MailMeta },
      { type?: 'inbox' | 'sent'; page?: number; per_page?: number }
    >({
      query: ({ type = 'inbox', page = 1, per_page = 25 }) => ({
        url: '/mail',
        params: { type, page, per_page },
      }),
      providesTags: (result, error, { type = 'inbox' }) => [
        { type: 'Mail', id: type },
        { type: 'Mail', id: 'LIST' },
      ],
    }),
    getMailDetails: builder.query<{ mail: Mail }, number>({
      query: (id) => `/mail/${id}`,
      providesTags: (result, error, id) => [{ type: 'Mail', id }],
    }),
    sendMail: builder.mutation<ApiResponse<{ message: string }>, SendMailRequest>({
      query: (data) => ({
        url: '/mail',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Mail', id: 'inbox' },
        { type: 'Mail', id: 'sent' },
        { type: 'Mail', id: 'LIST' },
      ],
    }),
    replyMail: builder.mutation<ApiResponse<{ message: string }>, ReplyMailRequest>({
      query: (data) => ({
        url: '/mail/reply',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Mail', id: 'inbox' },
        { type: 'Mail', id: 'sent' },
        { type: 'Mail', id: 'LIST' },
        { type: 'Mail', id: 'UNREAD_COUNT' }, // Invalidate unread count when replying (recipient gets new mail)
      ],
    }),
    deleteMail: builder.mutation<ApiResponse<{ message: string }>, number>({
      query: (id) => ({
        url: `/mail/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Mail', id: 'inbox' },
        { type: 'Mail', id: 'sent' },
        { type: 'Mail', id: 'LIST' },
      ],
    }),
    markMailAsRead: builder.mutation<ApiResponse<{ mail: { id: number; is_read: boolean } }>, number>({
      query: (id) => ({
        url: `/mail/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Mail', id: 'inbox' },
        { type: 'Mail', id: 'LIST' },
        { type: 'Mail', id },
        { type: 'Mail', id: 'UNREAD_COUNT' }, // Also invalidate unread count
      ],
    }),
    getUnreadMailCount: builder.query<{ unread_count: number }, void>({
      query: () => '/mail/unread-count',
      providesTags: [{ type: 'Mail', id: 'UNREAD_COUNT' }],
    }),
  }),
})

export const {
  useGetMailQuery,
  useGetMailDetailsQuery,
  useSendMailMutation,
  useReplyMailMutation,
  useDeleteMailMutation,
  useMarkMailAsReadMutation,
  useGetUnreadMailCountQuery,
} = mailApi