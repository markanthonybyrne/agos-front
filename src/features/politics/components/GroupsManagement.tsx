import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useGetAllianceGroupsQuery, useCreateAllianceGroupMutation, useUpdateAllianceGroupMutation, useDeleteAllianceGroupMutation } from '@/api/endpoints/alliancesApi'
import { useGetAllianceMembersQuery } from '@/api/endpoints/alliancesApi'
import { useAlliancePermissions } from '@/hooks/useAlliancePermissions'
import { Users, Plus, Edit, Trash2, AlertCircle, Crown, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { AlliancePermissions } from '@/types/api.types'
import { GroupForm } from './GroupForm'

interface GroupsManagementProps {
  allianceId: number
}

export function GroupsManagement({ allianceId }: GroupsManagementProps) {
  const permissions = useAlliancePermissions(allianceId)
  const [editingGroup, setEditingGroup] = useState<number | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: groupsData, isLoading } = useGetAllianceGroupsQuery(allianceId)
  const { data: membersData } = useGetAllianceMembersQuery(allianceId)
  const [deleteGroup] = useDeleteAllianceGroupMutation()

  if (permissions.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!permissions.canManageGroups && !permissions.isLeader) {
    return (
      <Card className="panel-glass border-red-500/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-400">Access Denied</h3>
          <p className="text-muted-foreground text-center">
            You don't have permission to manage groups
          </p>
        </CardContent>
      </Card>
    )
  }

  const groups = groupsData?.groups || []
  const members = membersData?.members || []

  const handleDelete = async (groupId: number) => {
    if (!confirm('Are you sure you want to delete this group?')) return

    try {
      await deleteGroup({ allianceId, groupId }).unwrap()
      toast.success('Group deleted successfully')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete group')
    }
  }

  const getPermissionBadges = (permissions: AlliancePermissions) => {
    const activePermissions = Object.entries(permissions)
      .filter(([_, value]) => value)
      .map(([key]) => key.replace('_', ' '))
    
    return activePermissions.length > 0 ? activePermissions : ['No permissions']
  }

  return (
    <div className="space-y-6">
      <Card className="panel-glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Groups ({groups.length})
              </CardTitle>
              <CardDescription>
                Manage permission groups for your alliance
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No groups created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <Card key={group.id} className="panel-glass border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {group.name === 'Leader' ? (
                          <Crown className="w-5 h-5 text-yellow-400" />
                        ) : (
                          <Shield className="w-5 h-5 text-blue-400" />
                        )}
                        {group.name}
                      </CardTitle>
                      {group.name !== 'Leader' && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingGroup(group.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(group.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Members */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Members ({group.members.length})</h4>
                      {group.members.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No members</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {group.members.map((member) => (
                            <Badge key={member.id} variant="outline">
                              {member.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Permissions */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Permissions</h4>
                      <div className="flex flex-wrap gap-2">
                        {getPermissionBadges(group.permissions).map((perm) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Group Dialog */}
      <GroupForm
        allianceId={allianceId}
        members={members}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* Edit Group Dialog */}
      {editingGroup && (
        <GroupForm
          allianceId={allianceId}
          members={members}
          group={groups.find(g => g.id === editingGroup)}
          open={!!editingGroup}
          onOpenChange={(open) => !open && setEditingGroup(null)}
        />
      )}
    </div>
  )
}

