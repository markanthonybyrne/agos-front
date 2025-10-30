import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useGetSignalDetailsQuery } from '@/api/endpoints/signalsApi'
import { formatDateTime } from '@/lib/formatters'
import { 
  X, 
  MapPin, 
  Clock, 
  Zap, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Eye,
  Shield,
  Ship,
  Globe,
  Activity
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface SignalResultsProps {
  signalId: number
  onClose: () => void
}

export function SignalResults({ signalId, onClose }: SignalResultsProps) {
  console.log('SignalResults - signalId:', signalId, 'type:', typeof signalId)
  const { data: signalData, isLoading, error } = useGetSignalDetailsQuery(Number(signalId))
  const signal = (signalData as any)?.signal || (signalData as any)?.data?.signal

  const getSignalTypeIcon = (type: string) => {
    switch (type) {
      case 'fleet':
        return <Ship className="w-5 h-5 text-blue-400" />
      case 'orbital_defence':
        return <Shield className="w-5 h-5 text-red-400" />
      case 'planetary':
        return <Globe className="w-5 h-5 text-green-400" />
      case 'all_frequency':
        return <Zap className="w-5 h-5 text-purple-400" />
      case 'events':
        return <Activity className="w-5 h-5 text-yellow-400" />
      default:
        return <Zap className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getResultTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'fleet':
        return <Ship className="w-4 h-4 text-blue-400" />
      case 'defence':
      case 'defense':
        return <Shield className="w-4 h-4 text-red-400" />
      case 'planet':
      case 'planetary':
        return <Globe className="w-4 h-4 text-green-400" />
      case 'event':
        return <Activity className="w-4 h-4 text-yellow-400" />
      default:
        return <Eye className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getResultTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'fleet':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'defence':
      case 'defense':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'planet':
      case 'planetary':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'event':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-muted/20 text-muted-foreground border-border'
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

  if (error) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] panel-glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Error Loading Signal
            </DialogTitle>
            <DialogDescription>
              Failed to load signal details. Please try again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] panel-glass max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {signal && getSignalTypeIcon(signal.type)}
            Signal Results
          </DialogTitle>
          <DialogDescription>
            Detailed analysis of the tachyon signal scan
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : signal ? (
          <div className="space-y-6">
            {/* Signal Overview */}
            <Card className="panel-glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Signal Overview</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(signal.status)}
                    <span className="text-sm font-medium capitalize">
                      {signal.status}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 font-medium capitalize">
                      {signal.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target:</span>
                    <span className="ml-2 font-medium font-mono">
                      {signal.target_quadrant}:{signal.target_sector}:{signal.target_galaxy}:{signal.target_planet}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Launched:</span>
                    <span className="ml-2 font-medium">
                      {formatDateTime(signal.created_at)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="ml-2 font-medium">
                      {signal.completed_at ? formatDateTime(signal.completed_at) : 'Processing...'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">Signal Strength:</span>
                      <span className="font-medium">
                        {signal.signal_strength}%
                      </span>
                    </div>
                    <div className="w-full bg-muted/20 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          signal.signal_strength >= 80 ? 'bg-green-400' :
                          signal.signal_strength >= 60 ? 'bg-yellow-400' :
                          signal.signal_strength >= 40 ? 'bg-orange-400' :
                          'bg-red-400'
                        }`}
                        style={{ width: `${Math.min(signal.signal_strength, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signal Results */}
            {signal.results && signal.results.length > 0 ? (
              <Card className="panel-glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Detection Results
                    <Badge variant="outline">
                      {signal.results.length} detected
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Intelligence gathered from the tachyon signal scan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {signal?.results?.map((result: any, index: number) => (
                      <Card key={index} className="border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {getResultTypeIcon(result.type)}
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">
                                    {result.type || 'Unknown Detection'}
                                  </h4>
                                  <Badge 
                                    variant="outline" 
                                    className={getResultTypeColor(result.type)}
                                  >
                                    {result.type || 'Unknown'}
                                  </Badge>
                                </div>
                                {result.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {result.description}
                                  </p>
                                )}
                                {result.data && typeof result.data === 'object' && (
                                  <div className="space-y-2">
                                    <h5 className="text-sm font-medium text-muted-foreground">Scan Data:</h5>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      {Object.entries(result.data).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                          <span className="text-muted-foreground capitalize">
                                            {key.replace('_', ' ')}:
                                          </span>
                                          <span className="font-medium">
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {result.details && (
                                  <div className="text-sm">
                                    <h5 className="text-sm font-medium text-muted-foreground mb-2">Detailed Analysis:</h5>
                                    <pre className="whitespace-pre-wrap font-mono text-xs bg-muted/20 p-3 rounded border">
                                      {typeof result.details === 'string' 
                                        ? result.details 
                                        : JSON.stringify(result.details, null, 2)
                                      }
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                            {result.confidence && (
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Confidence</div>
                                <div className="font-semibold text-lg">
                                  {Math.round(result.confidence * 100)}%
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : signal.status === 'completed' ? (
              <Card className="panel-glass">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Eye className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Results</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    The signal scan did not detect any significant activity or objects at the target location.
                  </p>
                </CardContent>
              </Card>
            ) : signal.status === 'failed' ? (
              <Card className="panel-glass border-red-500/20">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <XCircle className="w-12 h-12 text-red-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-red-400">Signal Failed</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    The tachyon signal encountered interference or was blocked. No data was collected.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="panel-glass border-yellow-500/20">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="w-12 h-12 text-yellow-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-yellow-400">Processing</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    The tachyon signal is being processed. Results will be available shortly.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Raw Scan Data */}
            {signal.scan_data && Object.keys(signal.scan_data).length > 0 && (
              <Card className="panel-glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Raw Scan Data
                  </CardTitle>
                  <CardDescription>
                    Technical data collected by the tachyon signal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(signal.scan_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start py-2 border-b border-border/50 last:border-b-0">
                        <span className="text-muted-foreground font-mono text-sm capitalize">
                          {key.replace('_', ' ')}:
                        </span>
                        <span className="font-medium text-sm text-right max-w-xs break-words">
                          {typeof value === 'object' 
                            ? JSON.stringify(value, null, 2)
                            : String(value)
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Signal Statistics */}
            {signal.statistics && (
              <Card className="panel-glass">
                <CardHeader>
                  <CardTitle>Signal Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(signal.statistics).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-muted-foreground capitalize">
                          {key.replace('_', ' ')}:
                        </span>
                        <span className="ml-2 font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
