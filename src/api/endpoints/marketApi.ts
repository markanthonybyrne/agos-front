import { apiSlice } from '../apiSlice'

export interface MarketPrice {
  price: number
  resource_type: 'tellerium' | 'krypton'
}

export interface MarketPrices {
  tellerium: MarketPrice
  krypton: MarketPrice
}

export interface PriceHistoryEntry {
  tick_number: number
  price: number
  supply: number
  demand: number
  traded_volume: number
  created_at: string
}

export interface PriceHistory {
  resource_type: 'tellerium' | 'krypton'
  ticks: number
  history: PriceHistoryEntry[]
}

export interface MarketStatistics {
  resource_type: 'tellerium' | 'krypton'
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
  resource_type: 'tellerium' | 'krypton'
  quantity: number
  filled_quantity: number
  remaining_quantity: number
  price_limit: number | null
  status: 'pending' | 'partial' | 'completed' | 'cancelled'
  expires_at: string
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
  resource_type: 'tellerium' | 'krypton'
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
  resource_type: 'tellerium' | 'krypton'
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
    getMarketPrices: builder.query<MarketPrices, void>({
      query: () => '/market/prices',
      providesTags: ['Market'],
    }),

    getPriceHistory: builder.query<
      PriceHistory,
      { resource_type?: 'tellerium' | 'krypton'; ticks?: number }
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
      MarketStatistics,
      { resource_type?: 'tellerium' | 'krypton' }
    >({
      query: ({ resource_type = 'tellerium' }) => ({
        url: '/market/statistics',
        params: { resource_type },
      }),
      providesTags: ['Market'],
    }),

    getMarketOrders: builder.query<
      MarketOrdersResponse,
      { status?: 'pending' | 'partial' | 'completed' | 'cancelled' }
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
      invalidatesTags: ['Market', 'MarketOrder', 'MarketTrade', 'Planet', 'Resource'],
    }),

    cancelMarketOrder: builder.mutation<
      { status: string; message: string },
      number
    >({
      query: (orderId) => ({
        url: `/market/orders/${orderId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Market', 'MarketOrder', 'Planet', 'Resource'],
    }),

    getMarketTrades: builder.query<
      MarketTradesResponse,
      { resource_type?: 'tellerium' | 'krypton'; limit?: number }
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

