import { apiSlice } from '../apiSlice'
import {
  ApiResponse,
  Planet,
  PaginatedResponse,
  ColonizePlanetRequest,
  BuyMinesRequest,
  BuyProbesRequest,
  CostBreakdown,
  BuildableItems,
  ConstructionQueueResponse,
} from '@/types/api.types'

export const planetsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPlanets: builder.query<{ planets: Planet[] }, void>({
      query: () => '/planets',
      providesTags: ['Planet'],
    }),
    getPlanet: builder.query<{ planet: Planet }, number>({
      query: (id) => `/planets/${Number(id)}`,
      providesTags: (_result, _error, id) => [{ type: 'Planet', id }],
    }),
    colonizePlanet: builder.mutation<ApiResponse<{ planet: Planet }>, ColonizePlanetRequest>({
      query: (data) => ({
        url: '/planets',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Planet', 'Empire', 'Achievement'],
    }),
    buyMines: builder.mutation<
      ApiResponse<{ planet: Planet; cost: { tellerium: number; krypton: number } }>,
      { id: number; data: BuyMinesRequest }
    >({
      query: ({ id, data }) => ({
        url: `/planets/${Number(id)}/buy-mines`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Planet', id },
        { type: 'Resource', id },
        'Planet',
        'Empire',
        'Resource', // Invalidate for real-time resource updates
      ],
    }),
    buyProbes: builder.mutation<
      ApiResponse<{ planet: Planet; cost: { tellerium: number; krypton: number } }>,
      { id: number; data: BuyProbesRequest }
    >({
      query: ({ id, data }) => ({
        url: `/planets/${Number(id)}/buy-probes`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Planet', id },
        { type: 'Resource', id },
        'Planet',
        'Empire',
        'Resource', // Invalidate for real-time resource updates
      ],
    }),
    getCostBreakdown: builder.query<
      CostBreakdown,
      { planetId: number; type: 'mines' | 'probes'; quantity: number }
    >({
      query: ({ planetId, type, quantity }) => ({
        url: `/planets/${Number(planetId)}/cost-breakdown`,
        params: { type, quantity },
      }),
    }),
    searchPlanets: builder.query<
      { planets: Planet[]; total: number; limit: number; offset: number },
      {
        state?: 'unsettled' | 'colony' | 'homeworld'
        quadrant?: number
        sector?: number
        galaxy?: number
        is_habitable?: boolean
        limit?: number
        offset?: number
      }
    >({
      query: (params) => ({
        url: '/planets/search',
        params,
      }),
      providesTags: ['Planet'],
    }),
    findNearbyPlanets: builder.query<
      { planets: Array<Planet & { distance?: number }> },
      void
    >({
      query: () => '/planets/nearby',
      providesTags: ['Planet'],
    }),
    discoverGalaxy: builder.mutation<
      ApiResponse<{ planets: Planet[] }>,
      { quadrant: number; sector: number; galaxy: number }
    >({
      query: ({ quadrant, sector, galaxy }) => ({
        url: `/planets/discover/${Number(quadrant)}/${Number(sector)}/${Number(galaxy)}`,
        method: 'GET',
      }),
      invalidatesTags: ['Planet', 'Universe'],
    }),
    getBuildableItems: builder.query<BuildableItems, number>({
      query: (planetId) => `/planets/${Number(planetId)}/buildable`,
      providesTags: (result, error, planetId) => [
        { type: 'Planet', id: planetId },
        'Buildable',
      ],
    }),
    getConstructionQueue: builder.query<ConstructionQueueResponse, number>({
      query: (planetId) => `/planets/${Number(planetId)}/construction-queue`,
      providesTags: (result, error, planetId) => [
        { type: 'ConstructionQueue', id: planetId },
      ],
    }),
  }),
})

export const {
  useGetPlanetsQuery,
  useGetPlanetQuery,
  useColonizePlanetMutation,
  useBuyMinesMutation,
  useBuyProbesMutation,
  useGetCostBreakdownQuery,
  useSearchPlanetsQuery,
  useFindNearbyPlanetsQuery,
  useDiscoverGalaxyMutation,
  useGetBuildableItemsQuery,
  useGetConstructionQueueQuery,
} = planetsApi

