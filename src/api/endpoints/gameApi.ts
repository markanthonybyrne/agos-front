import { apiSlice } from '../apiSlice'

export interface TickInfoResponse {
  current_tick: number
  next_tick_eta: number // Seconds until next tick (relative)
  next_tick_at: string // ISO 8601 timestamp (absolute)
  tick_interval: number // Duration in seconds between ticks
  last_tick_at: string | null
  timestamp: string
}

export const gameApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTickInfo: builder.query<TickInfoResponse, void>({
      query: () => '/game/tick-info',
      providesTags: ['Tick'],
    }),
  }),
})

export const { useGetTickInfoQuery } = gameApi

