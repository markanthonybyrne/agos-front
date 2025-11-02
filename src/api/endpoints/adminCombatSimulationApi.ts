import { apiSlice } from '../apiSlice'
import {
  SimulateCombatRequest,
  SimulateCombatResponse,
  BatchSimulateCombatRequest,
  BatchSimulateCombatResponse,
  TestFleetAgainstDefencesRequest,
  TestFleetAgainstDefencesResponse,
  TestDefenceAgainstFleetsRequest,
  TestDefenceAgainstFleetsResponse,
} from '@/types/api.types'

export const adminCombatSimulationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Single Combat Simulation
    simulateCombat: builder.mutation<SimulateCombatResponse, SimulateCombatRequest>({
      query: (data) => ({
        url: '/admin/combats/simulate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CombatSimulation'],
    }),

    // Batch Combat Simulation
    batchSimulateCombat: builder.mutation<
      BatchSimulateCombatResponse,
      BatchSimulateCombatRequest
    >({
      query: (data) => ({
        url: '/admin/combats/simulate/batch',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CombatSimulation'],
    }),

    // Test Fleet Against Defences
    testFleetAgainstDefences: builder.mutation<
      TestFleetAgainstDefencesResponse,
      TestFleetAgainstDefencesRequest
    >({
      query: (data) => ({
        url: '/admin/combats/simulate/test-fleet',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CombatSimulation'],
    }),

    // Test Defence Against Fleets
    testDefenceAgainstFleets: builder.mutation<
      TestDefenceAgainstFleetsResponse,
      TestDefenceAgainstFleetsRequest
    >({
      query: (data) => ({
        url: '/admin/combats/simulate/test-defence',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CombatSimulation'],
    }),
  }),
})

export const {
  useSimulateCombatMutation,
  useBatchSimulateCombatMutation,
  useTestFleetAgainstDefencesMutation,
  useTestDefenceAgainstFleetsMutation,
} = adminCombatSimulationApi

