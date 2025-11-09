import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/formatters'
import { 
  Clock, 
  MapPin, 
  Eye, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Zap
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { TachyonSignal } from '@/types/api.types'
import { formatSignalCoordinate } from '../utils'

interface SignalHistoryProps {
  signals: TachyonSignal[]
  isLoading: boolean
  onSelectSignal: (signalId: number) => void
  selectedSignal: number | null
}

export function SignalHistory({ 
  signals, 
  isLoading, 
  onSelectSignal, 
  selectedSignal 
}: SignalHistoryProps) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400'
      case 'failed':
        return 'text-red-400'
      case 'processing':
        return 'text-yellow-400'
      default:
        return 'text-muted-foreground'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="panel-glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (signals.length === 0) {
    return (
      <Card className="panel-glass">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Zap className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Signals Found</h3>
          <p className="text-muted-foreground text-center max-w-md">
            You haven't launched any tachyon signals yet. Launch your first signal to gather intelligence about the universe.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {signals.map((signal) => (
        <Card
          key={signal.id}
          className={`panel-glass cursor-pointer transition-all hover:border-primary/50 ${
            selectedSignal === Number(signal.id) ? 'border-primary bg-primary/5' : ''
          }`}
          onClick={() => {
            console.log('SignalHistory - signal.id:', signal.id, 'type:', typeof signal.id)
            onSelectSignal(Number(signal.id))
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-2xl">
                  {getSignalTypeIcon(signal.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {(signal.type || '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Signal
                    </h3>
                    <Badge 
                      variant="outline" 
                      className={getSignalTypeColor(signal.type)}
                    >
                      {signal.type || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="font-mono">{formatSignalCoordinate(signal)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(signal.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {getStatusIcon(signal.status)}
                  <span className={`text-sm font-medium ${getStatusColor(signal.status)}`}>
                    {(signal.status || '').charAt(0).toUpperCase() + (signal.status || '').slice(1)}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectSignal(Number(signal.id))
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>
            </div>

            {/* Signal Results Preview */}
            {signal.results && signal.results.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Zap className="w-3 h-3" />
                  <span>Signal Results ({signal.results.length} detected)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {signal.results.slice(0, 3).map((result, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {result.type || 'Unknown'}
                    </Badge>
                  ))}
                  {signal.results.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{signal.results.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
