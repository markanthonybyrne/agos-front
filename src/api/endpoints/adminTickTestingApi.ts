import { apiSlice } from '../apiSlice'
import {
  DryRunTickRequest,
  DryRunTickResponse,
  SandboxTickRequest,
  SandboxTickResponse,
  CompareTickResultsRequest,
  CompareTickResultsResponse,
} from '@/types/api.types'

export const adminTickTestingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Dry-Run Tick Processing
    dryRunTick: builder.mutation<DryRunTickResponse, DryRunTickRequest>({
      query: (data) => ({
        url: '/admin/tick/dry-run',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['TickTest'],
    }),

    // Sandbox Tick Processing
    sandboxTick: builder.mutation<SandboxTickResponse, SandboxTickRequest>({
      query: (data) => ({
        url: '/admin/tick/sandbox',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['TickTest'],
    }),

    // Compare Tick Results
    compareTickResults: builder.mutation<
      CompareTickResultsResponse,
      CompareTickResultsRequest
    >({
      query: (data) => ({
        url: '/admin/tick/compare',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['TickTest'],
    }),
  }),
})

export const {
  useDryRunTickMutation,
  useSandboxTickMutation,
  useCompareTickResultsMutation,
} = adminTickTestingApi

