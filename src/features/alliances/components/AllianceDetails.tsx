import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGetAllianceDetailsQuery } from '@/api/endpoints/alliancesApi'
import { formatNumber, formatDateTime } from '@/lib/formatters'
import { 
  Users, 
  Crown, 
  Shield,
  Trophy,
  Star,
  Calendar,
  MapPin,
  DollarSign,
  MessageSquare,
  Settings,
  UserPlus,
  UserMinus,
  X
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AllianceChat } from './AllianceChat'

interface AllianceDetailsProps {
  allianceId: number
  isMyAlliance: boolean
  onClose?: () => void
}

export function AllianceDetails({ allianceId, isMyAlliance, onClose }: AllianceDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'chat'>('overview')
  
  // Ensure allianceId is always a number
  const numericAllianceId = Number(allianceId)
  console.log('AllianceDetails - allianceId:', allianceId, 'type:', typeof allianceId, 'numeric:', numericAllianceId)
  
  const { data: allianceData, isLoading, error } = useGetAllianceDetailsQuery(numericAllianceId)
  const alliance = allianceData?.alliance

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'leader':
        return <Crown className="w-4 h-4 text-yellow-400" />
      case 'officer':
        return <Shield className="w-4 h-4 text-blue-400" />
      case 'member':
        return <Users className="w-4 h-4 text-green-400" />
      default:
        return <Users className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'leader':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'officer':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'member':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return 'bg-muted/20 text-muted-foreground border-border'
    }
  }

  if (error) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] panel-glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-400" />
              Error Loading Alliance
            </DialogTitle>
            <DialogDescription>
              Failed to load alliance details. Please try again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const content = (
    <div className="space-y-6">
      {/* Alliance Header */}
      <Card className="panel-glass border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            {alliance?.name}
            <Badge variant="outline" className="text-xs">
              {alliance?.tag}
            </Badge>
            {isMyAlliance && (
              <Badge variant="outline" className="text-xs bg-primary/20 text-primary border-primary/30">
                My Alliance
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {alliance?.description || 'No description available'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{alliance?.member_count || 0}</div>
              <div className="text-sm text-muted-foreground">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {alliance?.total_score ? formatNumber(alliance.total_score) : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Total Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {formatNumber(alliance?.fund_tellerium || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Tellerium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {formatNumber(alliance?.fund_krypton || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Krypton</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alliance Stats */}
            <Card className="panel-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Alliance Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2 font-medium">
                      {alliance?.created_at ? formatDateTime(alliance.created_at) : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Average Score:</span>
                    <span className="ml-2 font-medium">
                      {alliance?.member_count && alliance?.total_score 
                        ? formatNumber(Math.round(alliance.total_score / alliance.member_count))
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Planets:</span>
                    <span className="ml-2 font-medium">
                      {(alliance as any)?.total_planets || '0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Fleets:</span>
                    <span className="ml-2 font-medium">
                      {(alliance as any)?.total_fleets || '0'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="panel-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-blue-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {((alliance as any)?.recent_activity as any[])?.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-muted-foreground">{activity}</span>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-sm">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card className="panel-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400" />
                Alliance Members
              </CardTitle>
              <CardDescription>
                {alliance?.members?.length || 0} members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : alliance?.members ? (
                <div className="space-y-4">
                  {alliance.members.map((member) => (
                    <div key={member.empire_id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center">
                          <span className="text-sm font-semibold">
                            {member.empire_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold">{member.empire_name}</div>
                          <div className="text-sm text-muted-foreground">
                            Joined {formatDateTime(member.joined_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={getRoleColor(member.role)}
                        >
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </div>
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatNumber((member as any).score ?? 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No members found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <AllianceChat 
            allianceId={numericAllianceId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )

  if (onClose) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] panel-glass max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alliance Details</DialogTitle>
            <DialogDescription>
              Detailed information about the alliance
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return content
}
