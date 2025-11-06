import { apiSlice } from '../apiSlice'
import { 
  ApiResponse, 
  Incident, 
  InteractIncidentRequest, 
  InteractIncidentResponse,
  IncidentInteraction
} from '@/types/api.types'

export const incidentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getIncidents: builder.query<{ incidents: Incident[] }, { region?: number; system?: number } | void>({
      query: (params) => ({
        url: '/incidents',
        params: params && typeof params === 'object' ? params : undefined,
      }),
      providesTags: ['Incident'],
    }),
    getIncident: builder.query<{ incident: Incident }, number>({
      query: (id) => `/incidents/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Incident', id }],
    }),
    getNearbyIncidents: builder.query<{ incidents: Incident[] }, {
      x: number
      y: number
      radius?: number
    }>({
      query: (params) => ({
        url: '/incidents/nearby',
        params: {
          ...params,
          radius: params.radius || 100,
        },
      }),
    }),
    interactIncident: builder.mutation<InteractIncidentResponse, {
      id: number
      data: InteractIncidentRequest
    }>({
      query: ({ id, data }) => ({
        url: `/incidents/${id}/interact`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Incident', 'Fleet'],
    }),
    getMyInteractions: builder.query<{ interactions: IncidentInteraction[] }, void>({
      query: () => '/incidents/my-interactions',
      providesTags: ['Incident'],
    }),
  }),
})

export const {
  useGetIncidentsQuery,
  useGetIncidentQuery,
  useGetNearbyIncidentsQuery,
  useInteractIncidentMutation,
  useGetMyInteractionsQuery,
} = incidentsApi

