import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useGetAllianceCreationRequestsQuery, useSupportAllianceCreationRequestMutation } from '@/api/endpoints/alliancesApi'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/formatters'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export function CreationRequestApproval() {
  const { data, isLoading, error } = useGetAllianceCreationRequestsQuery()
  const [supportRequest, { isLoading: isSupporting }] = useSupportAllianceCreationRequestMutation()

  const handleSupport = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      await supportRequest({
        requestId,
        data: { action }
      }).unwrap()
      toast.success(action === 'approve' ? 'Request approved!' : 'Request rejected')
    } catch (error: any) {
      toast.error(error?.data?.message || `Failed to ${action} request`)
    }
  }

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
            Failed to load creation requests
          </p>
        </CardContent>
      </Card>
    )
  }

  const requests = data?.requests || []
  const pendingRequests = requests.filter(r => r.my_status === 'pending' || !r.my_status)

  if (pendingRequests.length === 0) {
    return (
      <Card className="panel-glass">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
          <p className="text-muted-foreground text-center max-w-md">
            You don't have any pending alliance creation requests to review.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {pendingRequests.map((request) => (
        <Card key={request.id} className="panel-glass border-yellow-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              Alliance Creation Request
              <Badge variant="outline" className="text-xs">
                {request.tag}
              </Badge>
            </CardTitle>
            <CardDescription>
              Requested by {request.creator.name} • {formatDateTime(request.created_at)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">{request.name}</h4>
              <p className="text-sm text-muted-foreground">
                Tag: {request.tag}
              </p>
            </div>

            {/* Approval Status */}
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

            {/* Your Status */}
            {request.my_status && request.my_status !== 'pending' && (
              <div className={`p-3 rounded-lg ${
                request.my_status === 'approved' 
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-red-500/20 border border-red-500/30'
              }`}>
                <div className="flex items-center gap-2">
                  {request.my_status === 'approved' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm font-medium">
                    You {request.my_status === 'approved' ? 'approved' : 'rejected'} this request
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            {(!request.my_status || request.my_status === 'pending') && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSupport(request.id, 'approve')}
                  disabled={isSupporting}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleSupport(request.id, 'reject')}
                  disabled={isSupporting}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

