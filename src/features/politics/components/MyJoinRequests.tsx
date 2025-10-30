import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useGetMyJoinRequestsQuery } from '@/api/endpoints/alliancesApi'
import { CheckCircle, XCircle, Clock, AlertCircle, FileText } from 'lucide-react'
import { formatDateTime } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'

export function MyJoinRequests() {
  const { data, isLoading, error } = useGetMyJoinRequestsQuery()

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
            Failed to load your join requests
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
          <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Join Requests</h3>
          <p className="text-muted-foreground text-center max-w-md">
            You haven't submitted any alliance join requests yet.
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
            case 'accepted':
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
            case 'accepted':
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
                {request.alliance?.name || 'Unknown Alliance'}
                <Badge variant="outline" className="text-xs">
                  {request.alliance?.tag || 'N/A'}
                </Badge>
                <Badge variant="outline" className={`text-xs ${getStatusColor()}`}>
                  {request.status}
                </Badge>
              </CardTitle>
              <CardDescription>
                Submitted {formatDateTime(request.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {request.message && (
                <div className="p-4 bg-muted/20 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Your Message</h4>
                  <p className="text-sm whitespace-pre-wrap">{request.message}</p>
                </div>
              )}
              {request.status === 'pending' && (
                <p className="text-sm text-muted-foreground mt-4">
                  Your request is pending review. You can submit another request to this alliance after 24 hours.
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

