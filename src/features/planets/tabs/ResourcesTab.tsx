import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useBuyMinesMutation, useBuyProbesMutation } from '@/api/endpoints/planetsApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Planet } from '@/types/api.types'
import { formatResource, formatNumber } from '@/lib/formatters'
import { Zap, Settings, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const mineSchema = z.object({
  quantity: z.number().min(1, 'Must buy at least 1 mine').max(100, 'Cannot buy more than 100 mines at once'),
})

const probeSchema = z.object({
  quantity: z.number().min(1, 'Must buy at least 1 probe').max(50, 'Cannot buy more than 50 probes at once'),
})

type MineFormData = z.infer<typeof mineSchema>
type ProbeFormData = z.infer<typeof probeSchema>

interface ResourcesTabProps {
  planet: Planet
}

export function ResourcesTab({ planet }: ResourcesTabProps) {
  const [buyMines, { isLoading: isBuyingMines }] = useBuyMinesMutation()
  const [buyProbes, { isLoading: isBuyingProbes }] = useBuyProbesMutation()

  const mineForm = useForm<MineFormData>({
    resolver: zodResolver(mineSchema),
    defaultValues: { quantity: 1 },
  })

  const probeForm = useForm<ProbeFormData>({
    resolver: zodResolver(probeSchema),
    defaultValues: { quantity: 1 },
  })

  const calculateMineCost = (quantity: number) => {
    const baseCost = 25000
    const currentMines = planet.mines
    let totalCost = 0
    
    for (let i = 0; i < quantity; i++) {
      const mineNumber = currentMines + i + 1
      totalCost += baseCost * mineNumber
    }
    
    return {
      tellerium: totalCost,
      krypton: Math.floor(totalCost / 2),
    }
  }

  const calculateProbeCost = (quantity: number) => {
    const baseCost = 15000
    const currentProbes = planet.probes
    let totalCost = 0
    
    for (let i = 0; i < quantity; i++) {
      const probeNumber = currentProbes + i + 1
      totalCost += baseCost * probeNumber
    }
    
    return {
      tellerium: totalCost,
      krypton: Math.floor(totalCost * 1.5),
    }
  }

  const onBuyMines = async (data: MineFormData) => {
    try {
      await buyMines({
        id: Number(planet.id),
        data: { quantity: data.quantity },
      }).unwrap()
      
      toast.success(`Successfully bought ${data.quantity} mines!`)
      mineForm.reset()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to buy mines')
    }
  }

  const onBuyProbes = async (data: ProbeFormData) => {
    try {
      await buyProbes({
        id: Number(planet.id),
        data: { quantity: data.quantity },
      }).unwrap()
      
      toast.success(`Successfully bought ${data.quantity} probes!`)
      probeForm.reset()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to buy probes')
    }
  }

  const mineQuantity = mineForm.watch('quantity') || 1
  const probeQuantity = probeForm.watch('quantity') || 1
  const mineCost = calculateMineCost(mineQuantity)
  const probeCost = calculateProbeCost(probeQuantity)

  const canAffordMines = planet.tellerium_balance >= mineCost.tellerium && planet.krypton_balance >= mineCost.krypton
  const canAffordProbes = planet.tellerium_balance >= probeCost.tellerium && planet.krypton_balance >= probeCost.krypton

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Buy Mines */}
      <Card className="panel-glass border-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            Buy Mines
          </CardTitle>
          <CardDescription>
            Mines produce Tellerium. Each mine produces 1,000 Tellerium per tick.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={mineForm.handleSubmit(onBuyMines)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mine-quantity">Quantity</Label>
              <Input
                id="mine-quantity"
                type="number"
                min="1"
                max="100"
                {...mineForm.register('quantity', { valueAsNumber: true })}
              />
              {mineForm.formState.errors.quantity && (
                <p className="text-sm text-destructive">
                  {mineForm.formState.errors.quantity.message}
                </p>
              )}
            </div>

            <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
              <h4 className="font-semibold">Cost Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tellerium Cost:</span>
                  <span className={`font-mono ${canAffordMines ? 'text-cyan-400' : 'text-destructive'}`}>
                    {formatResource(mineCost.tellerium)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Krypton Cost:</span>
                  <span className={`font-mono ${canAffordMines ? 'text-blue-400' : 'text-destructive'}`}>
                    {formatResource(mineCost.krypton)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Production:</span>
                  <span className="text-cyan-400">
                    +{formatNumber(mineQuantity * 1000)} T/tick
                  </span>
                </div>
              </div>
            </div>

            {!canAffordMines && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">
                  Insufficient resources
                </span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isBuyingMines || !canAffordMines}
            >
              {isBuyingMines ? 'Buying...' : `Buy ${mineQuantity} Mine${mineQuantity > 1 ? 's' : ''}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Buy Probes */}
      <Card className="panel-glass border-blue/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            Buy Probes
          </CardTitle>
          <CardDescription>
            Probes produce Krypton. Each probe produces 750 Krypton per tick.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={probeForm.handleSubmit(onBuyProbes)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="probe-quantity">Quantity</Label>
              <Input
                id="probe-quantity"
                type="number"
                min="1"
                max="50"
                {...probeForm.register('quantity', { valueAsNumber: true })}
              />
              {probeForm.formState.errors.quantity && (
                <p className="text-sm text-destructive">
                  {probeForm.formState.errors.quantity.message}
                </p>
              )}
            </div>

            <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
              <h4 className="font-semibold">Cost Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tellerium Cost:</span>
                  <span className={`font-mono ${canAffordProbes ? 'text-cyan-400' : 'text-destructive'}`}>
                    {formatResource(probeCost.tellerium)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Krypton Cost:</span>
                  <span className={`font-mono ${canAffordProbes ? 'text-blue-400' : 'text-destructive'}`}>
                    {formatResource(probeCost.krypton)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Production:</span>
                  <span className="text-blue-400">
                    +{formatNumber(probeQuantity * 750)} K/tick
                  </span>
                </div>
              </div>
            </div>

            {!canAffordProbes && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">
                  Insufficient resources
                </span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isBuyingProbes || !canAffordProbes}
            >
              {isBuyingProbes ? 'Buying...' : `Buy ${probeQuantity} Probe${probeQuantity > 1 ? 's' : ''}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Resources */}
      <Card className="panel-glass border-green/20 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-400" />
            Current Resources
          </CardTitle>
          <CardDescription>
            Your current resource balances on this planet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <span className="font-semibold">Tellerium</span>
                </div>
                <span className="text-2xl font-mono glow-cyan">
                  {formatResource(planet.tellerium_balance)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold">Krypton</span>
                </div>
                <span className="text-2xl font-mono glow-blue">
                  {formatResource(planet.krypton_balance)}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Mines</span>
                <Badge variant="outline" className="text-cyan-400">
                  {planet.mines}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Probes</span>
                <Badge variant="outline" className="text-blue-400">
                  {planet.probes}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
