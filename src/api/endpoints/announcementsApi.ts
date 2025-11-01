import { apiSlice } from '../apiSlice'
import { AnnouncementListResponse } from '@/types/api.types'

export const announcementsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Public endpoint for players to fetch active announcements
    getAnnouncements: builder.query<AnnouncementListResponse, void>({
      query: () => '/announcements',
      providesTags: ['Announcement'],
      transformResponse: (response: any) => {
        console.log('[announcementsApi] Raw API response:', response)
        // Handle different possible response structures
        if (response.announcements) {
          console.log('[announcementsApi] Response has announcements array:', response.announcements)
          return response
        } else if (response.data && Array.isArray(response.data)) {
          console.log('[announcementsApi] Response has data array, wrapping in announcements:', response.data)
          return { announcements: response.data }
        } else if (Array.isArray(response)) {
          console.log('[announcementsApi] Response is array directly, wrapping in announcements:', response)
          return { announcements: response }
        } else {
          console.warn('[announcementsApi] Unexpected response structure:', response)
          return { announcements: [] }
        }
      },
    }),
  }),
})

export const {
  useGetAnnouncementsQuery,
} = announcementsApi

