import { apiSlice } from '../apiSlice'
import {
  User,
  Empire,
  RegisterRequest,
  LoginRequest,
  Planet,
} from '@/types/api.types'
import { updateUser } from '@/app/slices/authSlice'

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<
      { user: User; empire: Empire; homeworld: Planet; token: string },
      RegisterRequest
    >({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: { status: string; data?: { user: User; empire: Empire; homeworld: Planet; token: string } }) => {
        // Handle the wrapped API response structure
        if (response.status === 'ok' && response.data) {
          return response.data
        }
        return response as unknown as { user: User; empire: Empire; homeworld: Planet; token: string }
      },
    }),
    login: builder.mutation<
      { user: User; empire: Empire | null; token: string },
      LoginRequest
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: { status: string; data?: { user: User; empire: Empire | null; token: string } }) => {
        // Handle the wrapped API response structure
        if (response.status === 'ok' && response.data) {
          return response.data
        }
        return response as unknown as { user: User; empire: Empire | null; token: string }
      },
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      transformResponse: (response: { status: string; message?: string }) => {
        // Handle the wrapped API response structure
        if (response.status === 'ok' && response.message) {
          return { message: response.message }
        }
        return { message: 'Logged out' }
      },
    }),
    getMe: builder.query<
      {
        user: User
        empire: Empire
        planets?: Planet[]
        current_tick?: number
        next_tick_eta?: string
        facilities?: Array<{ slug: string; name: string; level: number; is_active: boolean; built_on?: string | null; description?: string }>
        defence_grid?: Array<{ slug: string; name: string; quantity: number; active: boolean; built_on?: string | null }>
      },
      void
    >({
      query: () => '/auth/me',
      transformResponse: (response: { 
        status: string
        data?: { 
          user: User
          empire: Empire
          planets?: Planet[]
          current_tick?: number
          next_tick_eta?: string
          facilities?: Array<{ slug: string; name: string; level: number; is_active: boolean; built_on?: string | null; description?: string }>
          defence_grid?: Array<{ slug: string; name: string; quantity: number; active: boolean; built_on?: string | null }>
        }
        facilities?: Array<{ slug: string; name: string; level: number; is_active: boolean; built_on?: string | null; description?: string }>
        defence_grid?: Array<{ slug: string; name: string; quantity: number; active: boolean; built_on?: string | null }>
      }) => {
        // Handle the wrapped API response structure
        if (response.status === 'ok' && response.data) {
          return {
            ...response.data,
            // Include facilities and defence_grid from root level or data level
            facilities: response.data.facilities || response.facilities,
            defence_grid: response.data.defence_grid || response.defence_grid,
          }
        }
        return {
          ...(response as unknown as { user: User; empire: Empire; planets?: Planet[]; current_tick?: number; next_tick_eta?: string }),
          facilities: (response as any).facilities,
          defence_grid: (response as any).defence_grid,
        }
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          // Update auth state with latest user data (including roles)
          if (data.user) {
            dispatch(updateUser(data.user))
          }
        } catch {
          // Error handling is done by the query itself
        }
      },
      providesTags: (result) => [
        'Empire',
        'Planet', // getMe includes planets
        'Resource', // planets include resources
        'Statistics', // empire includes score/statistics
        ...(result?.empire?.id ? [{ type: 'Empire' as const, id: result.empire.id }] : []),
        ...(result?.planets?.map((p: Planet) => ({ type: 'Planet' as const, id: p.id })) || []),
      ],
    }),
    updateProfile: builder.mutation<
      { user: User; empire: Empire },
      { username?: string; email?: string; empire_name?: string; empire_description?: string }
    >({
      query: (data) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: { status: string; data?: { user: User; empire: Empire } }) => {
        // Handle the wrapped API response structure
        if (response.status === 'ok' && response.data) {
          return response.data
        }
        return response as unknown as { user: User; empire: Empire }
      },
      invalidatesTags: ['Empire'],
    }),
    changePassword: builder.mutation<
      { message: string },
      { current_password: string; new_password: string; new_password_confirmation: string }
    >({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { status: string; message?: string; data?: { message: string } }) => {
        if (response.status === 'ok' && response.message) {
          return { message: response.message }
        }
        if (response.status === 'ok' && response.data?.message) {
          return { message: response.data.message }
        }
        return { message: 'Password changed successfully' }
      },
    }),
    uploadAvatar: builder.mutation<
      { avatar_url: string },
      FormData
    >({
      query: (formData) => ({
        url: '/me/avatar',
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
      invalidatesTags: ['Empire'],
    }),
    deleteAvatar: builder.mutation<
      { message: string },
      void
    >({
      query: () => ({
        url: '/me/avatar',
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
      invalidatesTags: ['Empire'],
    }),
    getPreferences: builder.query<
      {
        notifications: {
          email_notifications: boolean
          push_notifications: boolean
        }
        events: {
          construction_completed: boolean
          research_completed: boolean
          fleet_arrived: boolean
          fleet_attacked: boolean
          planet_colonized: boolean
          alliance_messages: boolean
          empire_attacked: boolean
        }
      },
      void
    >({
      query: () => '/me/preferences',
      transformResponse: (response: {
        status: string
        data?: {
          notifications: { email_notifications: boolean; push_notifications: boolean }
          events: {
            construction_completed: boolean
            research_completed: boolean
            fleet_arrived: boolean
            fleet_attacked: boolean
            planet_colonized: boolean
            alliance_messages: boolean
            empire_attacked: boolean
          }
        }
      }) => {
        if (response.status === 'ok' && response.data) {
          return response.data
        }
        // Return default structure if response is malformed
        return {
          notifications: {
            email_notifications: false,
            push_notifications: true,
          },
          events: {
            construction_completed: true,
            research_completed: true,
            fleet_arrived: true,
            fleet_attacked: true,
            planet_colonized: true,
            alliance_messages: false,
            empire_attacked: true,
          },
        }
      },
    }),
    updatePreferences: builder.mutation<
      {
        notifications: {
          email_notifications: boolean
          push_notifications: boolean
        }
        events: {
          construction_completed: boolean
          research_completed: boolean
          fleet_arrived: boolean
          fleet_attacked: boolean
          planet_colonized: boolean
          alliance_messages: boolean
          empire_attacked: boolean
        }
      },
      {
        notifications?: {
          email_notifications?: boolean
          push_notifications?: boolean
        }
        events?: {
          construction_completed?: boolean
          research_completed?: boolean
          fleet_arrived?: boolean
          fleet_attacked?: boolean
          planet_colonized?: boolean
          alliance_messages?: boolean
          empire_attacked?: boolean
        }
      }
    >({
      query: (data) => ({
        url: '/me/preferences',
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: {
        status: string
        data?: {
          notifications: { email_notifications: boolean; push_notifications: boolean }
          events: {
            construction_completed: boolean
            research_completed: boolean
            fleet_arrived: boolean
            fleet_attacked: boolean
            planet_colonized: boolean
            alliance_messages: boolean
            empire_attacked: boolean
          }
        }
      }) => {
        if (response.status === 'ok' && response.data) {
          return response.data
        }
        return response as unknown as {
          notifications: { email_notifications: boolean; push_notifications: boolean }
          events: {
            construction_completed: boolean
            research_completed: boolean
            fleet_arrived: boolean
            fleet_attacked: boolean
            planet_colonized: boolean
            alliance_messages: boolean
            empire_attacked: boolean
          }
        }
      },
    }),
    deleteAccount: builder.mutation<
      { message: string },
      void
    >({
      query: () => ({
        url: '/auth/account',
        method: 'DELETE',
      }),
      transformResponse: (response: { status: string; message?: string; data?: { message: string } }) => {
        if (response.status === 'ok' && response.message) {
          return { message: response.message }
        }
        if (response.status === 'ok' && response.data?.message) {
          return { message: response.data.message }
        }
        return { message: 'Account deleted successfully' }
      },
    }),
    updateEmpireDescription: builder.mutation<
      { empire: Empire },
      { description: string }
    >({
      query: (data) => ({
        url: '/empires/my/description',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { status: string; data?: { empire: Empire }; empire?: Empire }) => {
        if (response.status === 'ok' && response.data?.empire) {
          return { empire: response.data.empire }
        }
        if (response.status === 'ok' && response.empire) {
          return { empire: response.empire }
        }
        return response as unknown as { empire: Empire }
      },
      invalidatesTags: ['Empire'],
    }),
  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useDeleteAccountMutation,
  useUpdateEmpireDescriptionMutation,
} = authApi

