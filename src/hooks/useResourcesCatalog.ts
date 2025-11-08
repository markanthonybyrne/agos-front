import { useEffect, useMemo } from 'react'
import { useAppSelector } from '@/app/hooks'
import {
  getRarityColor,
  getResourceMetadata,
  listResourceMetadata,
  registerSecondaryResource,
  ResourceMetadata,
  ResourceCategory,
  upsertSecondaryFromLedger,
  upsertSecondaryFromReserves,
} from '@/config/resources'
import { SecondaryReserve, SecondaryResourceLedgerEntry } from '@/types/api.types'

export interface UseResourcesCatalogOptions {
  reserves?: SecondaryReserve[] | null
  extraMetadata?: ResourceMetadata[] | null
  category?: ResourceCategory
}

export type SecondaryLedgerEntryWithMetadata = SecondaryResourceLedgerEntry & {
  metadata: ResourceMetadata
  color: string
}

export function useResourcesCatalog(options?: UseResourcesCatalogOptions) {
  const ledger = useAppSelector((state) => state.auth.empire?.secondary_resources)
  const { reserves, extraMetadata } = options || {}

  useEffect(() => {
    upsertSecondaryFromLedger(ledger)
  }, [ledger])

  useEffect(() => {
    if (reserves) {
      upsertSecondaryFromReserves(reserves)
    }
  }, [reserves])

  useEffect(() => {
    if (extraMetadata && extraMetadata.length > 0) {
      registerSecondaryResource(
        extraMetadata
          .filter((item) => item && item.slug)
          .map((item) => ({
            ...item,
            category: item.category ?? 'secondary',
          })),
      )
    }
  }, [extraMetadata])

  const primaryResources = useMemo(
    () => listResourceMetadata({ category: 'primary' }),
    [ledger?.length],
  )

  const secondaryResources = useMemo(
    () => listResourceMetadata({ category: 'secondary' }),
    [ledger?.length, reserves?.length, extraMetadata?.length],
  )

  const allResources = useMemo(
    () => listResourceMetadata(),
    [primaryResources, secondaryResources],
  )

  const ledgerWithMetadata = useMemo<SecondaryLedgerEntryWithMetadata[]>(() => {
    return (ledger ?? []).map((entry) => {
      const metadata = getResourceMetadata(entry.slug)
      return {
        ...entry,
        metadata,
        color: metadata.color,
      }
    })
  }, [ledger, primaryResources, secondaryResources])

  return {
    primaryResources,
    secondaryResources,
    allResources,
    ledger: ledgerWithMetadata,
    getMetadata: getResourceMetadata,
    getRarityColor,
  }
}


