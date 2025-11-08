import { RootState } from '@/app/store'
import { SecondaryResourceLedgerEntry } from '@/types/api.types'

export const selectEmpireSecondaryLedger = (
  state: RootState,
): SecondaryResourceLedgerEntry[] => state.auth.empire?.secondary_resources ?? []

export const selectEmpireSecondaryCapacity = (state: RootState): number =>
  state.auth.empire?.secondary_capacity ?? 0

export const selectEmpireSecondaryCapacityUsed = (state: RootState): number =>
  state.auth.empire?.secondary_capacity_used ?? 0

export const selectEmpireSecondaryCapacityBonus = (state: RootState): number =>
  state.auth.empire?.secondary_capacity_bonus_percent ?? 0


