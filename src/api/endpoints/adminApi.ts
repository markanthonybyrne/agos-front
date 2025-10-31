import { apiSlice } from '../apiSlice'
import {
  AdminUserListResponse,
  AdminUserDetailResponse,
  AdminUser,
  UpdateUserRequest,
  ResetPasswordRequest,
  AssignRoleRequest,
  UserActivityLogResponse,
  AdminEmpireListResponse,
  AdminEmpireDetailResponse,
  AdminEmpire,
  UpdateEmpireRequest,
  TransferEmpireRequest,
  EmpireHistoryResponse,
  AdminPlanetListResponse,
  AdminPlanetDetailResponse,
  AdminPlanet,
  UpdatePlanetRequest,
  TransferPlanetRequest,
  ModifyPlanetResourcesRequest,
  AdminFleetListResponse,
  TeleportFleetRequest,
  AdminAllianceListResponse,
  AdminAlliance,
  UpdateAllianceRequest,
  TransferAllianceLeadershipRequest,
  AdminAllianceChatResponse,
  AdminMailListResponse,
  AdminTickListResponse,
  AdminTickDetailResponse,
  RollbackTickRequest,
  BulkAdjustResourcesRequest,
  BulkAdjustResourcesResponse,
  AdminStatistics,
  AdminCombatListResponse,
  AdminRoleListResponse,
} from '@/types/api.types'

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // User Management
    listUsers: builder.query<
      AdminUserListResponse,
      { page?: number; per_page?: number; search?: string; suspended?: boolean }
    >({
      query: (params = {}) => ({
        url: '/admin/users',
        params,
      }),
      providesTags: ['User'],
    }),
    getUser: builder.query<AdminUserDetailResponse, number>({
      query: (id) => `/admin/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),
    updateUser: builder.mutation<
      { user: AdminUser; message?: string },
      { id: number; data: UpdateUserRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/users/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
    }),
    deleteUser: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    resetUserPassword: builder.mutation<
      { message: string },
      { id: number; data: ResetPasswordRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/users/${id}/reset-password`,
        method: 'POST',
        body: data,
      }),
    }),
    assignRoleToUser: builder.mutation<
      { message: string },
      { id: number; data: AssignRoleRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/users/${id}/roles`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
    }),
    removeRoleFromUser: builder.mutation<
      { message: string },
      { userId: number; roleId: number }
    >({
      query: ({ userId, roleId }) => ({
        url: `/admin/users/${userId}/roles/${roleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { userId }) => [{ type: 'User', id: userId }, 'User'],
    }),
    getUserActivity: builder.query<
      UserActivityLogResponse,
      { id: number; page?: number; per_page?: number }
    >({
      query: ({ id, ...params }) => ({
        url: `/admin/users/${id}/activity`,
        params,
      }),
    }),

    // Empire Management
    listEmpires: builder.query<
      AdminEmpireListResponse,
      { page?: number; per_page?: number; search?: string }
    >({
      query: (params = {}) => ({
        url: '/admin/empires',
        params,
      }),
      providesTags: ['Empire'],
    }),
    getEmpire: builder.query<AdminEmpireDetailResponse, number>({
      query: (id) => `/admin/empires/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Empire', id }],
    }),
    updateEmpire: builder.mutation<
      { empire: AdminEmpire; message?: string },
      { id: number; data: UpdateEmpireRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/empires/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Empire', id }, 'Empire'],
    }),
    deleteEmpire: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/admin/empires/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Empire'],
    }),
    transferEmpire: builder.mutation<
      { message: string },
      { id: number; data: TransferEmpireRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/empires/${id}/transfer`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Empire', id }, 'Empire'],
    }),
    resetEmpireScore: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/admin/empires/${id}/reset-score`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Empire', id }, 'Empire'],
    }),
    getEmpireHistory: builder.query<
      EmpireHistoryResponse,
      { id: number; page?: number; per_page?: number }
    >({
      query: ({ id, ...params }) => ({
        url: `/admin/empires/${id}/history`,
        params,
      }),
    }),

    // Planet Management
    listPlanets: builder.query<
      AdminPlanetListResponse,
      { page?: number; per_page?: number; state?: string; empire_id?: number }
    >({
      query: (params = {}) => ({
        url: '/admin/planets',
        params,
      }),
      providesTags: ['Planet'],
    }),
    getPlanet: builder.query<AdminPlanetDetailResponse, number>({
      query: (id) => `/admin/planets/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Planet', id }],
    }),
    updatePlanet: builder.mutation<
      { planet: AdminPlanet; message?: string },
      { id: number; data: UpdatePlanetRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/planets/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Planet', id }, 'Planet'],
    }),
    deletePlanet: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/admin/planets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Planet'],
    }),
    transferPlanet: builder.mutation<
      { message: string },
      { id: number; data: TransferPlanetRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/planets/${id}/transfer`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Planet', id }, 'Planet'],
    }),
    resetPlanet: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/admin/planets/${id}/reset`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Planet', id }, 'Planet'],
    }),
    modifyPlanetResources: builder.mutation<
      { message: string },
      { id: number; data: ModifyPlanetResourcesRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/planets/${id}/resources`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Planet', id }, 'Planet'],
    }),

    // Fleet Management
    listFleets: builder.query<
      AdminFleetListResponse,
      { page?: number; per_page?: number; empire_id?: number; status?: string }
    >({
      query: (params = {}) => ({
        url: '/admin/fleets',
        params,
      }),
      providesTags: ['Fleet'],
    }),
    deleteFleet: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/admin/fleets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Fleet'],
    }),
    teleportFleet: builder.mutation<
      { message: string },
      { id: number; data: TeleportFleetRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/fleets/${id}/teleport`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Fleet', id }, 'Fleet'],
    }),

    // Alliance Management
    listAlliances: builder.query<
      AdminAllianceListResponse,
      { page?: number; per_page?: number }
    >({
      query: (params = {}) => ({
        url: '/admin/alliances',
        params,
      }),
      providesTags: ['Alliance'],
    }),
    updateAlliance: builder.mutation<
      { alliance: AdminAlliance; message?: string },
      { id: number; data: UpdateAllianceRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/alliances/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Alliance', id }, 'Alliance'],
    }),
    deleteAlliance: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/admin/alliances/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Alliance'],
    }),
    transferAllianceLeadership: builder.mutation<
      { message: string },
      { id: number; data: TransferAllianceLeadershipRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/alliances/${id}/transfer-leadership`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Alliance', id }, 'Alliance'],
    }),
    getAllianceChat: builder.query<
      AdminAllianceChatResponse,
      { id: number; page?: number; per_page?: number }
    >({
      query: ({ id, ...params }) => ({
        url: `/admin/alliances/${id}/chat`,
        params,
      }),
    }),
    deleteAllianceChatMessage: builder.mutation<
      { message: string },
      { allianceId: number; messageId: number }
    >({
      query: ({ allianceId, messageId }) => ({
        url: `/admin/alliances/${allianceId}/chat/${messageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Alliance'],
    }),

    // Mail Moderation
    listMail: builder.query<
      AdminMailListResponse,
      { page?: number; per_page?: number; from_empire_id?: number; to_empire_id?: number }
    >({
      query: (params = {}) => ({
        url: '/admin/mail',
        params,
      }),
      providesTags: ['Mail'],
    }),
    deleteMail: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/admin/mail/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Mail'],
    }),

    // Signal Moderation
    deleteSignal: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/admin/signals/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Signal'],
    }),

    // Tick Management
    listTicks: builder.query<
      AdminTickListResponse,
      { page?: number; per_page?: number }
    >({
      query: (params = {}) => ({
        url: '/admin/ticks',
        params,
      }),
      providesTags: ['Tick'],
    }),
    getTick: builder.query<AdminTickDetailResponse, number>({
      query: (tickNumber) => `/admin/ticks/${tickNumber}`,
      providesTags: (_result, _error, tickNumber) => [{ type: 'Tick', id: tickNumber }],
    }),
    rollbackTick: builder.mutation<{ message: string }, RollbackTickRequest>({
      query: (data) => ({
        url: '/admin/ticks/rollback',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tick', 'Empire', 'Planet', 'Fleet'],
    }),

    // Resource Management
    bulkAdjustResources: builder.mutation<
      BulkAdjustResourcesResponse,
      BulkAdjustResourcesRequest
    >({
      query: (data) => ({
        url: '/admin/resources/bulk-adjust',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Planet', 'Resource'],
    }),

    // Statistics
    getStatistics: builder.query<AdminStatistics, void>({
      query: () => '/admin/statistics/detailed',
      providesTags: ['Statistics'],
    }),

    // Combat Management
    listCombats: builder.query<
      AdminCombatListResponse,
      { page?: number; per_page?: number; tick_number?: number }
    >({
      query: (params = {}) => ({
        url: '/admin/combats',
        params,
      }),
      providesTags: ['CombatLog'],
    }),
    deleteCombat: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/admin/combats/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CombatLog'],
    }),

    // Roles
    listRoles: builder.query<AdminRoleListResponse, void>({
      query: () => '/admin/roles',
      providesTags: ['Role'],
    }),
  }),
})

export const {
  // Users
  useListUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useResetUserPasswordMutation,
  useAssignRoleToUserMutation,
  useRemoveRoleFromUserMutation,
  useGetUserActivityQuery,
  // Empires
  useListEmpiresQuery,
  useGetEmpireQuery,
  useUpdateEmpireMutation,
  useDeleteEmpireMutation,
  useTransferEmpireMutation,
  useResetEmpireScoreMutation,
  useGetEmpireHistoryQuery,
  // Planets
  useListPlanetsQuery,
  useGetPlanetQuery,
  useUpdatePlanetMutation,
  useDeletePlanetMutation,
  useTransferPlanetMutation,
  useResetPlanetMutation,
  useModifyPlanetResourcesMutation,
  // Fleets
  useListFleetsQuery,
  useDeleteFleetMutation,
  useTeleportFleetMutation,
  // Alliances
  useListAlliancesQuery,
  useUpdateAllianceMutation,
  useDeleteAllianceMutation,
  useTransferAllianceLeadershipMutation,
  useGetAllianceChatQuery,
  useDeleteAllianceChatMessageMutation,
  // Mail
  useListMailQuery,
  useDeleteMailMutation,
  // Signals
  useDeleteSignalMutation,
  // Ticks
  useListTicksQuery,
  useGetTickQuery,
  useRollbackTickMutation,
  // Resources
  useBulkAdjustResourcesMutation,
  // Statistics
  useGetStatisticsQuery,
  // Combats
  useListCombatsQuery,
  useDeleteCombatMutation,
  // Roles
  useListRolesQuery,
} = adminApi

