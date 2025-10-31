import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { useGetAllianceQuery, useGetAllianceGroupsQuery } from '@/api/endpoints/alliancesApi'
import { AlliancePermissions } from '@/types/api.types'

export interface UseAlliancePermissionsResult {
  canManageFund: boolean
  canRecruitMembers: boolean
  canKickMembers: boolean
  canManageGroups: boolean
  canEditGlobalOptions: boolean
  canViewJoinRequests: boolean
  canViewStatus: boolean
  isLeader: boolean
  isLoading: boolean
}

export function useAlliancePermissions(allianceId: number | null | undefined): UseAlliancePermissionsResult {
  const { empire } = useAuth()
  
  const { data: allianceData, isLoading: isLoadingAlliance } = useGetAllianceQuery(allianceId!, {
    skip: !allianceId || !empire?.alliance_id || empire.alliance_id !== allianceId,
  })
  
  const { data: groupsData, isLoading: isLoadingGroups } = useGetAllianceGroupsQuery(allianceId!, {
    skip: !allianceId || !empire?.alliance_id || empire.alliance_id !== allianceId,
  })

  const permissions = useMemo(() => {
    // Default: no permissions
    const defaultPermissions: UseAlliancePermissionsResult = {
      canManageFund: false,
      canRecruitMembers: false,
      canKickMembers: false,
      canManageGroups: false,
      canEditGlobalOptions: false,
      canViewJoinRequests: false,
      canViewStatus: false,
      isLeader: false,
      isLoading: isLoadingAlliance || isLoadingGroups,
    }

    // If no alliance ID or user not in alliance, return no permissions
    if (!allianceId || !empire?.alliance_id || empire.alliance_id !== allianceId) {
      return defaultPermissions
    }

    // If loading, return default with loading flag
    if (isLoadingAlliance || isLoadingGroups || !allianceData?.alliance) {
      return defaultPermissions
    }

    const alliance = allianceData.alliance
    
    // Check if user is the leader - compare as numbers to handle type mismatches
    const leaderId = Number(alliance.leader.id)
    const empireId = Number(empire.id)
    const isLeader = leaderId === empireId
    
    // Debug logging
    if (import.meta.env.DEV) {
      console.log('Permission check:', {
        allianceId,
        leaderId,
        empireId,
        isLeader,
        allianceLeader: alliance.leader,
        empire: { id: empire.id, name: empire.name }
      })
    }
    
    // Leaders have all permissions
    if (isLeader) {
      return {
        canManageFund: true,
        canRecruitMembers: true,
        canKickMembers: true,
        canManageGroups: true,
        canEditGlobalOptions: true,
        canViewJoinRequests: true,
        canViewStatus: true,
        isLeader: true,
        isLoading: false,
      }
    }

    // Check user's groups and their permissions
    const groups = groupsData?.groups || []
    const userEmpireId = Number(empire.id)
    
    // Find all groups the user is in
    const userGroups = groups.filter(group => 
      group.members.some(member => Number(member.id) === userEmpireId)
    )

    // Aggregate permissions from all groups
    const aggregatedPermissions: AlliancePermissions = {
      manage_fund: false,
      recruit_members: false,
      kick_members: false,
      manage_groups: false,
      edit_global_options: false,
      view_join_requests: false,
      view_status: false,
    }

    userGroups.forEach(group => {
      Object.keys(group.permissions).forEach(key => {
        if (group.permissions[key as keyof AlliancePermissions]) {
          aggregatedPermissions[key as keyof AlliancePermissions] = true
        }
      })
    })

    return {
      canManageFund: aggregatedPermissions.manage_fund,
      canRecruitMembers: aggregatedPermissions.recruit_members,
      canKickMembers: aggregatedPermissions.kick_members,
      canManageGroups: aggregatedPermissions.manage_groups,
      canEditGlobalOptions: aggregatedPermissions.edit_global_options,
      canViewJoinRequests: aggregatedPermissions.view_join_requests,
      canViewStatus: aggregatedPermissions.view_status,
      isLeader: false,
      isLoading: false,
    }
  }, [allianceId, empire?.id, empire?.alliance_id, allianceData, groupsData, isLoadingAlliance, isLoadingGroups])

  return permissions
}

