import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { useGetAllianceQuery, useGetAlliancesQuery } from '@/api/endpoints/alliancesApi'
import { useAlliancePermissions } from '@/hooks/useAlliancePermissions'
import { 
  Users, 
  Crown, 
  Plus,
  Shield,
  Trophy,
  MessageSquare,
  Settings,
  FileText,
  Globe,
  AlertCircle,
  Search,
  Coins,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom'
import { CreateAllianceRequestDialog } from './components/CreateAllianceRequestDialog'
import { CreationRequestStatus } from './components/CreationRequestStatus'
import { CreationRequestApproval } from './components/CreationRequestApproval'
import { AllianceList } from '@/features/alliances/components/AllianceList'
import { AllianceHomepage } from './components/AllianceHomepage'
import { MemberList } from './components/MemberList'
import { AllianceChat } from '@/features/alliances/components/AllianceChat'
import { AllianceStatus } from './components/AllianceStatus'
import { GroupsManagement } from './components/GroupsManagement'
import { GlobalOptions } from './components/GlobalOptions'
import { JoinRequestManagement } from './components/JoinRequestManagement'
import { MyJoinRequests } from './components/MyJoinRequests'
import { AllianceFund } from './components/AllianceFund'
import { LeaveAlliance } from './components/LeaveAlliance'
import { JoinRequestForm } from './components/JoinRequestForm'
import { useAuth } from '@/hooks/useAuth'

export function PoliticsPage() {
  const navigate = useNavigate()
  const { empire } = useAuth()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedAlliance, setSelectedAlliance] = useState<number | null>(null)
  const [joinRequestOpen, setJoinRequestOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const { data: meData, isLoading: isLoadingMe } = useGetMeQuery()
  const allianceId = empire?.alliance_id || meData?.empire?.alliance_id

  const { data: allianceData, isLoading: isLoadingAlliance } = useGetAllianceQuery(
    allianceId!,
    { skip: !allianceId }
  )

  const { data: alliancesData } = useGetAlliancesQuery()
  const permissions = useAlliancePermissions(allianceId || null)

  const isInAlliance = !!allianceId && !!allianceData?.alliance
  const isLeader = permissions.isLeader

  const filteredAlliances = alliancesData?.alliances?.filter(alliance =>
    alliance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alliance.tag.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (isLoadingMe) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading glow-cyan">Politics</h1>
          <p className="text-muted-foreground">
            {isInAlliance 
              ? 'Manage your alliance and coordinate with members'
              : 'Form alliances or join existing ones'
            }
          </p>
        </div>
        {!isInAlliance && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Submit Creation Request
          </Button>
        )}
      </div>

      {!isInAlliance ? (
        // Not in Alliance - Show creation request, alliance list, and join requests
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="create-request">Create Request</TabsTrigger>
            <TabsTrigger value="join-requests">My Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="panel-glass border-cyan/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  Alliance System
                </CardTitle>
                <CardDescription>
                  Join forces with other empires to dominate the galaxy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/20 rounded-lg">
                  <h4 className="font-semibold mb-2">Creating an Alliance</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Alliances require 5 supporters to be created. Submit a creation request with 5 planet coordinates,
                    and the empires at those locations will be asked to support your alliance.
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Creation Request
                  </Button>
                </div>
                <div className="p-4 bg-muted/20 rounded-lg">
                  <h4 className="font-semibold mb-2">Joining an Alliance</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Browse available alliances and submit join requests. Each alliance has its own recruitment policies.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Alliance List */}
            <Card className="panel-glass">
              <CardHeader>
                <CardTitle>All Alliances</CardTitle>
                <CardDescription>Browse and join available alliances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search alliances..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <AllianceList
                  alliances={filteredAlliances}
                  isLoading={false}
                  onSelectAlliance={(id) => {
                    setSelectedAlliance(id)
                    setJoinRequestOpen(true)
                  }}
                  selectedAlliance={selectedAlliance}
                />
              </CardContent>
            </Card>

            {/* Creation Requests Pending Approval */}
            <CreationRequestApproval />
          </TabsContent>

          <TabsContent value="create-request">
            <CreationRequestStatus />
          </TabsContent>

          <TabsContent value="join-requests">
            <MyJoinRequests />
          </TabsContent>
        </Tabs>
      ) : (
        // In Alliance - Show member management features
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="fund">Fund</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AllianceHomepage allianceId={allianceId!} isMember={true} />
          </TabsContent>

          <TabsContent value="members">
            <MemberList allianceId={allianceId!} />
          </TabsContent>

          <TabsContent value="chat">
            <AllianceChat allianceId={allianceId!} />
          </TabsContent>

          <TabsContent value="status">
            <AllianceStatus allianceId={allianceId!} />
          </TabsContent>

          <TabsContent value="groups">
            <GroupsManagement allianceId={allianceId!} />
          </TabsContent>

          <TabsContent value="fund">
            <AllianceFund allianceId={allianceId!} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <GlobalOptions allianceId={allianceId!} />
            {(permissions.canViewJoinRequests || permissions.isLeader) && (
              <JoinRequestManagement allianceId={allianceId!} />
            )}
            <LeaveAlliance allianceId={allianceId!} isLeader={isLeader} />
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogs */}
      <CreateAllianceRequestDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedAlliance && (
        <JoinRequestForm
          allianceId={selectedAlliance}
          open={joinRequestOpen}
          onOpenChange={(open: boolean) => {
            setJoinRequestOpen(open)
            if (!open) setSelectedAlliance(null)
          }}
        />
      )}
    </div>
  )
}
