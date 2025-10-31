import { apiSlice } from '../apiSlice'
import {
  ApiResponse,
  ShipDefinition,
  Ship,
  BuildShipRequest,
} from '@/types/api.types'

export const shipsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getShipDefinitions: builder.query<{ ships: ShipDefinition[] }, void>({
      query: () => '/ships/definitions',
      providesTags: ['Ship'],
    }),
    getPlanetShips: builder.query<{ ships: Ship[] }, number>({
      query: (planetId) => `/planets/${Number(planetId)}/ships`,
      providesTags: (result, error, planetId) => [
        { type: 'Ship', id: planetId },
      ],
    }),
    buildShips: builder.mutation<
      ApiResponse<{ ships_built: number; total_cost: { tellerium: number; krypton: number } }>,
      { planetId: number; data: BuildShipRequest }
    >({
      query: ({ planetId, data }) => ({
        url: `/planets/${Number(planetId)}/ships/build`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { planetId }) => [
        { type: 'Ship', id: planetId },
        'Planet',
        'Buildable',
      ],
    }),
    cancelShipConstruction: builder.mutation<
      ApiResponse<{ message: string; refund: { tellerium: number; krypton: number } }>,
      { planetId: number; constructionId: number }
    >({
      query: ({ planetId, constructionId }) => ({
        url: `/planets/${Number(planetId)}/ships/${constructionId}/cancel`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { planetId }) => [
        { type: 'Ship', id: planetId },
        'Planet',
        'Buildable',
      ],
    }),
  }),
})

export const {
  useGetShipDefinitionsQuery,
  useGetPlanetShipsQuery,
  useBuildShipsMutation,
  useCancelShipConstructionMutation,
} = shipsApi
