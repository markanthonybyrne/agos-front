import { apiSlice } from '../apiSlice'
import {
  ApiResponse,
  QuantumCreditsBalance,
  ActiveBoostersResponse,
  ActivateBoosterRequest,
  ActivateBoosterResponse,
  AchievementsResponse,
} from '@/types/api.types'

export const premiumApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getQuantumCredits: builder.query<QuantumCreditsBalance, void>({
      query: () => '/user/quantum-credits',
      providesTags: ['QuantumCredits'],
    }),
    claimDailyLogin: builder.mutation<
      ApiResponse<{ reward: number; new_balance: number; streak: number }>,
      void
    >({
      query: () => ({
        url: '/user/quantum-credits/daily-login',
        method: 'POST',
      }),
      invalidatesTags: ['QuantumCredits'],
    }),
    getActiveBoosters: builder.query<ActiveBoostersResponse, void>({
      query: () => '/boosters/active',
      providesTags: ['Booster'],
    }),
    activateBooster: builder.mutation<
      ActivateBoosterResponse,
      ActivateBoosterRequest
    >({
      query: (data) => ({
        url: '/boosters/activate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Booster', 'QuantumCredits'],
    }),
    getAchievements: builder.query<AchievementsResponse, void>({
      query: () => '/user/achievements',
      providesTags: ['Achievement'],
    }),
  }),
})

export const {
  useGetQuantumCreditsQuery,
  useClaimDailyLoginMutation,
  useGetActiveBoostersQuery,
  useActivateBoosterMutation,
  useGetAchievementsQuery,
} = premiumApi

