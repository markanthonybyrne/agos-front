import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useGetSignalsQuery, useLaunchSignalMutation, useGetSignalStatisticsQuery } from '@/api/endpoints/signalsApi'
import { formatDate, formatDateTime } from '@/lib/formatters'
import { 
  Scan, 
  Send, 
  Search,
  Clock,
  MapPin,
  Zap,
  Eye,
  Filter,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { SignalForm } from './components/SignalForm'
import { SignalHistory } from './components/SignalHistory'
import { SignalResults } from './components/SignalResults'

type SignalType = 'fleet' | 'orbital_defence' | 'planetary' | 'all_frequency' | 'events'

export function SignalsPage() {
  const [activeTab, setActiveTab] = useState<'launch' | 'history'>('launch')
  const [searchTerm, setSearchTerm] = useState('')
  const [signalTypeFilter, setSignalTypeFilter] = useState<SignalType | 'all'>('all')
  const [selectedSignal, setSelectedSignal] = useState<number | null>(null)

  const { data: signalsData, isLoading, error: signalsError, refetch } = useGetSignalsQuery(undefined, {
    refetchOnMountOrArgChange: true, // Ensure signals refetch when tags are invalidated
  })
  const { data: statisticsData, error: statsError } = useGetSignalStatisticsQuery(undefined, {
    refetchOnMountOrArgChange: true, // Ensure statistics refetch when tags are invalidated
  })
  console.log('SignalsPage - signalsData:', signalsData)
  console.log('SignalsPage - signalsError:', signalsError)
  console.log('SignalsPage - statisticsData:', statisticsData)
  console.log('SignalsPage - statsError:', statsError)
  const [launchSignal, { isLoading: isLaunching }] = useLaunchSignalMutation()

  const signals = signalsData?.signals || []
  console.log('SignalsPage - signalsData:', signalsData)
  console.log('SignalsPage - signals:', signals)
  
  const filteredSignals = signals.filter(signal => {
    const coordinateString = `${signal.target_quadrant}:${signal.target_sector}:${signal.target_galaxy}:${signal.target_planet}`
    const matchesSearch = coordinateString.includes(searchTerm)
    const matchesType = signalTypeFilter === 'all' || signal.type === signalTypeFilter
    return matchesSearch && matchesType
  })

  const handleLaunchSignal = async (data: { target_quadrant: number; target_sector: number; target_galaxy: number; target_planet: number; type: string }) => {
    try {
      await launchSignal({
        ...data,
        type: data.type as SignalType,
      }).unwrap()
      toast.success('Signal launched successfully')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to launch signal')
    }
  }

  const getSignalTypeColor = (type: string) => {
    switch (type) {
      case 'fleet':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'orbital_defence':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'planetary':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'all_frequency':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'events':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-muted/20 text-muted-foreground border-border'
    }
  }

  const getSignalTypeIcon = (type: string) => {
    switch (type) {
      case 'fleet':
        return '🚀'
      case 'orbital_defence':
        return '🛡️'
      case 'planetary':
        return '🌍'
      case 'all_frequency':
        return '📡'
      case 'events':
        return '⚡'
      default:
        return '📡'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading glow-cyan">Tachyon Signals</h1>
          <p className="text-muted-foreground">Launch intelligence gathering missions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="panel-glass border-cyan/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Signals</CardTitle>
            <Scan className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signals.length}</div>
            <p className="text-xs text-muted-foreground">
              Intelligence missions launched
            </p>
          </CardContent>
        </Card>

        <Card className="panel-glass border-blue/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Signals</CardTitle>
            <Zap className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {signals.filter(s => s.type === 'fleet').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Fleet detection missions
            </p>
          </CardContent>
        </Card>

        <Card className="panel-glass border-red/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defence Signals</CardTitle>
            <Eye className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {signals.filter(s => s.type === 'orbital_defence').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Defence analysis missions
            </p>
          </CardContent>
        </Card>

        <Card className="panel-glass border-green/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planetary Signals</CardTitle>
            <MapPin className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {signals.filter(s => s.type === 'planetary').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Planet analysis missions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {signalsError && (
        <Card className="panel-glass border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-400">
              <Eye className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Error Loading Signals</h3>
                <p className="text-sm text-muted-foreground">
                  {((signalsError as any)?.data?.message) || ((signalsError as any)?.message) || 'Unknown error occurred'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Overview */}
      {statisticsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="panel-glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Signals</p>
                  <p className="text-2xl font-bold">{statisticsData.total_signals}</p>
                </div>
                <Scan className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="panel-glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="text-2xl font-bold text-green-400">{statisticsData.successful_signals}</p>
                </div>
                <Zap className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="panel-glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-400">{statisticsData.failed_signals}</p>
                </div>
                <Eye className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="panel-glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {statisticsData.total_signals > 0 
                      ? Math.round((statisticsData.successful_signals / statisticsData.total_signals) * 100)
                      : 0}%
                  </p>
                </div>
                <Clock className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'launch' | 'history')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="launch" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Launch Signal
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Signal History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="launch" className="mt-6">
          <Card className="panel-glass">
            <CardHeader>
              <CardTitle>Launch Tachyon Signal</CardTitle>
              <CardDescription>
                Send a tachyon signal to gather intelligence about a target location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignalForm
                onLaunch={handleLaunchSignal}
                isLoading={isLaunching}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="space-y-4">
            {/* Filters */}
            <Card className="panel-glass">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search by coordinate..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={signalTypeFilter}
                      onChange={(e) => setSignalTypeFilter(e.target.value as SignalType | 'all')}
                      className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="fleet">Fleet</option>
                      <option value="orbital_defence">Orbital Defence</option>
                      <option value="planetary">Planetary</option>
                      <option value="all_frequency">All Frequency</option>
                      <option value="events">Events</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signal History */}
            <SignalHistory
              signals={filteredSignals}
              isLoading={isLoading}
              onSelectSignal={setSelectedSignal}
              selectedSignal={selectedSignal}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Signal Results Modal */}
      {selectedSignal && (
        <SignalResults
          signalId={Number(selectedSignal)}
          onClose={() => setSelectedSignal(null)}
        />
      )}
    </div>
  )
}
