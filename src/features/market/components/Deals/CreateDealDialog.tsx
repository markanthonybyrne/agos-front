import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DealResourceList } from './DealResourceList'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { ResourceMetadata } from '@/config/resources'
import { formatNumber } from '@/lib/formatters'
import { toast } from 'sonner'

interface CreateDealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: any) => Promise<void> | void
  isSubmitting?: boolean
  resources: ResourceMetadata[]
}

interface ResourceSelection {
  resource_type: string
  quantity: number
  category?: 'primary' | 'secondary'
}

export function CreateDealDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  resources,
}: CreateDealDialogProps) {
  const { data: planetsData } = useGetPlanetsQuery(undefined, { skip: !open })
  const planets = planetsData?.planets || []

  const [creatorPlanetId, setCreatorPlanetId] = useState<number | null>(null)
  const [creatorReceivePlanetId, setCreatorReceivePlanetId] = useState<number | null>(null)
  const [responderReceivePlanetId, setResponderReceivePlanetId] = useState<number | null>(null)
  const [expiresInHours, setExpiresInHours] = useState<number>(24)
  const [offeredResources, setOfferedResources] = useState<ResourceSelection[]>([])
  const [requestedResources, setRequestedResources] = useState<ResourceSelection[]>([])

  const resetForm = () => {
    setCreatorPlanetId(null)
    setCreatorReceivePlanetId(null)
    setResponderReceivePlanetId(null)
    setExpiresInHours(24)
    setOfferedResources([])
    setRequestedResources([])
  }

  const handleClose = (value: boolean) => {
    if (!value) {
      resetForm()
    }
    onOpenChange(value)
  }

  const addResource = (target: 'offered' | 'requested') => {
    const list = target === 'offered' ? offeredResources : requestedResources
    const setter = target === 'offered' ? setOfferedResources : setRequestedResources

    setter([
      ...list,
      {
        resource_type: 'tellerium',
        quantity: 1000,
        category: 'primary',
      },
    ])
  }

  const updateResource = (
    target: 'offered' | 'requested',
    index: number,
    partial: Partial<ResourceSelection>,
  ) => {
    const list = target === 'offered' ? offeredResources : requestedResources
    const setter = target === 'offered' ? setOfferedResources : setRequestedResources
    const next = [...list]
    next[index] = { ...next[index], ...partial }
    setter(next)
  }

  const removeResource = (target: 'offered' | 'requested', index: number) => {
    const setter = target === 'offered' ? setOfferedResources : setRequestedResources
    setter((list) => list.filter((_, i) => i !== index))
  }

  const isValid = useMemo(() => {
    return (
      creatorPlanetId !== null &&
      offeredResources.length > 0 &&
      requestedResources.length > 0 &&
      offeredResources.every((resource) => resource.quantity > 0) &&
      requestedResources.every((resource) => resource.quantity > 0)
    )
  }, [creatorPlanetId, offeredResources, requestedResources])

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error('Fill all required fields and include at least one offered/requested resource.')
      return
    }

    await onSubmit({
      creator_planet_id: creatorPlanetId,
      creator_receive_planet_id: creatorReceivePlanetId,
      responder_receive_planet_id: responderReceivePlanetId,
      offered_resources: offeredResources,
      requested_resources: requestedResources,
      expires_in_hours: expiresInHours,
    })

    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Free Market Deal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source planet (you)</Label>
              <Select
                value={creatorPlanetId?.toString() || ''}
                onValueChange={(value) => setCreatorPlanetId(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose planet" />
                </SelectTrigger>
                <SelectContent>
                  {planets.map((planet) => (
                    <SelectItem key={planet.id} value={planet.id.toString()}>
                      {planet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Your receive planet (optional)</Label>
              <Select
                value={creatorReceivePlanetId?.toString() || 'none'}
                onValueChange={(value) =>
                  setCreatorReceivePlanetId(value === 'none' ? null : Number(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Keep on source planet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keep on source planet</SelectItem>
                  {planets.map((planet) => (
                    <SelectItem key={planet.id} value={planet.id.toString()}>
                      {planet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Responder receive planet (optional)</Label>
              <Select
                value={responderReceivePlanetId?.toString() || 'none'}
                onValueChange={(value) =>
                  setResponderReceivePlanetId(value === 'none' ? null : Number(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Responder picks destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Responder chooses when accepting</SelectItem>
                  {planets.map((planet) => (
                    <SelectItem key={planet.id} value={planet.id.toString()}>
                      {planet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expires in (hours)</Label>
              <Input
                type="number"
                min={1}
                max={72}
                value={expiresInHours}
                onChange={(event) => setExpiresInHours(Number(event.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">You offer</Label>
                <Button variant="ghost" size="sm" onClick={() => addResource('offered')}>
                  + Add
                </Button>
              </div>
              {offeredResources.length === 0 ? (
                <p className="text-xs text-muted-foreground">No resources selected.</p>
              ) : (
                <div className="space-y-2">
                  {offeredResources.map((resource, index) => (
                    <div
                      key={`${resource.resource_type}-${index}`}
                      className="rounded-lg border border-border/40 p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <Select
                          value={resource.resource_type}
                          onValueChange={(value) =>
                            updateResource('offered', index, {
                              resource_type: value,
                              category: resources.find((item) => item.slug === value)?.category,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {resources.map((item) => (
                              <SelectItem key={item.slug} value={item.slug}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={1}
                          value={resource.quantity}
                          onChange={(event) =>
                            updateResource('offered', index, {
                              quantity: Number(event.target.value),
                            })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => removeResource('offered', index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">You request</Label>
                <Button variant="ghost" size="sm" onClick={() => addResource('requested')}>
                  + Add
                </Button>
              </div>
              {requestedResources.length === 0 ? (
                <p className="text-xs text-muted-foreground">No resources selected.</p>
              ) : (
                <div className="space-y-2">
                  {requestedResources.map((resource, index) => (
                    <div
                      key={`${resource.resource_type}-${index}`}
                      className="rounded-lg border border-border/40 p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <Select
                          value={resource.resource_type}
                          onValueChange={(value) =>
                            updateResource('requested', index, {
                              resource_type: value,
                              category: resources.find((item) => item.slug === value)?.category,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {resources.map((item) => (
                              <SelectItem key={item.slug} value={item.slug}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={1}
                          value={resource.quantity}
                          onChange={(event) =>
                            updateResource('requested', index, {
                              quantity: Number(event.target.value),
                            })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => removeResource('requested', index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Offer total: {formatNumber(offeredResources.reduce((sum, item) => sum + item.quantity, 0))}</p>
            <p>Request total: {formatNumber(requestedResources.reduce((sum, item) => sum + item.quantity, 0))}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Deal'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


