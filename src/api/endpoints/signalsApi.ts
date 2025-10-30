import { apiSlice } from '../apiSlice'
import {
  ApiResponse,
  TachyonSignal,
  CreateSignalRequest,
  SignalStatistics,
} from '@/types/api.types'

export const signalsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    launchSignal: builder.mutation<ApiResponse<{ signal: TachyonSignal }>, CreateSignalRequest>({
      query: (data) => ({
        url: '/signals',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Signal', 'Planet', 'Empire'],
    }),
    getSignals: builder.query<{ signals: TachyonSignal[] }, void>({
      query: () => '/signals',
      providesTags: ['Signal'],
    }),
    getSignalDetails: builder.query<ApiResponse<{ signal: TachyonSignal }>, number>({
      query: (id) => `/signals/${Number(id)}`,
      providesTags: (result, error, id) => [{ type: 'Signal', id: Number(id) }],
    }),
    getSignalStatistics: builder.query<SignalStatistics, void>({
      query: () => '/signals/statistics',
      providesTags: ['Signal'],
    }),
  }),
})

export const { 
  useLaunchSignalMutation, 
  useGetSignalsQuery,
  useGetSignalDetailsQuery,
  useGetSignalStatisticsQuery,
} = signalsApi

