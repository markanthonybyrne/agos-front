import { useCallback, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useAcceptDealMutation,
  useCancelDealMutation,
  useCreateDealMutation,
  useGetMyDealsQuery,
  useGetOpenDealsQuery,
} from '@/api/endpoints/dealsApi'
import { DealFilters, DealFiltersState } from './DealFilters'
import { DealCard } from './DealCard'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import { useResourcesCatalog } from '@/hooks/useResourcesCatalog'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppDispatch } from '@/app/hooks'
import { apiSlice } from '@/api/apiSlice'
import { CreateDealDialog } from './CreateDealDialog'
import { cn } from '@/lib/utils'

export function DealsBoard() {
  const dispatch = useAppDispatch()
  const { allResources } = useResourcesCatalog()
  const [filters, setFilters] = useState<DealFiltersState>({
    status: 'open',
  })
  const [isCreateOpen, setCreateOpen] = useState(false)

  const { data: openDeals, isLoading: loadingOpen, refetch: refetchOpen } = useGetOpenDealsQuery(
    {
      resource: filters.resource,
      min_amount: filters.minAmount,
    },
    {
      refetchOnMountOrArgChange: true,
    },
  )
  const { data: myDeals, isLoading: loadingMine, refetch: refetchMine } = useGetMyDealsQuery()
  const [acceptDeal, { isLoading: acceptingDeal }] = useAcceptDealMutation()
  const [cancelDeal, { isLoading: cancellingDeal }] = useCancelDealMutation()
  const [createDeal, { isLoading: creatingDeal }] = useCreateDealMutation()

  const isLoading = loadingOpen || loadingMine

  const filteredMyDeals = useMemo(() => {
    const deals = myDeals?.deals || []
    if (filters.status && filters.status !== 'all') {
      return deals.filter((deal) => deal.status === filters.status)
    }
    return deals
  }, [myDeals?.deals, filters.status])

  const handleAccept = async (dealId: number, payload: { responder_planet_id: number; responder_receive_planet_id?: number | null }) => {
    try {
      await acceptDeal({ dealId, payload }).unwrap()
      toast.success('Deal accepted')
      dispatch(apiSlice.util.invalidateTags(['Deals', 'Market', 'SecondaryResource', 'Resource']))
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to accept deal')
    }
  }

  const handleCancel = async (dealId: number) => {
    try {
      await cancelDeal(dealId).unwrap()
      toast.success('Deal cancelled')
      dispatch(apiSlice.util.invalidateTags(['Deals', 'Market', 'SecondaryResource', 'Resource']))
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to cancel deal')
    }
  }

  const handleCreate = async (payload: any) => {
    try {
      await createDeal(payload).unwrap()
      toast.success('Deal created successfully')
      setCreateOpen(false)
      dispatch(apiSlice.util.invalidateTags(['Deals', 'Market', 'SecondaryResource', 'Resource']))
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create deal')
    }
  }

  const handleRefresh = useCallback(() => {
    refetchOpen()
    refetchMine()
  }, [refetchOpen, refetchMine])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Free Market Deals</h2>
          <p className="text-sm text-muted-foreground">
            Create custom trades or accept offers from other empires.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Deal
          </Button>
        </div>
      </div>

      <Card className="panel-glass border-border/40">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter deals by resource, amount, or status.</CardDescription>
        </CardHeader>
        <CardContent>
          <DealFilters onChange={setFilters} initialFilters={filters} />
        </CardContent>
      </Card>

      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">Open Deals</TabsTrigger>
          <TabsTrigger value="mine">My Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {loadingOpen ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-36 w-full" />
              ))}
            </div>
          ) : openDeals?.deals && openDeals.deals.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {openDeals.deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  showActions
                  onAccept={() =>
                    handleAccept(deal.id, { responder_planet_id: deal.creator_planet_id })
                  }
                  isAccepting={acceptingDeal}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-12">
              No deals available. Adjust filters or create one.
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="space-y-4">
          {loadingMine ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-36 w-full" />
              ))}
            </div>
          ) : filteredMyDeals.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredMyDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  showActions
                  onCancel={
                    deal.status === 'open' && deal.creator_empire
                      ? () => handleCancel(deal.id)
                      : undefined
                  }
                  isCancelling={cancellingDeal}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-12">
              You have no deals yet. Create one to start trading.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateDealDialog
        open={isCreateOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isSubmitting={creatingDeal}
        resources={allResources}
      />
    </div>
  )
}


