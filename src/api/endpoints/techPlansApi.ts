import { apiSlice } from '../apiSlice'
import type {
  AdvisorSuggestionMutationRequest,
  CreateTechPlanRequest,
  DeleteTechPlanRequest,
  TechAdvisorStateDto,
  TechPlanDto,
  UpdateTechAdvisorStateRequest,
  UpdateTechPlanNodesRequest,
  UpdateTechPlanRequest,
} from '@/types/api.types'

export const techPlansApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTechPlans: builder.query<TechPlanDto[], void>({
      query: () => '/tech-plans',
      providesTags: (result) =>
        result && result.length > 0
          ? [
              ...result.map((plan) => ({ type: 'TechPlan' as const, id: plan.id })),
              { type: 'TechPlan' as const, id: 'LIST' },
            ]
          : [{ type: 'TechPlan' as const, id: 'LIST' }],
    }),
    createTechPlan: builder.mutation<TechPlanDto, CreateTechPlanRequest>({
      query: (body) => ({
        url: '/tech-plans',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'TechPlan', id: 'LIST' }],
    }),
    updateTechPlan: builder.mutation<TechPlanDto, UpdateTechPlanRequest>({
      query: ({ id, ...body }) => ({
        url: `/tech-plans/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'TechPlan', id },
        { type: 'TechPlan', id: 'LIST' },
      ],
    }),
    updateTechPlanNodes: builder.mutation<TechPlanDto, UpdateTechPlanNodesRequest>({
      query: ({ id, ...body }) => ({
        url: `/tech-plans/${id}/nodes`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'TechPlan', id },
        { type: 'TechPlan', id: 'LIST' },
      ],
    }),
    deleteTechPlan: builder.mutation<void, DeleteTechPlanRequest>({
      query: ({ id, ...body }) => ({
        url: `/tech-plans/${id}`,
        method: 'DELETE',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'TechPlan', id },
        { type: 'TechPlan', id: 'LIST' },
      ],
    }),
    getTechAdvisorState: builder.query<TechAdvisorStateDto, void>({
      query: () => '/tech-advisor/state',
      providesTags: [{ type: 'TechAdvisorState', id: 'STATE' }],
    }),
    updateTechAdvisorState: builder.mutation<TechAdvisorStateDto, UpdateTechAdvisorStateRequest>({
      query: (body) => ({
        url: '/tech-advisor/state',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'TechAdvisorState', id: 'STATE' }],
    }),
    dismissAdvisorSuggestion: builder.mutation<TechAdvisorStateDto, AdvisorSuggestionMutationRequest>({
      query: (body) => ({
        url: '/tech-advisor/dismiss',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'TechAdvisorState', id: 'STATE' }],
    }),
    pinAdvisorSuggestion: builder.mutation<TechAdvisorStateDto, AdvisorSuggestionMutationRequest>({
      query: (body) => ({
        url: '/tech-advisor/pin',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'TechAdvisorState', id: 'STATE' }],
    }),
  }),
})

export const {
  useGetTechPlansQuery,
  useCreateTechPlanMutation,
  useUpdateTechPlanMutation,
  useUpdateTechPlanNodesMutation,
  useDeleteTechPlanMutation,
  useGetTechAdvisorStateQuery,
  useUpdateTechAdvisorStateMutation,
  useDismissAdvisorSuggestionMutation,
  usePinAdvisorSuggestionMutation,
} = techPlansApi

