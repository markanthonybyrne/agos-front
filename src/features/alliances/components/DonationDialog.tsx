import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDonateToAllianceMutation, useGetAllianceFundQuery } from '@/api/endpoints/alliancesApi'
import { DollarSign, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import { formatNumber } from '@/lib/formatters'
import { useAppSelector } from '@/app/hooks'
import { useGetEmpireResourceSummaryQuery } from '@/api/endpoints/resourcesApi'
import { Skeleton } from '@/components/ui/skeleton'

const donationSchema = z.object({
  tellerium: z.number().min(0, 'Tellerium amount must be positive').optional(),
  krypton: z.number().min(0, 'Krypton amount must be positive').optional(),
}).refine(data => data.tellerium || data.krypton, {
  message: 'You must donate at least some Tellerium or Krypton',
})

type DonationData = z.infer<typeof donationSchema>

interface DonationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  allianceId: number
}

export function DonationDialog({ open, onOpenChange, allianceId }: DonationDialogProps) {
  const empireId = useAppSelector((state) => state.auth.empire?.id)
  const [donateToAlliance, { isLoading }] = useDonateToAllianceMutation()
  const { data: fundData, isLoading: isFundLoading, refetch: refetchFund } = useGetAllianceFundQuery(allianceId, {
    skip: !open,
  })
  const { data: resourceSummary } = useGetEmpireResourceSummaryQuery(empireId ?? 0, {
    skip: !open || !empireId,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<DonationData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      tellerium: 0,
      krypton: 0
    }
  })

  const telleriumAmount = watch('tellerium') || 0
  const kryptonAmount = watch('krypton') || 0

  const onSubmit = async (data: DonationData) => {
    try {
      await donateToAlliance({
        allianceId: Number(allianceId),
        tellerium: data.tellerium || 0,
        krypton: data.krypton || 0
      }).unwrap()
      toast.success('Donation successful!')
      refetchFund()
      reset()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to donate to alliance')
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const handleMaxTellerium = () => {
    const available = resourceSummary?.total_balances?.tellerium ?? 0
    if (available <= 0) {
      toast.info('No Tellerium available to donate right now.')
      return
    }
    setValue('tellerium', available, { shouldDirty: true, shouldValidate: true })
  }

  const handleMaxKrypton = () => {
    const available = resourceSummary?.total_balances?.krypton ?? 0
    if (available <= 0) {
      toast.info('No Krypton available to donate right now.')
      return
    }
    setValue('krypton', available, { shouldDirty: true, shouldValidate: true })
  }

  const allianceTellerium = fundData?.fund_balance?.tellerium ?? 0
  const allianceKrypton = fundData?.fund_balance?.krypton ?? 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] panel-glass surface-gradient card-glow border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Donate to Alliance
          </DialogTitle>
          <DialogDescription>
            Contribute resources to your alliance's shared treasury.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Current Alliance Balance */}
          <Card className="panel-glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm">Current Alliance Balance</CardTitle>
              <CardDescription>
                Resources available in the alliance treasury
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {isFundLoading ? (
                      <Skeleton className="h-6 w-16 mx-auto" />
                    ) : (
                      formatNumber(allianceTellerium)
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Tellerium</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {isFundLoading ? (
                      <Skeleton className="h-6 w-16 mx-auto" />
                    ) : (
                      formatNumber(allianceKrypton)
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Krypton</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Donation Amounts */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tellerium">Tellerium Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="tellerium"
                  type="number"
                  placeholder="0"
                  {...register('tellerium', { valueAsNumber: true })}
                  className={errors.tellerium ? 'border-destructive' : ''}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMaxTellerium}
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Available: {formatNumber(resourceSummary?.total_balances?.tellerium ?? 0)} T
              </p>
              {errors.tellerium && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {errors.tellerium.message}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="krypton">Krypton Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="krypton"
                  type="number"
                  placeholder="0"
                  {...register('krypton', { valueAsNumber: true })}
                  className={errors.krypton ? 'border-destructive' : ''}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMaxKrypton}
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Available: {formatNumber(resourceSummary?.total_balances?.krypton ?? 0)} K
              </p>
              {errors.krypton && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {errors.krypton.message}
                </div>
              )}
            </div>
          </div>

          {/* Donation Summary */}
          {(telleriumAmount > 0 || kryptonAmount > 0) && (
            <Card className="panel-glass border-green/20">
              <CardHeader>
                <CardTitle className="text-sm">Donation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {telleriumAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tellerium:</span>
                      <span className="font-medium text-blue-400">
                        {formatNumber(telleriumAmount)}
                      </span>
                    </div>
                  )}
                  {kryptonAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Krypton:</span>
                      <span className="font-medium text-purple-400">
                        {formatNumber(kryptonAmount)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-border/50 pt-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total Donation:</span>
                      <span className="text-green-400">
                        {formatNumber(telleriumAmount + kryptonAmount)} resources
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Donation Info */}
          <div className="p-4 bg-muted/20 rounded-lg">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              Donation Information
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Donated resources are added to the alliance treasury</li>
              <li>• Alliance leaders can use these resources for alliance projects</li>
              <li>• You cannot withdraw donated resources</li>
              <li>• Donations are permanent and cannot be reversed</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (telleriumAmount === 0 && kryptonAmount === 0)}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Donating...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Donate Resources
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
