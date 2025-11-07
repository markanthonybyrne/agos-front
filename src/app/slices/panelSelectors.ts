import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../store'
import { Panel, PanelState, PanelType } from './panelSlice'

// Memoized selector for all panels
export const selectAllPanels = (state: RootState) => state.panel.panels

// Memoized selector for normal (non-minimized) panels
export const selectNormalPanels = createSelector(
  [selectAllPanels],
  (panels: Panel[]) => panels.filter((p) => p.state !== PanelState.MINIMIZED)
)

// Memoized selector for minimized panels
export const selectMinimizedPanels = createSelector(
  [selectAllPanels],
  (panels: Panel[]) => panels.filter((p) => p.state === PanelState.MINIMIZED)
)

// Memoized selector for backdrop visibility
export const selectBackdropVisible = (state: RootState) => state.panel.backdropVisible

// Memoized selector for panels by type
export const selectPanelsByType = createSelector(
  [selectAllPanels, (_state: RootState, panelType: PanelType) => panelType],
  (panels: Panel[], panelType: PanelType) => panels.filter((p) => p.type === panelType)
)

// Memoized selector for panel by ID
export const selectPanelById = createSelector(
  [selectAllPanels, (_state: RootState, panelId: string) => panelId],
  (panels: Panel[], panelId: string) => panels.find((p) => p.id === panelId)
)

// Memoized selector for panel count
export const selectPanelCount = createSelector([selectAllPanels], (panels: Panel[]) => panels.length)

// Memoized selector for next z-index
export const selectNextZIndex = (state: RootState) => state.panel.nextZIndex

