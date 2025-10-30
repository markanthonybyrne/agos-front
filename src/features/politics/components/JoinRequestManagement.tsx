import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useGetJoinRequestsQuery, useRespondToJoinRequestMutation } from '@/api/endpoints/alliancesApi'
import { useAlliancePermissions } from '@/hooks/useAlliancePermissions'
import { CheckCircle, XCircle, Clock, AlertCircle, UserPlus } from 'lucide-react'
import { formatDateTime } from '@/lib/formatters'
import { formatCoordinate } from '@/lib/coordinates'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface JoinRequestManagementProps {
  allianceId: number
}

export function JoinRequestManagement({ allianceId }: JoinRequestManagementProps) {
  const permissions = useAlliancePermissions(allianceId)
  const [respondToRequest, { isLoading }] = useRespondToJoinRequestMutation()

  const { data: pendingData, isLoading: isLoadingPending } = useGetJoinRequestsQuery({
    allianceId,
    status: 'pending'
  })

  const { data: allData, isLoading: isLoadingAll } = useGetJoinRequestsQuery({
    allianceId,
    status: 'all'
  })

  const handleRespond = async (requestId: number, action: 'accept' | 'reject') => {
    try {
      await respondToRequest({
        allianceId,
        requestId,
        data: { action }
      }).unwrap()
      toast.success(action === 'accept' ? 'Join request accepted!' : 'Join request rejected')
    } catch (error: any) {
      toast.error(error?.data?.message || `Failed to ${action} request`)
    }
  }

  if (permissions.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!permissions.canViewJoinRequests && !permissions.isLeader) {
    return (
      <Card className="panel-glass border-red-500/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-400">Access Denied</h3>
          <p className="text-muted-foreground text-center">
            You don't have permission to view join requests
          </p>
        </CardContent>
      </Card>
    )
  }

  const pendingRequests = pendingData?.requests || []
  const allRequests = allData?.requests || []

  return (
    <Tabs defaultValue="pending" className="space-y-4">
      <TabsList>
        <TabsTrigger value="pending">
          Pending ({pendingRequests.length})
        </TabsTrigger>
        <TabsTrigger value="all">
          All Requests ({allRequests.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        {isLoadingPending ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : pendingRequests.length === 0 ? (
          <Card className="panel-glass">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserPlus className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
              <p className="text-muted-foreground text-center">
                There are no pending join requests at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="panel-glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-400" />
                    {request.applicant.name}
                  </CardTitle>
                  <CardDescription>
                    Submitted {formatDateTime(request.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Score</div>
                      <div className="font-semibold">{request.applicant.score.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Planets</div>
                      <div className="font-semibold">{request.applicant.planets_owned}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Status</div>
                      <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        {request.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/20 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Message</h4>
                    <p className="text-sm whitespace-pre-wrap">{request.message}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRespond(request.id, 'accept')}
                      disabled={isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleRespond(request.id, 'reject')}
                      disabled={isLoading}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="all">
        {isLoadingAll ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : allRequests.length === 0 ? (
          <Card className="panel-glass">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserPlus className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Requests</h3>
              <p className="text-muted-foreground text-center">
                No join requests have been submitted yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {allRequests.map((request) => {
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
                      {request.applicant.name}
                      <Badge variant="outline" className={`text-xs ${getStatusColor()}`}>
                        {request.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Submitted {formatDateTime(request.created_at)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <div className="text-muted-foreground">Score</div>
                        <div className="font-semibold">{request.applicant.score.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Planets</div>
                        <div className="font-semibold">{request.applicant.planets_owned}</div>
                      </div>
                    </div>
                    {request.message && (
                      <div className="p-4 bg-muted/20 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Message</h4>
                        <p className="text-sm whitespace-pre-wrap">{request.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

