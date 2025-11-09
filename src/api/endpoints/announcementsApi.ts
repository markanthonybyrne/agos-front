import { apiSlice } from '../apiSlice'
import { Announcement, AnnouncementListResponse, AnnouncementResponse } from '@/types/api.types'

const transformAnnouncementList = (response: Announcement[] | AnnouncementListResponse | undefined): Announcement[] => {
  if (!response) {
    return []
  }

  if (Array.isArray(response)) {
    return response
  }

  if ('announcements' in response && Array.isArray(response.announcements)) {
    return response.announcements
  }

  return []
}

const transformAnnouncement = (response: Announcement | AnnouncementResponse | undefined): Announcement | null => {
  if (!response) {
    return null
  }

  if ('announcement' in response) {
    return response.announcement ?? null
  }

  return response
}

export const announcementsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query<Announcement[], void>({
      query: () => ({
        url: '/announcements',
      }),
      transformResponse: transformAnnouncementList,
      providesTags: (result) =>
        result
          ? [
              ...result.map((announcement) => ({ type: 'Announcement' as const, id: announcement.id })),
              { type: 'Announcement' as const, id: 'LIST' },
            ]
          : [{ type: 'Announcement' as const, id: 'LIST' }],
    }),
    getAnnouncement: builder.query<Announcement | null, number>({
      query: (id) => `/announcements/${id}`,
      transformResponse: transformAnnouncement,
      providesTags: (_result, _error, id) => [{ type: 'Announcement' as const, id }],
    }),
  }),
})

export const { useGetAnnouncementsQuery, useGetAnnouncementQuery } = announcementsApi

import { apiSlice } from '../apiSlice'
import { AnnouncementListResponse } from '@/types/api.types'

