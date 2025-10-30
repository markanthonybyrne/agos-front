import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useGetMyAllianceCreationRequestsQuery } from '@/api/endpoints/alliancesApi'
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'

export function CreationRequestStatus() {
  const { data, isLoading, error } = useGetMyAllianceCreationRequestsQuery()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="panel-glass border-red-500/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-400">Error Loading Requests</h3>
          <p className="text-muted-foreground text-center">
            Failed to load your creation requests
          </p>
        </CardContent>
      </Card>
    )
  }

  const requests = data?.requests || []

  if (requests.length === 0) {
    return (
      <Card className="panel-glass">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Creation Requests</h3>
          <p className="text-muted-foreground text-center max-w-md">
            You haven't submitted any alliance creation requests yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const getStatusIcon = () => {
          switch (request.status) {
            case 'completed':
              return <CheckCircle className="w-5 h-5 text-green-400" />
            case 'rejected':
              return <XCircle className="w-5 h-5 text-red-400" />
            case 'pending':
              return <Clock className="w-5 h-5 text-yellow-400" />
            default:
              return <AlertCircle className="w-5 h-5 text-muted-foreground" />
          }
        }

        const getStatusColor = () => {
          switch (request.status) {
            case 'completed':
              return 'bg-green-500/20 text-green-400 border-green-500/30'
            case 'rejected':
              return 'bg-red-500/20 text-red-400 border-red-500/30'
            case 'pending':
              return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            default:
              return 'bg-muted/20 text-muted-foreground border-border'
          }
        }

        return (
          <Card key={request.id} className="panel-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon()}
                {request.name}
                <Badge variant="outline" className="text-xs">
                  {request.tag}
                </Badge>
                <Badge variant="outline" className={`text-xs ${getStatusColor()}`}>
                  {request.status}
                </Badge>
              </CardTitle>
              <CardDescription>
                Created {formatDateTime(request.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Approval Progress */}
                <div className="p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Approval Progress</span>
                    <span className="text-sm font-bold">
                      {request.approvals_received}/{request.approvals_required}
                    </span>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${(request.approvals_received / request.approvals_required) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* Supporters */}
                {request.supporters && request.supporters.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Supporters</h4>
                    <div className="space-y-2">
                      {request.supporters.map((supporter, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-muted/10 rounded"
                        >
                          <span className="text-sm">{supporter.empire_name}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              supporter.status === 'approved'
                                ? 'bg-green-500/20 text-green-400'
                                : supporter.status === 'rejected'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {supporter.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {request.status === 'pending' && (
                  <p className="text-sm text-muted-foreground">
                    Waiting for supporters to approve your request...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

