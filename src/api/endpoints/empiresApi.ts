import { apiSlice } from '../apiSlice'
import {
  ApiResponse,
  Empire,
  Planet,
  Fleet,
  PaginatedResponse,
  CombatLog,
  EmpireState,
  EraProgression,
  DarkMatterInfo,
  ResearchEffectsSummary,
  SelectSpecializationRequest,
  SelectSpecializationResponse,
  TechTreeApiResponse,
  TechPathRequest,
  TechPathResponse,
} from '@/types/api.types'

export const empiresApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEmpires: builder.query<
      { data: Empire[]; meta: { current_page: number; per_page: number; total: number; last_page: number } },
      { q?: string; page?: number; per_page?: number }
    >({
      query: (params) => ({
        url: '/empires',
        params,
      }),
      providesTags: ['Empire'],
    }),
    getEmpire: builder.query<{ empire: Empire & { planets: Planet[]; fleets: Fleet[] } }, number>(
      {
        query: (id) => `/empires/${id}`,
        providesTags: (_result, _error, id) => [{ type: 'Empire', id }],
      }
    ),
    getCombatLogs: builder.query<{ combat_logs: CombatLog[] }, number>({
      query: (empireId) => `/empires/${empireId}/combat-logs`,
      providesTags: (result, _error, empireId) => [
        { type: 'CombatLog', id: 'LIST' },
        { type: 'CombatLog', id: `empire-${empireId}` },
      ],
    }),
    // Tech Tree System Endpoints
    getEmpireState: builder.query<EmpireState, void>({
      query: () => '/empire/state',
      providesTags: ['Empire'],
    }),
    selectSpecialization: builder.mutation<
      ApiResponse<SelectSpecializationResponse>,
      SelectSpecializationRequest
    >({
      query: (data) => ({
        url: '/empire/specializations/select',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Empire'],
    }),
    getEraProgression: builder.query<EraProgression, void>({
      query: () => '/empire/era-progression',
      providesTags: ['Empire'],
    }),
    getDarkMatterInfo: builder.query<DarkMatterInfo, void>({
      query: () => '/empire/dark-matter',
      providesTags: ['Empire'],
    }),
    getTechTree: builder.query<TechTreeApiResponse, void>({
      query: () => '/empire/tech-tree',
      providesTags: ['Empire', 'Facility', 'Research', 'Ship', 'Defence'],
    }),
    getTechPath: builder.query<TechPathResponse, TechPathRequest>({
      query: (params) => ({
        url: '/empire/tech-path',
        params: {
          target_node_id: params.target_node_id,
          specialization_filter: params.specialization_filter,
        },
      }),
      providesTags: ['Empire'],
    }),
  }),
})

export const {
  useGetEmpiresQuery,
  useGetEmpireQuery,
  useGetCombatLogsQuery,
  useGetEmpireStateQuery,
  useSelectSpecializationMutation,
  useGetEraProgressionQuery,
  useGetDarkMatterInfoQuery,
  useGetTechTreeQuery,
  useGetTechPathQuery,
} = empiresApi

