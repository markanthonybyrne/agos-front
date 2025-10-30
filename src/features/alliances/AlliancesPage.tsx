import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useGetAlliancesQuery, useGetAllianceDetailsQuery, useGetMyAllianceQuery } from '@/api/endpoints/alliancesApi'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { formatNumber } from '@/lib/formatters'
import { 
  Users, 
  Crown, 
  Search,
  Plus,
  Shield,
  Trophy,
  Star,
  MapPin,
  Calendar,
  UserPlus,
  UserMinus,
  DollarSign
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AllianceList } from './components/AllianceList'
import { AllianceDetails } from './components/AllianceDetails'
import { CreateAllianceDialog } from './components/CreateAllianceDialog'
import { DonationDialog } from './components/DonationDialog'

export function AlliancesPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAlliance, setSelectedAlliance] = useState<number | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [donationDialogOpen, setDonationDialogOpen] = useState(false)

  const { data: alliancesData, isLoading: isLoadingAlliances } = useGetAlliancesQuery()
  const { data: meData } = useGetMeQuery()
  
  // Debug logging
  console.log('AlliancesPage - meData:', meData)
  console.log('AlliancesPage - empire alliance_id:', meData?.empire?.alliance_id)
  
  // Get my alliance details using the alliance ID from empire data
  const { data: myAllianceData, isLoading: isLoadingMyAlliance, error: myAllianceError } = useGetAllianceDetailsQuery(
    Number(meData?.empire?.alliance_id) || 0,
    { skip: !meData?.empire?.alliance_id }
  )

  console.log('AlliancesPage - myAllianceData:', myAllianceData)
  console.log('AlliancesPage - myAllianceError:', myAllianceError)

  const alliances = alliancesData?.alliances || []
  const myAlliance = myAllianceData?.alliance
  const myAllianceId = meData?.empire?.alliance_id
  const isLoadingMyAllianceFinal = isLoadingMyAlliance

  // Debug the alliance data structure
  console.log('AlliancesPage - myAllianceData structure:', myAllianceData)
  console.log('AlliancesPage - myAlliance:', myAlliance)

  const filteredAlliances = alliances.filter(alliance =>
    alliance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alliance.tag.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAllianceSelect = (allianceId: number) => {
    setSelectedAlliance(allianceId)
  }

  const handleCreateAlliance = () => {
    setCreateDialogOpen(true)
  }

  const handleDonate = () => {
    setDonationDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading glow-cyan">Alliances</h1>
          <p className="text-muted-foreground">Join forces with other empires</p>
        </div>
        <div className="flex items-center gap-2">
          {!myAlliance && (
            <Button onClick={handleCreateAlliance} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Alliance
            </Button>
          )}
          {myAlliance && (
            <Button onClick={handleDonate} variant="outline">
              <DollarSign className="w-4 h-4 mr-2" />
              Donate
            </Button>
          )}
        </div>
      </div>

      {/* My Alliance Card */}
      {myAlliance && (
        <Card className="panel-glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              My Alliance: {myAlliance.name}
              <Badge variant="outline" className="text-xs">
                {myAlliance.tag}
              </Badge>
            </CardTitle>
            <CardDescription>
              {myAlliance.description || 'No description available'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{myAlliance.member_count}</div>
                <div className="text-sm text-muted-foreground">Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {myAlliance.total_score ? formatNumber(myAlliance.total_score) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Total Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {formatNumber(myAlliance.fund_tellerium)}
                </div>
                <div className="text-sm text-muted-foreground">Tellerium</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {formatNumber(myAlliance.fund_krypton)}
                </div>
                <div className="text-sm text-muted-foreground">Krypton</div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => handleAllianceSelect(myAlliance.id)}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="panel-glass border-cyan/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alliances</CardTitle>
            <Users className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alliances.length}</div>
            <p className="text-xs text-muted-foreground">
              Active alliances
            </p>
          </CardContent>
        </Card>

        <Card className="panel-glass border-blue/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Alliance</CardTitle>
            <Trophy className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {alliances[0]?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {alliances[0]?.total_score ? formatNumber(alliances[0].total_score) : 'N/A'} score
            </p>
          </CardContent>
        </Card>

        <Card className="panel-glass border-green/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Members</CardTitle>
            <Star className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alliances.length > 0 
                ? Math.round(alliances.reduce((sum, a) => sum + a.member_count, 0) / alliances.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Per alliance
            </p>
          </CardContent>
        </Card>

        <Card className="panel-glass border-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Status</CardTitle>
            <Shield className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {myAlliance ? 'Member' : 'Independent'}
            </div>
            <p className="text-xs text-muted-foreground">
              {myAlliance ? myAlliance.name : 'No alliance'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'my')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            All Alliances
          </TabsTrigger>
          <TabsTrigger value="my" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            My Alliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {/* Search */}
            <Card className="panel-glass">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search alliances..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Alliance List */}
            <AllianceList
              alliances={filteredAlliances}
              isLoading={isLoadingAlliances}
              onSelectAlliance={handleAllianceSelect}
              selectedAlliance={selectedAlliance}
            />
          </div>
        </TabsContent>

        <TabsContent value="my" className="mt-6">
          {isLoadingMyAllianceFinal ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : myAllianceError ? (
            <Card className="panel-glass border-red-500/20">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-red-400">Error Loading Alliance</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  {((myAllianceError as any)?.data?.message) || ((myAllianceError as any)?.message) || 'Failed to load alliance details'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Alliance ID: {myAllianceId}
                </p>
              </CardContent>
            </Card>
          ) : myAllianceId && myAlliance ? (
            <AllianceDetails
              allianceId={Number(myAllianceId)}
              isMyAlliance={true}
            />
          ) : (
            <Card className="panel-glass">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Alliance</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  You are not currently a member of any alliance. Create your own or join an existing one.
                </p>
                <p className="text-xs text-muted-foreground">
                  Alliance ID: {myAllianceId || 'null'}
                </p>
                <Button onClick={handleCreateAlliance} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Alliance
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateAllianceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      
      {myAlliance && (
        <DonationDialog
          open={donationDialogOpen}
          onOpenChange={setDonationDialogOpen}
          allianceId={myAlliance.id}
        />
      )}

      {/* Alliance Details Modal */}
      {selectedAlliance && (
        <AllianceDetails
          allianceId={Number(selectedAlliance)}
          isMyAlliance={false}
          onClose={() => setSelectedAlliance(null)}
        />
      )}
    </div>
  )
}
