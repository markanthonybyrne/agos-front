import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useGetTopQuery } from '@/api/endpoints/universeApi'
import { useGetAlliancesQuery } from '@/api/endpoints/alliancesApi'
import { formatNumber } from '@/lib/formatters'
import { 
  Trophy, 
  Crown, 
  Search,
  Star,
  Users,
  MapPin,
  TrendingUp,
  RefreshCw,
  Medal,
  Award
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmpireRankings } from './components/EmpireRankings'
import { GalaxyRankings } from './components/GalaxyRankings'

export function RankingsPage() {
  const [activeTab, setActiveTab] = useState<'empires' | 'galaxies'>('empires')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'score' | 'planets' | 'fleets'>('score')

  const { data: rankingsData, isLoading, refetch } = useGetTopQuery()
  const { data: alliancesData } = useGetAlliancesQuery()

  const handleRefresh = () => {
    refetch()
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-orange-400" />
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 2:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 3:
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default:
        return 'bg-muted/20 text-muted-foreground border-border'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading glow-cyan">Rankings</h1>
          <p className="text-muted-foreground">Top performers across the universe</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top Performers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="panel-glass border-yellow/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Empire</CardTitle>
            <Crown className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {rankingsData?.top_empires?.[0]?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {rankingsData?.top_empires?.[0]?.score ? formatNumber(rankingsData.top_empires[0].score) : '0'} score
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
              {(rankingsData as any)?.top_alliances?.[0]?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {(rankingsData as any)?.top_alliances?.[0]?.total_score ? formatNumber((rankingsData as any).top_alliances[0].total_score) : '0'} score
            </p>
          </CardContent>
        </Card>

        <Card className="panel-glass border-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Galaxy</CardTitle>
            <MapPin className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {(rankingsData as any)?.top_galaxies?.[0]?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {(rankingsData as any)?.top_galaxies?.[0]?.total_empires || '0'} empires
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="empires" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Empires
          </TabsTrigger>
          <TabsTrigger value="galaxies" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Galaxies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empires" className="mt-6">
          <div className="space-y-4">
            {/* Search and Sort */}
            <Card className="panel-glass">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search empires..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                    >
                      <option value="score">Sort by Score</option>
                      <option value="planets">Sort by Planets</option>
                      <option value="fleets">Sort by Fleets</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Empire Rankings */}
            <EmpireRankings
              empires={(rankingsData?.top_empires || []) as any}
              alliances={alliancesData?.alliances || []}
              isLoading={isLoading}
              searchTerm={searchTerm}
              sortBy={sortBy}
            />
          </div>
        </TabsContent>


        <TabsContent value="galaxies" className="mt-6">
          <div className="space-y-4">
            {/* Search and Sort */}
            <Card className="panel-glass">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search galaxies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                    >
                      <option value="score">Sort by Empires</option>
                      <option value="planets">Sort by Planets</option>
                      <option value="fleets">Sort by Activity</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Galaxy Rankings */}
            <GalaxyRankings
              galaxies={(rankingsData?.top_galaxies || []) as any}
              isLoading={isLoading}
              searchTerm={searchTerm}
              sortBy={sortBy}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
