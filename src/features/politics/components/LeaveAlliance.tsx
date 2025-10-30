import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useLeaveAllianceMutation } from '@/api/endpoints/alliancesApi'
import { useAuth } from '@/hooks/useAuth'
import { LogOut, AlertCircle, Crown } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

interface LeaveAllianceProps {
  allianceId: number
  isLeader: boolean
}

export function LeaveAlliance({ allianceId, isLeader }: LeaveAllianceProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [leaveAlliance, { isLoading }] = useLeaveAllianceMutation()
  const { empire } = useAuth()
  const navigate = useNavigate()

  const handleLeave = async () => {
    if (isLeader) {
      toast.error('Alliance leader cannot leave. Transfer leadership first.')
      return
    }

    try {
      await leaveAlliance(allianceId).unwrap()
      toast.success('You have left the alliance')
      navigate('/alliances')
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to leave alliance'
      if (errorMessage.includes('leader')) {
        toast.error('Alliance leader cannot leave. Transfer leadership first.')
      } else {
        toast.error(errorMessage)
      }
    }
  }

  return (
    <>
      <Card className="panel-glass border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-red-400" />
            Leave Alliance
          </CardTitle>
          <CardDescription>
            {isLeader 
              ? 'Leaders must transfer leadership before leaving'
              : 'Leave the alliance and become independent'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLeader ? (
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <Crown className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-400 mb-1">
                  Cannot Leave as Leader
                </p>
                <p className="text-sm text-muted-foreground">
                  You must transfer leadership to another member before you can leave the alliance.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-400 mb-1">Warning</p>
                    <p className="text-sm text-muted-foreground">
                      Leaving the alliance will remove all your permissions and access to alliance features.
                      You can create a new alliance or join another one after leaving.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowConfirm(true)}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Alliance
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Alliance?</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this alliance? This action cannot be undone.
              You will lose all alliance permissions and access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={isLoading}
            >
              {isLoading ? 'Leaving...' : 'Leave Alliance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
