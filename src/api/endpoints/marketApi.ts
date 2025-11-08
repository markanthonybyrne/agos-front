import { apiSlice } from '../apiSlice'

export interface MarketPriceEntry {
  price: number
  resource_type: string
  spread?: number
  change_percent?: number
  last_updated?: string
}

export interface MarketPricesResponse {
  primary: Record<string, MarketPriceEntry>
  secondary: Record<string, MarketPriceEntry>
  timestamp?: string
}

export interface MarketPricesResult extends MarketPricesResponse {
  lookup: Record<string, MarketPriceEntry>
}

export interface PriceHistoryEntry {
  tick_number: number
  price: number
  supply: number
  demand: number
  traded_volume: number
  created_at: string
}

export interface PriceHistoryResponse {
  resource_type: string
  ticks: number
  history: PriceHistoryEntry[]
}

export interface MarketStatisticsResponse {
  resource_type: string
  current_price: number
  total_supply: number
  total_production: number
  total_consumption: number
  active_orders_buy: number
  active_orders_sell: number
  trade_volume: number
  supply_demand_ratio: number
  last_updated: string
}

export interface MarketOrder {
  id: number
  order_type: 'buy' | 'sell'
  resource_type: string
  quantity: number
  filled_quantity: number
  remaining_quantity: number
  price_limit: number | null
  status: 'pending' | 'partial' | 'completed' | 'cancelled' | 'expired'
  expires_at: string | null
  planet: {
    id: number
    name: string
  }
  created_at: string
}

export interface MarketOrdersResponse {
  orders: MarketOrder[]
}

export interface CreateOrderRequest {
  planet_id: number
  order_type: 'buy' | 'sell'
  resource_type: string
  quantity: number
  price_limit?: number | null
}

export interface CreateOrderResponse {
  status: string
  message: string
  order: MarketOrder
}

export interface MarketTrade {
  id: number
  tick_number: number
  resource_type: string
  quantity: number
  price: number
  total_value: number
  side: 'buy' | 'sell'
  counterparty: {
    id: number
    name: string
  }
  created_at: string
}

export interface MarketTradesResponse {
  trades: MarketTrade[]
}

export const marketApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMarketPrices: builder.query<MarketPricesResult, void>({
      query: () => '/market/prices',
      transformResponse: (response: MarketPricesResponse): MarketPricesResult => {
        const lookup: Record<string, MarketPriceEntry> = {}
        Object.entries(response.primary ?? {}).forEach(([slug, entry]) => {
          lookup[slug] = entry
        })
        Object.entries(response.secondary ?? {}).forEach(([slug, entry]) => {
          lookup[slug] = entry
        })
        return {
          ...response,
          lookup,
        }
      },
      providesTags: ['Market', 'SecondaryResource'],
    }),

    getPriceHistory: builder.query<
      PriceHistoryResponse,
      { resource_type?: string; ticks?: number }
    >({
      query: ({ resource_type = 'tellerium', ticks = 100 }) => ({
        url: '/market/prices/history',
        params: {
          resource_type,
          ticks,
        },
      }),
      providesTags: ['Market'],
    }),

    getMarketStatistics: builder.query<
      MarketStatisticsResponse,
      { resource_type?: string }
    >({
      query: ({ resource_type = 'tellerium' }) => ({
        url: '/market/statistics',
        params: { resource_type },
      }),
      providesTags: ['Market'],
    }),

    getMarketOrders: builder.query<
      MarketOrdersResponse,
      { status?: 'pending' | 'partial' | 'completed' | 'cancelled' | 'expired' }
    >({
      query: ({ status }) => ({
        url: '/market/orders',
        params: status ? { status } : {},
      }),
      providesTags: ['Market', 'MarketOrder'],
    }),

    createMarketOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (data) => ({
        url: '/market/orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Market', 'MarketOrder', 'MarketTrade', 'Planet', 'Resource', 'SecondaryResource'],
    }),

    cancelMarketOrder: builder.mutation<
      { status: string; message: string },
      number
    >({
      query: (orderId) => ({
        url: `/market/orders/${orderId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Market', 'MarketOrder', 'Planet', 'Resource', 'SecondaryResource'],
    }),

    getMarketTrades: builder.query<
      MarketTradesResponse,
      { resource_type?: string; limit?: number }
    >({
      query: ({ resource_type, limit = 50 }) => ({
        url: '/market/trades',
        params: {
          ...(resource_type && { resource_type }),
          limit,
        },
      }),
      providesTags: ['Market', 'MarketTrade'],
    }),
  }),
})

export const {
  useGetMarketPricesQuery,
  useGetPriceHistoryQuery,
  useGetMarketStatisticsQuery,
  useGetMarketOrdersQuery,
  useCreateMarketOrderMutation,
  useCancelMarketOrderMutation,
  useGetMarketTradesQuery,
} = marketApi

