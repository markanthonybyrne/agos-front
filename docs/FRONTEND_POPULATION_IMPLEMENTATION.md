# Frontend Population Implementation Flow

## Overview

The population feature introduces a dedicated management panel for each colony. The frontend must surface live data (population profile, draft metrics, edicts) and allow commanders to trigger actions in a predictable flow. This document outlines API usage, view hierarchy, and update cadence.

## API Endpoints

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/v1/planets/{planet}/population` | `GET` | Returns population profile, draft metrics, contextual modifiers, active and available edicts. |
| `/api/v1/planets/{planet}/population/draft` | `GET` | Returns draft capacity breakdown (current, cap, ratio, overdraft). |
| `/api/v1/planets/{planet}/population/edicts` | `POST` | Apply an edict. Body: `{ "edict_slug": "balanced_focus" }`. |
| `/api/v1/planets/{planet}/population/specialization` | `POST` | Reassign colony specialisation. Body: `{ "specialization": "industrial" }`. |

All endpoints require `auth:sanctum` and ownership of the target planet.

## UI Structure

### Population Panel

1. **Header**: colony name, total population, growth rate, unrest indicator (colour-coded by threshold).
2. **Stage Card**: current stage, population cap progress bar, requirements list (housing, barracks, era).
3. **Strata Graph**: stacked bar (Engineers/Cultivators/Pioneers) with tooltips summarising effects.
4. **Draft Widget**: meter showing current vs capacity, overdraft warning banner, quick link to barracks facilities.
5. **Edict List**:
   - Active edicts with remaining ticks and cancel button.
   - Available edicts with requirement badges (met/unmet) and cooldown timers.
   - Apply button posts to `/population/edicts`, disabled if requirements not met.
6. **Veteran & Event Feed**: Surface recent events (stage advanced, overdraft, unrest alert, veteran celebration) using toast notifications and inline log.

### Specialisation Selector

Modal accessible from the population panel and empire overview:

- Multi-column cards describing each specialisation (Industrial, Cultural, Defense, Frontier).
- `POST /population/specialization` triggered on confirmation.
- After success, refresh data via `GET /population`.

## Data Flow

1. **Initial Load**
   - Fetch `/population` when opening the colony view.
   - Cache response in local store keyed by `planet_id`.
2. **Tick Updates**
   - On each tick push, refetch draft metrics (`/population/draft`) for visible colonies.
   - If the user remains on the population panel longer than the tick interval, auto-refresh `/population`.
3. **Edict Application**
   - Optimistically set UI to "activating".
   - On success, replace available edict data with server response.
   - On error (cooldown or requirements), show inline validation message.
4. **Specialisation Change**
   - Show confirmation modal; when confirmed, post and reload `/population`.
   - Trigger global toast summarising new specialisation effects.
5. **Event Handling**
   - Subscribe to event bus (`PopulationStageAdvanced`, `PopulationOverdrafted`, `PopulationUnrestThresholdReached`, `PopulationVeteranCelebration`, `PopulationSpecializationChanged`).
   - For events targeting visible planets, update local store and show user feedback (e.g., critical unrest banner).

## UI States

| State | Trigger | UI behaviour |
| --- | --- | --- |
| Normal | Draft ratio < 1 and unrest < 35 | Standard colours, no warnings. |
| Warning | Draft ratio > 1 or unrest ≥ 35 | Yellow banner with action suggestions (build barracks, apply edict). |
| Critical | Unrest ≥ 70 | Red banner, disable draft actions until mitigated. |
| Cooldown | Edict cooldown active | Greyed apply button with countdown. |
| Disabled | Requirements unmet | Show tooltip explaining missing housing/barracks/era. |

## Frontend Checklist

- [ ] Implement population store slice (`population/{planetId}`) with cache invalidation on tick or API response.
- [ ] Add population panel route/component.
- [ ] Integrate edict modal with optimistic updates and cooldown handling.
- [ ] Hook event bus messages to population store and toast system.
- [ ] Extend colony overview summary card with population quick stats (stage, unrest, draft ratio).
- [ ] Add e2e tests covering edict apply, specialisation change, and overdraft warning.

