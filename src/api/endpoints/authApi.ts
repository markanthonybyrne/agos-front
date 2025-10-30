import { apiSlice } from '../apiSlice'
import {
  User,
  Empire,
  RegisterRequest,
  LoginRequest,
  Planet,
} from '@/types/api.types'

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
      },
      void
    >({
      query: () => '/auth/me',
      transformResponse: (response: { status: string; data?: { user: User; empire: Empire; planets?: Planet[]; current_tick?: number; next_tick_eta?: string } }) => {
        // Handle the wrapped API response structure
        if (response.status === 'ok' && response.data) {
          return response.data
        }
        return response as unknown as { user: User; empire: Empire; planets?: Planet[]; current_tick?: number; next_tick_eta?: string }
      },
      providesTags: ['Empire'],
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
  }),
})

export const { useRegisterMutation, useLoginMutation, useLogoutMutation, useGetMeQuery, useUpdateProfileMutation } =
  authApi

