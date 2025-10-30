import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useGetAllianceMembersQuery, useKickAllianceMemberMutation, useTransferAllianceLeadershipMutation } from '@/api/endpoints/alliancesApi'
import { useAlliancePermissions } from '@/hooks/useAlliancePermissions'
import { useAuth } from '@/hooks/useAuth'
import { Users, Mail, Circle, Crown, UserMinus, ArrowRightLeft } from 'lucide-react'
import { formatCoordinate } from '@/lib/coordinates'
import { formatNumber } from '@/lib/formatters'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom'

interface MemberListProps {
  allianceId: number
}

export function MemberList({ allianceId }: MemberListProps) {
  const navigate = useNavigate()
  const { empire } = useAuth()
  const permissions = useAlliancePermissions(allianceId)
  const [kickTarget, setKickTarget] = useState<number | null>(null)
  const [transferTarget, setTransferTarget] = useState<number | null>(null)
  
  const { data, isLoading, error } = useGetAllianceMembersQuery(allianceId)
  const [kickMember] = useKickAllianceMemberMutation()
  const [transferLeadership] = useTransferAllianceLeadershipMutation()

  const handleKick = async (memberId: number) => {
    try {
      await kickMember({ allianceId, memberId }).unwrap()
      toast.success('Member removed from alliance')
      setKickTarget(null)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to remove member')
    }
  }

  const handleTransfer = async (newLeaderId: number) => {
    try {
      await transferLeadership({ allianceId, newLeaderId }).unwrap()
      toast.success('Leadership transferred successfully')
      setTransferTarget(null)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to transfer leadership')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (error || !data?.members) {
    return (
      <Card className="panel-glass border-red-500/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-400">Error Loading Members</h3>
          <p className="text-muted-foreground text-center">
            Failed to load alliance members
          </p>
        </CardContent>
      </Card>
    )
  }

  const members = data.members

  const handleSendMail = (memberId: number) => {
    navigate(`/mail?to=${memberId}`)
  }

  return (
    <>
      <Card className="panel-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Member List ({members.length})
          </CardTitle>
          <CardDescription>
            Sorted by score (highest first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Online Status */}
                  <div className="relative">
                    <Circle
                      className={`w-3 h-3 ${member.online ? 'text-green-400 fill-green-400' : 'text-muted-foreground'}`}
                    />
                  </div>

                  {/* Member Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{member.name}</span>
                      {member.role === 'leader' && (
                        <Crown className="w-4 h-4 text-yellow-400" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendMail(member.id)}
                        className="h-6 px-2 text-xs"
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Mail
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>Score: {formatNumber(member.score)}</span>
                      <span>Planets: {member.planets_owned}</span>
                      <span>
                        Homeworld: {member.homeworld.name} ({formatCoordinate({
                          quadrant: member.homeworld.quadrant,
                          sector: member.homeworld.sector,
                          galaxy: member.homeworld.galaxy,
                          planet: member.homeworld.planet
                        })})
                      </span>
                    </div>
                  </div>

                  {/* Role & Percentile */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {member.role}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Top {Math.round(member.percentile)}%
                    </Badge>
                    
                    {/* Actions */}
                    {permissions.isLeader && member.id !== empire?.id && (
                      <div className="flex gap-1 ml-2">
                        {member.role !== 'leader' && (
                          <>
                            {permissions.canKickMembers && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setKickTarget(member.id)}
                                className="h-7 px-2 text-xs text-red-400 hover:text-red-300"
                              >
                                <UserMinus className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setTransferTarget(member.id)}
                              className="h-7 px-2 text-xs text-yellow-400 hover:text-yellow-300"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                    {!permissions.isLeader && permissions.canKickMembers && member.id !== empire?.id && member.role !== 'leader' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setKickTarget(member.id)}
                        className="h-7 px-2 text-xs text-red-400 hover:text-red-300"
                      >
                        <UserMinus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kick Confirmation Dialog */}
      <Dialog open={kickTarget !== null} onOpenChange={(open) => !open && setKickTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {members.find(m => m.id === kickTarget)?.name} from the alliance?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKickTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => kickTarget && handleKick(kickTarget)}
            >
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Leadership Dialog */}
      <Dialog open={transferTarget !== null} onOpenChange={(open) => !open && setTransferTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Leadership?</DialogTitle>
            <DialogDescription>
              Are you sure you want to transfer leadership to {members.find(m => m.id === transferTarget)?.name}?
              You will become a regular member and lose leader privileges.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => transferTarget && handleTransfer(transferTarget)}
            >
              Transfer Leadership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

