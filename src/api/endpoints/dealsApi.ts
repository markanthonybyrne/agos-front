import { apiSlice } from '../apiSlice'
import { ResourceRarity } from '@/types/api.types'

export type DealStatus = 'open' | 'completed' | 'cancelled' | 'expired'

export interface DealResourceAmount {
  resource_type: string
  quantity: number
  category: 'primary' | 'secondary'
  rarity?: ResourceRarity
}

export interface MarketDeal {
  id: number
  status: DealStatus
  creator_empire: {
    id: number
    name: string
  }
  responder_empire?: {
    id: number
    name: string
  } | null
  creator_planet_id: number
  creator_receive_planet_id?: number | null
  responder_planet_id?: number | null
  responder_receive_planet_id?: number | null
  offered_resources: DealResourceAmount[]
  requested_resources: DealResourceAmount[]
  created_at: string
  updated_at: string
  expires_at?: string | null
  accepted_at?: string | null
  cancellation_reason?: string | null
}

export interface DealsResponse {
  deals: MarketDeal[]
}

export interface GetOpenDealsParams {
  resource?: string
  min_amount?: number
  include_secondary?: boolean
}

export interface CreateDealResourcePayload {
  resource_type: string
  quantity: number
  category?: 'primary' | 'secondary'
}

export interface CreateDealRequest {
  creator_planet_id: number
  creator_receive_planet_id?: number | null
  offered_resources: CreateDealResourcePayload[]
  requested_resources: CreateDealResourcePayload[]
  expires_in_hours?: number
}

export interface CreateDealResponse {
  status: string
  message: string
  deal: MarketDeal
}

export interface AcceptDealRequest {
  responder_planet_id: number
  responder_receive_planet_id?: number | null
}

export interface MutateDealResponse {
  status: string
  message: string
  deal: MarketDeal
}

export const dealsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyDeals: builder.query<DealsResponse, void>({
      query: () => '/market/deals',
      providesTags: ['MarketDeal', 'Deals'],
    }),
    getOpenDeals: builder.query<DealsResponse, GetOpenDealsParams | void>({
      query: (params) => {
        const queryParams: GetOpenDealsParams | undefined =
          params === undefined ? undefined : params

        return {
          url: '/market/deals/open',
          params: queryParams,
        }
      },
      providesTags: ['MarketDeal', 'Deals'],
    }),
    createDeal: builder.mutation<CreateDealResponse, CreateDealRequest>({
      query: (data) => ({
        url: '/market/deals',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MarketDeal', 'Market', 'Resource', 'SecondaryResource', 'Empire', 'Planet'],
    }),
    cancelDeal: builder.mutation<MutateDealResponse, number>({
      query: (dealId) => ({
        url: `/market/deals/${dealId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['MarketDeal', 'Market', 'Resource', 'SecondaryResource', 'Empire', 'Planet'],
    }),
    acceptDeal: builder.mutation<MutateDealResponse, { dealId: number; payload: AcceptDealRequest }>({
      query: ({ dealId, payload }) => ({
        url: `/market/deals/${dealId}/accept`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['MarketDeal', 'Market', 'Resource', 'SecondaryResource', 'Empire', 'Planet'],
    }),
  }),
})

export const {
  useGetMyDealsQuery,
  useGetOpenDealsQuery,
  useCreateDealMutation,
  useCancelDealMutation,
  useAcceptDealMutation,
} = dealsApi


