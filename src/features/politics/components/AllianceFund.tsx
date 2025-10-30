import { useState } from 'react'
import { useGetAllianceFundQuery, useWithdrawAllianceFundsMutation, useTransferAllianceFundsMutation, useDonateToAllianceMutation } from '@/api/endpoints/alliancesApi'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { useGetPlanetResourcesQuery } from '@/api/endpoints/resourcesApi'
import { useAlliancePermissions } from '@/hooks/useAlliancePermissions'
import { AllianceFundBalance } from '@/types/api.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatResource } from '@/lib/formatters'
import { formatCoordinate } from '@/lib/coordinates'
import { toast } from 'sonner'
import { Coins, ArrowDown, ArrowRight, ArrowUp, Loader2, AlertCircle, Zap } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface AllianceFundProps {
  allianceId: number
}

export function AllianceFund({ allianceId }: AllianceFundProps) {
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [donateDialogOpen, setDonateDialogOpen] = useState(false)
  const [withdrawTellerium, setWithdrawTellerium] = useState('')
  const [withdrawKrypton, setWithdrawKrypton] = useState('')
  const [transferPlanetId, setTransferPlanetId] = useState<number | null>(null)
  const [transferTellerium, setTransferTellerium] = useState('')
  const [transferKrypton, setTransferKrypton] = useState('')
  const [donatePlanetId, setDonatePlanetId] = useState<number | null>(null)
  const [donateTellerium, setDonateTellerium] = useState('')
  const [donateKrypton, setDonateKrypton] = useState('')

  const { data: fundData, isLoading: isLoadingFund } = useGetAllianceFundQuery(allianceId)
  const { data: planetsData } = useGetPlanetsQuery()
  const { data: donatePlanetResources } = useGetPlanetResourcesQuery(
    donatePlanetId!,
    { skip: !donatePlanetId }
  )
  const permissions = useAlliancePermissions(allianceId)
  const [withdrawFunds, { isLoading: isWithdrawing }] = useWithdrawAllianceFundsMutation()
  const [transferFunds, { isLoading: isTransferring }] = useTransferAllianceFundsMutation()
  const [donateFunds, { isLoading: isDonating }] = useDonateToAllianceMutation()

  // Handle both response formats: { fund_balance: {...} } or direct { tellerium, krypton }
  const fundBalance = (() => {
    console.log('AllianceFund: fundData:', fundData)
    if (!fundData) {
      console.log('AllianceFund: No fundData, returning default')
      return { tellerium: 0, krypton: 0 }
    }
    if ('fund_balance' in fundData) {
      console.log('AllianceFund: Using fund_balance property:', fundData.fund_balance)
      return fundData.fund_balance
    }
    if ('tellerium' in fundData && 'krypton' in fundData) {
      console.log('AllianceFund: Using direct fundData:', fundData)
      return fundData as AllianceFundBalance
    }
    console.log('AllianceFund: Unknown format, returning default')
    return { tellerium: 0, krypton: 0 }
  })()

  const planets = planetsData?.planets || []
  const donatePlanetBalance = donatePlanetResources?.balances || { tellerium: 0, krypton: 0 }

  const canManageFund = permissions.canManageFund || permissions.isLeader

  const handleWithdraw = async () => {
    const tellerium = parseInt(withdrawTellerium) || 0
    const krypton = parseInt(withdrawKrypton) || 0

    if (tellerium <= 0 && krypton <= 0) {
      toast.error('Please specify amounts to withdraw')
      return
    }

    if (tellerium > fundBalance.tellerium) {
      toast.error('Insufficient tellerium in alliance fund')
      return
    }

    if (krypton > fundBalance.krypton) {
      toast.error('Insufficient krypton in alliance fund')
      return
    }

    try {
      await withdrawFunds({
        allianceId,
        data: { tellerium, krypton },
      }).unwrap()
      toast.success('Funds withdrawn successfully! Resources distributed across your planets.')
      setWithdrawDialogOpen(false)
      setWithdrawTellerium('')
      setWithdrawKrypton('')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to withdraw funds')
    }
  }

  const handleTransfer = async () => {
    if (!transferPlanetId) {
      toast.error('Please select a planet')
      return
    }

    const tellerium = parseInt(transferTellerium) || 0
    const krypton = parseInt(transferKrypton) || 0

    if (tellerium <= 0 && krypton <= 0) {
      toast.error('Please specify amounts to transfer')
      return
    }

    if (tellerium > fundBalance.tellerium) {
      toast.error('Insufficient tellerium in alliance fund')
      return
    }

    if (krypton > fundBalance.krypton) {
      toast.error('Insufficient krypton in alliance fund')
      return
    }

    try {
      await transferFunds({
        allianceId,
        data: { planet_id: transferPlanetId, tellerium, krypton },
      }).unwrap()
      toast.success('Funds transferred successfully!')
      setTransferDialogOpen(false)
      setTransferPlanetId(null)
      setTransferTellerium('')
      setTransferKrypton('')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to transfer funds')
    }
  }

  const handleDonate = async () => {
    if (!donatePlanetId) {
      toast.error('Please select a planet to donate from')
      return
    }

    const tellerium = parseInt(donateTellerium) || 0
    const krypton = parseInt(donateKrypton) || 0

    if (tellerium <= 0 && krypton <= 0) {
      toast.error('Please specify amounts to donate')
      return
    }

    if (tellerium > donatePlanetBalance.tellerium) {
      toast.error('Insufficient tellerium on selected planet')
      return
    }

    if (krypton > donatePlanetBalance.krypton) {
      toast.error('Insufficient krypton on selected planet')
      return
    }

    try {
      await donateFunds({
        allianceId,
        tellerium,
        krypton,
      }).unwrap()
      toast.success('Funds donated successfully!')
      setDonateDialogOpen(false)
      setDonatePlanetId(null)
      setDonateTellerium('')
      setDonateKrypton('')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to donate funds')
    }
  }

  if (isLoadingFund) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Fund Balance */}
      <Card className="panel-glass border-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-cyan-400" />
            Alliance Fund Balance
          </CardTitle>
          <CardDescription>
            Current tellerium and krypton in the alliance treasury
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <span className="font-semibold">Tellerium</span>
              </div>
              <span className="text-2xl font-mono glow-cyan">
                {formatResource(fundBalance.tellerium)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <span className="font-semibold">Krypton</span>
              </div>
              <span className="text-2xl font-mono glow-blue">
                {formatResource(fundBalance.krypton)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donate Funds - Available to all members */}
      <Card className="panel-glass border-purple/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUp className="w-5 h-5 text-purple-400" />
            Donate Funds
          </CardTitle>
          <CardDescription>
            Contribute resources from your planets to the alliance treasury
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={donateDialogOpen} onOpenChange={setDonateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="outline">
                <ArrowUp className="w-4 h-4 mr-2" />
                Donate Funds
              </Button>
            </DialogTrigger>
            <DialogContent className="panel-glass border-purple/20">
              <DialogHeader>
                <DialogTitle>Donate to Alliance Fund</DialogTitle>
                <DialogDescription>
                  Contribute resources from one of your planets to the alliance treasury.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="donate-planet">Planet</Label>
                  <Select
                    value={donatePlanetId?.toString() || ''}
                    onValueChange={(value) => {
                      setDonatePlanetId(Number(value))
                      setDonateTellerium('')
                      setDonateKrypton('')
                    }}
                  >
                    <SelectTrigger id="donate-planet">
                      <SelectValue placeholder="Select a planet to donate from" />
                    </SelectTrigger>
                    <SelectContent>
                      {planets.map((planet) => (
                        <SelectItem key={planet.id} value={planet.id.toString()}>
                          {planet.name} ({formatCoordinate(planet.coordinate)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {donatePlanetId && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="donate-tellerium">Tellerium</Label>
                      <Input
                        id="donate-tellerium"
                        type="number"
                        min="0"
                        max={donatePlanetBalance.tellerium}
                        value={donateTellerium}
                        onChange={(e) => setDonateTellerium(e.target.value)}
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Available: {formatResource(donatePlanetBalance.tellerium)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="donate-krypton">Krypton</Label>
                      <Input
                        id="donate-krypton"
                        type="number"
                        min="0"
                        max={donatePlanetBalance.krypton}
                        value={donateKrypton}
                        onChange={(e) => setDonateKrypton(e.target.value)}
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Available: {formatResource(donatePlanetBalance.krypton)}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDonateDialogOpen(false)
                    setDonatePlanetId(null)
                    setDonateTellerium('')
                    setDonateKrypton('')
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleDonate} disabled={isDonating || !donatePlanetId}>
                  {isDonating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Donating...
                    </>
                  ) : (
                    <>
                      <ArrowUp className="w-4 h-4 mr-2" />
                      Donate Funds
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Fund Management Actions - Only for members with manage_fund permission */}
      {canManageFund && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Withdraw Funds */}
        <Card className="panel-glass border-blue/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDown className="w-5 h-5 text-blue-400" />
              Withdraw Funds
            </CardTitle>
            <CardDescription>
              Withdraw funds from the alliance treasury and distribute evenly across all your planets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Withdraw Funds
                </Button>
              </DialogTrigger>
              <DialogContent className="panel-glass border-blue/20">
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                  <DialogDescription>
                    Withdraw resources from the alliance fund. Funds will be distributed evenly across all your planets.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-tellerium">Tellerium</Label>
                    <Input
                      id="withdraw-tellerium"
                      type="number"
                      min="0"
                      max={fundBalance.tellerium}
                      value={withdrawTellerium}
                      onChange={(e) => setWithdrawTellerium(e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Available: {formatResource(fundBalance.tellerium)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-krypton">Krypton</Label>
                    <Input
                      id="withdraw-krypton"
                      type="number"
                      min="0"
                      max={fundBalance.krypton}
                      value={withdrawKrypton}
                      onChange={(e) => setWithdrawKrypton(e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Available: {formatResource(fundBalance.krypton)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Funds will be distributed evenly across all {planets.length} of your planets.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setWithdrawDialogOpen(false)
                      setWithdrawTellerium('')
                      setWithdrawKrypton('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleWithdraw} disabled={isWithdrawing}>
                    {isWithdrawing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Withdrawing...
                      </>
                    ) : (
                      <>
                        <ArrowDown className="w-4 h-4 mr-2" />
                        Withdraw Funds
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Transfer Funds */}
        <Card className="panel-glass border-green/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-green-400" />
              Transfer Funds
            </CardTitle>
            <CardDescription>
              Transfer funds directly to a specific planet owned by an alliance member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Transfer Funds
                </Button>
              </DialogTrigger>
              <DialogContent className="panel-glass border-green/20">
                <DialogHeader>
                  <DialogTitle>Transfer Funds to Planet</DialogTitle>
                  <DialogDescription>
                    Transfer resources directly to a specific planet owned by an alliance member.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transfer-planet">Planet</Label>
                    <Select
                      value={transferPlanetId?.toString() || ''}
                      onValueChange={(value) => setTransferPlanetId(Number(value))}
                    >
                      <SelectTrigger id="transfer-planet">
                        <SelectValue placeholder="Select a planet" />
                      </SelectTrigger>
                      <SelectContent>
                        {planets.map((planet) => (
                          <SelectItem key={planet.id} value={planet.id.toString()}>
                            {planet.name} ({formatCoordinate(planet.coordinate)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transfer-tellerium">Tellerium</Label>
                    <Input
                      id="transfer-tellerium"
                      type="number"
                      min="0"
                      max={fundBalance.tellerium}
                      value={transferTellerium}
                      onChange={(e) => setTransferTellerium(e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Available: {formatResource(fundBalance.tellerium)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transfer-krypton">Krypton</Label>
                    <Input
                      id="transfer-krypton"
                      type="number"
                      min="0"
                      max={fundBalance.krypton}
                      value={transferKrypton}
                      onChange={(e) => setTransferKrypton(e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Available: {formatResource(fundBalance.krypton)}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTransferDialogOpen(false)
                      setTransferPlanetId(null)
                      setTransferTellerium('')
                      setTransferKrypton('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleTransfer} disabled={isTransferring}>
                    {isTransferring ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Transferring...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Transfer Funds
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  )
}

