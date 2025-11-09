import { apiSlice } from '../apiSlice'
import {
  ApiResponse,
  QuantumCreditsBalance,
  QuantumCreditPackage,
  QuantumCreditPurchaseIntentRequest,
  QuantumCreditPurchaseIntentResponse,
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
    getQuantumCreditPackages: builder.query<QuantumCreditPackage[], void>({
      query: () => '/quantum-credits/packages',
      transformResponse: (
        response:
          | QuantumCreditPackage[]
          | Record<string, any>
          | { packages?: QuantumCreditPackage[] | Record<string, any> },
      ) => {
        const normalizePackages = (input: any): QuantumCreditPackage[] => {
          if (!input) return []
          if (Array.isArray(input)) {
            return input.map((pkg, index) => {
              const fallbackKey =
                pkg.key ??
                pkg.slug ??
                pkg.id ??
                (typeof pkg.name === 'string'
                  ? pkg.name.toLowerCase().replace(/\s+/g, '-')
                  : null) ??
                `package-${index}`
              return {
                ...pkg,
                key: fallbackKey,
              }
            })
          }
          if (typeof input === 'object') {
            return Object.entries(input).map(([key, value]) => {
              const details = (value as Record<string, any>) ?? {}
              return {
                key,
                name: details.name ?? key,
                credits: details.credits ?? 0,
                price: details.price ?? 0,
                currency: details.currency ?? 'usd',
                description: details.description,
                badge: details.badge,
                perks: details.perks,
                icon: details.icon,
                most_popular: details.most_popular,
              } as QuantumCreditPackage
            })
          }
          return []
        }

        if (Array.isArray(response)) {
          return normalizePackages(response)
        }

        if (response && typeof response === 'object' && 'packages' in response) {
          return normalizePackages((response as any).packages)
        }

        return normalizePackages(response)
      },
      providesTags: ['QuantumCreditPackages'],
    }),
    createQuantumCreditPurchaseIntent: builder.mutation<
      QuantumCreditPurchaseIntentResponse,
      QuantumCreditPurchaseIntentRequest
    >({
      query: (data) => ({
        url: '/user/quantum-credits/purchase-intent',
        method: 'POST',
        body: data,
      }),
      transformResponse: (
        response:
          | QuantumCreditPurchaseIntentResponse
          | {
              status?: string
              data?: QuantumCreditPurchaseIntentResponse
            },
      ) => {
        if (response && 'client_secret' in response) {
          return response as QuantumCreditPurchaseIntentResponse
        }
        if (response && typeof response === 'object' && response.data) {
          return response.data
        }
        return response as QuantumCreditPurchaseIntentResponse
      },
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
  useGetQuantumCreditPackagesQuery,
  useCreateQuantumCreditPurchaseIntentMutation,
  useClaimDailyLoginMutation,
  useGetActiveBoostersQuery,
  useActivateBoosterMutation,
  useGetAchievementsQuery,
} = premiumApi

