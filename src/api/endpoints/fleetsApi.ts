import { apiSlice } from '../apiSlice'
import { 
  ApiResponse, 
  FleetDetails, 
  CreateFleetRequest, 
  MoveFleetRequest,
  TravelTimeRequest,
  TravelTime,
  TravelEstimate,
  PaginatedResponse 
} from '@/types/api.types'

export const fleetsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFleets: builder.query<{ fleets: FleetDetails[] }, void>({
      query: () => '/fleets',
      providesTags: ['Fleet'],
    }),
    getFleet: builder.query<{ fleet: FleetDetails }, number>({
      query: (id) => `/fleets/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Fleet', id }],
    }),
    createFleet: builder.mutation<ApiResponse<{ fleet: FleetDetails }>, CreateFleetRequest>({
      query: (data) => ({
        url: '/fleets',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Fleet', 'Planet', 'Empire'],
    }),
    cancelFleet: builder.mutation<ApiResponse<{ fleet: { id: number; status: string } }>, number>({
      query: (id) => ({
        url: `/fleets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Fleet', 'Planet'],
    }),
    moveFleet: builder.mutation<ApiResponse<{ fleet: FleetDetails }>, { id: number; data: MoveFleetRequest }>({
      query: ({ id, data }) => ({
        url: `/fleets/${id}/move`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Fleet', 'Planet'],
    }),
    getTravelTime: builder.mutation<TravelTime, TravelTimeRequest>({
      query: (data) => ({
        url: '/fleets/travel-time',
        method: 'POST',
        body: data,
      }),
    }),
    getTravelEstimates: builder.query<{ estimates: TravelEstimate[] }, {
      origin_quadrant: number
      origin_sector: number
      origin_galaxy: number
      destination_quadrant: number
      destination_sector: number
      destination_galaxy: number
    }>({
      query: (params) => ({
        url: '/fleets/travel-estimates',
        params,
      }),
    }),
  }),
})

export const { 
  useGetFleetsQuery, 
  useGetFleetQuery, 
  useCreateFleetMutation, 
  useCancelFleetMutation,
  useMoveFleetMutation,
  useGetTravelTimeMutation,
  useGetTravelEstimatesQuery,
} = fleetsApi

