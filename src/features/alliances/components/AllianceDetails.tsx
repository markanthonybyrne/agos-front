import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGetAllianceDetailsQuery, useUploadAllianceAvatarMutation, useDeleteAllianceAvatarMutation } from '@/api/endpoints/alliancesApi'
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
  X,
  Upload,
  Trash2
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AllianceChat } from './AllianceChat'
import { Avatar } from '@/components/common/Avatar'
import { toast } from 'sonner'
import { useGetMeQuery } from '@/api/endpoints/authApi'

interface AllianceDetailsProps {
  allianceId: number
  isMyAlliance: boolean
  onClose?: () => void
}

export function AllianceDetails({ allianceId, isMyAlliance, onClose }: AllianceDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'chat'>('overview')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Ensure allianceId is always a number
  const numericAllianceId = Number(allianceId)
  console.log('AllianceDetails - allianceId:', allianceId, 'type:', typeof allianceId, 'numeric:', numericAllianceId)
  
  const { data: allianceData, isLoading, error, refetch: refetchAlliance } = useGetAllianceDetailsQuery(numericAllianceId)
  const { data: meData } = useGetMeQuery()
  const [uploadAllianceAvatar, { isLoading: isUploadingAvatar }] = useUploadAllianceAvatarMutation()
  const [deleteAllianceAvatar, { isLoading: isDeletingAvatar }] = useDeleteAllianceAvatarMutation()
  
  const alliance = allianceData?.alliance
  
  // Check if user is leader or officer
  const currentUserEmpireId = meData?.empire?.id
  const userRole = alliance?.members?.find(m => m.empire_id === currentUserEmpireId)?.role
  const canManageAvatar = userRole === 'leader' || userRole === 'officer'

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (4MB max for alliance)
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Avatar file must be less than 4MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload avatar
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      await uploadAllianceAvatar({ allianceId: numericAllianceId, formData }).unwrap()
      toast.success('Avatar uploaded successfully!')
      refetchAlliance()
      setAvatarPreview(null)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to upload avatar')
      setAvatarPreview(null)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!window.confirm('Are you sure you want to delete the alliance avatar?')) {
      return
    }

    try {
      await deleteAllianceAvatar(numericAllianceId).unwrap()
      toast.success('Avatar deleted successfully!')
      refetchAlliance()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete avatar')
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
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar
                src={avatarPreview ? null : alliance?.avatar_path}
                name={alliance?.name}
                size="lg"
                className="border-2 border-primary/30"
              />
              {avatarPreview && (
                <div className="absolute inset-0 rounded-full border-2 border-primary">
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full rounded-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarPreview(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {canManageAvatar && (
                <div className="mt-2 flex flex-col gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={isUploadingAvatar}
                    className="hidden"
                    id="alliance-avatar-upload"
                  />
                  <label htmlFor="alliance-avatar-upload" className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingAvatar}
                      className="w-full text-xs"
                      asChild
                    >
                      <span>
                        <Upload className="w-3 h-3 mr-1" />
                        {isUploadingAvatar ? 'Uploading...' : 'Upload'}
                      </span>
                    </Button>
                  </label>
                  {alliance?.avatar_path && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isDeletingAvatar}
                      onClick={handleDeleteAvatar}
                      className="w-full text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      {isDeletingAvatar ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1">
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
              <CardDescription className="mt-1">
                {alliance?.description || 'No description available'}
              </CardDescription>
            </div>
          </div>
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
