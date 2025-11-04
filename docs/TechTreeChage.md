# Tech Tree Frontend Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [Key Changes from Previous System](#key-changes-from-previous-system)
3. [New Game Mechanics](#new-game-mechanics)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Integration Patterns](#integration-patterns)
6. [Data Structures](#data-structures)
7. [Nuanced Gameplay Details](#nuanced-gameplay-details)
8. [Real-World Integration Examples](#real-world-integration-examples)
9. [Common Edge Cases & Gotchas](#common-edge-cases--gotchas)
10. [Implementation Status](#implementation-status)

---

## Overview

The game has been extended with a rich tech tree system featuring era progression, specializations, facility effects, research effects, and dark matter resources. This guide explains all the new mechanics and how to integrate them into your frontend.

### Core Concepts

- **Eras**: 5 progressive eras (1-5) that unlock new content
- **Specializations**: Three paths (Industrial, Military, Relic) unlocked at Era 3
- **Facility Effects**: Facilities now produce resources per-tick and require upkeep
- **Research Effects**: Research provides multipliers, flat bonuses, and boolean unlocks
- **Dark Matter**: Empire-level exotic resource for late-game content

---

## Key Changes from Previous System

### 1. **Facility System Changes**

**Before:**

- Facilities were passive structures
- No ongoing resource production or costs
- Only affected build capabilities

**Now:**

- Facilities have `per_tick` production (JSON: `{"tellerium": 10, "krypton": 5, "dark_matter": 2}`)
- Facilities have `upkeep` costs (JSON: `{"tellerium": 5, "krypton": 3}`)
- Facilities deactivate if upkeep cannot be paid
- Production applies per-planet (each planet's facilities affect that planet's resources)
- Dark matter production aggregates to empire-level

### 2. **Research System Changes**

**Before:**

- Research was binary (completed/not completed)
- No visible effects on gameplay

**Now:**

- Research has `effects` (JSON) that modify gameplay:
  - Multipliers: `per_tick_prod_mul`, `travel_ticks_mul`, `upkeep_reduction`
  - Flat bonuses: `ship_armor`, `shield_strength`, `detection_range`
  - Boolean unlocks: `invasion_enabled`, `warp_enabled`
- Research effects stack multiplicatively (multipliers) or additively (flat bonuses)
- Effects stored in `active_research_effects` on Empire model
- Research has `prerequisite_research` array (research dependencies)

### 3. **Era Progression**

**Before:**

- No era system
- All content available from start

**Now:**

- 5 eras (Awakening, Expansion, Consolidation, Ascension, Supremacy)
- Era progression unlocks new content automatically
- Each definition has `era` field (1-5)
- Empire has `active_era` field (starts at 1)

### 4. **Specialization System**

**Before:**

- No specialization paths
- All players had access to same tech tree

**Now:**

- Three specializations: `industrial`, `military`, `relic`
- Unlocked at Era 3 when player completes `advanced_research_lab` or `automated_factory`
- Option B: Players can unlock multiple specializations (flexible)
- Definitions have `specialization` field (`general`, `industrial`, `military`, `relic`)
- Items filtered by: `era <= active_era AND (specialization == 'general' OR specialization IN specializations_unlocked)`

### 5. **Dark Matter Resource**

**Before:**

- No dark matter system

**Now:**

- Empire-level resource (not per-planet)
- Produced by Era 5 facilities (e.g., `singularity_reactor`)
- Has capacity limits
- Overflow is discarded (logged)
- Used for late-game content

### 6. **Prerequisite System**

**Before:**

- Only facility prerequisites checked

**Now:**

- Era requirement: `definition->era <= empire->active_era`
- Specialization requirement: `specialization == 'general' OR in_array(specialization, specializations_unlocked)`
- Facility prerequisites: Existing system
- Research prerequisites: New `prerequisite_research` array
- All checked before allowing construction

---

## New Game Mechanics

### Era Progression

Eras progress automatically when milestones are reached:

- **Era 1 → Era 2**: Complete `research_lab` facility
- **Era 2 → Era 3**: Complete `advanced_research_lab` or `automated_factory` facility
- **Era 3 → Era 4**: Complete `quantum_lab` or `orbital_shipyard` facility
- **Era 4 → Era 5**: Complete `singularity_reactor` or `fortress_shipyard` facility

The frontend should display:

- Current era
- Progress to next era
- Requirements to unlock next era

### Specialization Unlocking

At Era 3, players can unlock specializations:

1. **Prerequisites**: Era 3 + (`advanced_research_lab` OR `automated_factory`)
2. **Selection**: Player chooses one or more specializations (Option B: flexible)
3. **Effects**: Unlocks specialized tech tree nodes
4. **Storage**: Stored in `specializations_unlocked` JSON array on Empire

**Frontend UI Suggestions:**

- Show specialization selection modal when prerequisites met
- Display locked/unlocked status for each specialization
- Show which tech nodes are unlocked by each specialization

### Facility Production & Upkeep

**Production Calculation (Per Planet):**

Each tick, the system:

1. Iterates through all active facilities on each planet
2. Gets `per_tick` production from facility definition
3. Applies research multipliers multiplicatively:
   ```
   effective_production = base_production × product(all_per_tick_prod_mul) × specific_resource_mul
   ```
4. Adds production to planet's resource balance
5. Deducts upkeep (with research reduction applied)
6. If planet balance goes negative, **all facilities on that planet** are deactivated

**Production Formula:**

```
Base Production = facility.definition.per_tick (JSON object)
Research Multipliers = active_research_effects (e.g., per_tick_prod_mul: 1.2, tellerium_per_tick_mul: 1.1)
Effective Production = Base × (1 + per_tick_prod_mul) × (1 + specific_resource_mul)
```

**Example:**

- Facility: `mines` with `per_tick: {"tellerium": 10}`
- Research: `per_tick_prod_mul: 0.2` (20% increase), `tellerium_per_tick_mul: 0.1` (10% increase)
- Effective: `10 × 1.2 × 1.1 = 13.2` tellerium per tick

**Upkeep Calculation:**

```
Base Upkeep = facility.definition.upkeep (JSON object)
Upkeep Reduction = sum(upkeep_reduction from research) (capped at 0.9 = 90%)
Effective Upkeep = Base × (1 - Upkeep Reduction)
```

**Example:**

- Facility: `power_plant` with `upkeep: {"krypton": 10}`
- Research: `upkeep_reduction: 0.05` (5% reduction)
- Effective: `10 × (1 - 0.05) = 9.5` krypton per tick

**Deactivation Logic (Critical Detail):**

The deactivation check happens **before** production is added but **after** calculating what would be needed:

1. **Calculate Total Production**: Sum all facility `per_tick` production (with multipliers)
2. **Calculate Total Upkeep**: Sum all facility `upkeep` costs (with reduction)
3. **Check If Can Pay**: `planet.balance - total_upkeep >= 0` for each resource
4. **If Cannot Pay**:
   - **ALL facilities on that planet** are immediately deactivated (`active = false`)
   - Production is **NOT** applied (no production from deactivated facilities)
   - Upkeep is **NOT** deducted (deactivated facilities don't consume upkeep)
   - Function returns early (no production added)
5. **If Can Pay**:
   - Production is added to planet balance
   - Upkeep is deducted from planet balance
   - All facilities remain active

**Important Notes:**

- Deactivation is **all-or-nothing** per planet (not per facility)
- If ANY resource (tellerium OR krypton) goes negative, ALL facilities deactivate
- Production is calculated **before** checking if upkeep can be paid
- If upkeep cannot be paid, production is **discarded** (not added)
- Facilities can reactivate on next tick if resources become available
- Use `GET /api/v1/facilities/preview` to show projected production/upkeep before building

**Dark Matter Production:**

- Dark Matter is produced by facilities with `"dark_matter"` in `per_tick` JSON
- Production is per-planet but aggregated to empire-level
- Research multipliers apply to dark matter production
- Overflow (production exceeds capacity) is discarded (logged)

**Frontend Display Requirements:**

1. **Per-Facility Display**:
   - Show `per_tick` production for each resource
   - Display `upkeep` costs clearly
   - Calculate and show net production (production - upkeep)
   - Show facility active/inactive status
   - Display applied research multipliers

2. **Planet-Level Summary**:
   - Sum all facility production per resource
   - Sum all facility upkeep per resource
   - Show net production (total production - total upkeep)
   - Warn if total upkeep exceeds production
   - Show which facilities are contributing to each resource

3. **Preview Before Building**:
   - Use `GET /api/v1/facilities/preview?planet_id=X&facility_slug=Y`
   - Show projected production with multipliers applied
   - Show projected upkeep with reduction applied
   - Display net effect on resources
   - Warn if upkeep would exceed production

4. **Deactivation Warnings**:
   - Show warning if planet resources insufficient for upkeep
   - Highlight facilities that would be deactivated
   - Display resource deficit amount
   - Suggest solutions (build more production, reduce upkeep, transfer resources)

### Research Effects Application

When research completes:

1. Effects extracted from `effects` JSON
2. Multipliers stack multiplicatively: `1.10 × 1.20 = 1.32`
3. Flat bonuses stack additively: `+10 + +25 = +35`
4. Booleans overwrite: `true` or `false`
5. Effects stored in `active_research_effects` on Empire

**Effect Types:**

- `per_tick_prod_mul`: Multiplies facility production
- `tellerium_per_tick_mul`: Multiplies tellerium production specifically
- `travel_ticks_mul`: Multiplies travel time (reduces it)
- `upkeep_reduction`: Reduces upkeep costs
- `ship_armor`: Flat armor bonus
- `ship_attack`: Percentage attack bonus
- `fleet_attack_bonus`: Fleet coordination bonus
- `shield_strength`: Flat shield bonus
- `detection_range`: Flat detection range bonus
- `colony_cap`: Additional colony capacity
- `invasion_enabled`: Boolean flag
- `warp_enabled`: Boolean flag

**Frontend Display:**

- Show active research effects summary
- Display multipliers and bonuses
- Show which research provides which effects

### Dark Matter System

**Resource Properties:**

- **Empire-Level Resource**: Dark Matter is stored at the empire level, not per-planet
- **Exotic Resource**: Used for late-game content (Era 5+)
- **Not Tradeable**: Design choice to preserve rarity and prevent exploitation

**Production Mechanics:**

1. **Facility Production**:
   - Facilities with `"dark_matter"` in `per_tick` JSON produce DM
   - Example: `singularity_reactor` produces `{"dark_matter": 50}` per tick
   - Production is **per-planet** (each facility produces independently)
   - Production is **aggregated to empire-level** (summed across all planets)

2. **Research Multipliers**:
   - Research multipliers apply to dark matter production
   - Example: `per_tick_prod_mul: 1.2` multiplies DM production by 1.2

3. **Production Calculation**:
   ```
   For each planet:
     For each facility with dark_matter in per_tick:
       base_production = per_tick.dark_matter
       effective_production = base_production × research_multipliers
       total_empire_production += effective_production
   ```

**Capacity Management:**

1. **Capacity Storage**:
   - Stored in `dark_matter_capacity` field on Empire model
   - Starts at 0 (new empires have no capacity)
   - Can be increased by facilities (e.g., `storage_depot` might increase capacity)

2. **Overflow Handling**:
   - If production exceeds capacity, excess is **discarded** (not stored)
   - Overflow is logged for debugging
   - No automatic conversion or refund

3. **Capacity Enforcement**:
   ```
   if (dark_matter_current + production > dark_matter_capacity):
     dark_matter_current = dark_matter_capacity
     overflow = production - (dark_matter_capacity - dark_matter_current)
     log_overflow(overflow)
   else:
     dark_matter_current += production
   ```

**Usage:**

- **Era 5 Builds**: Required for building Era 5 facilities, ships, and research
- **Special Actions**: Used for late-game special actions (if implemented)
- **Cost Field**: Check `cost_dark_matter` in definition JSON (if present)

**Frontend Display Requirements:**

1. **Resource Bar**:
   - Show `dark_matter_current` / `dark_matter_capacity` with progress bar
   - Display percentage utilization
   - Color-code: Green (< 80%), Yellow (80-95%), Red (> 95%)

2. **Production Display**:
   - Use `GET /api/v1/empire/dark-matter` to get production info
   - Show `production_per_tick` total
   - Display `production_by_planet` breakdown
   - Show which facilities contribute to production

3. **Capacity Warnings**:
   - Warn when `capacity_utilization > 0.8` (80% full)
   - Show overflow warning if production would exceed capacity
   - Suggest building capacity-increasing facilities

4. **Production Breakdown**:
   - Show `production_by_planet` array
   - Display each planet's production rate
   - List facilities contributing to each planet's production
   - Show applied research multipliers

5. **Integration with Tech Tree**:
   - Show dark matter costs in build previews
   - Display dark matter requirement for Era 5 items
   - Warn if insufficient dark matter for builds

---

## API Endpoints Reference

### New Endpoints

> **Note**: Some endpoints below are described for completeness but may not be fully implemented yet. Check the actual API to confirm availability. Endpoints marked with ✅ are confirmed implemented.

#### 1. Get Tech Tree Data ✅ (Implemented)

```
GET /api/empire/tech-tree
```

**Description**: Returns complete tech tree visualization data with unlock status, prerequisites, era, and specialization info.

**Authentication**: Required (Bearer token)

**Response**:

```json
{
  "empire": {
    "id": 1,
    "active_era": 3,
    "specializations_unlocked": ["industrial", "military"]
  },
  "facilities": [
    {
      "id": 1,
      "slug": "mines",
      "name": "Reclaimed Surface Mines",
      "era": 1,
      "specialization": "general",
      "per_tick": {"tellerium": 10},
      "upkeep": {"tellerium": 0, "krypton": 0},
      "prerequisites": [],
      "unlocked": true,
      "can_build": true,
      "missing_prerequisites": []
    }
  ],
  "research": [
    {
      "id": 1,
      "slug": "resource_optimization",
      "name": "Resource Optimization",
      "era": 2,
      "specialization": "industrial",
      "effects": {"tellerium_per_tick_mul": 1.10},
      "prerequisite_facilities": ["research_lab"],
      "prerequisite_research": [],
      "unlocked": true,
      "can_research": true,
      "completed": false,
      "missing_prerequisites": []
    }
  ],
  "ships": [...],
  "defences": [...]
}
```

#### 2. Get Empire State ✅ (Implemented)

```
GET /api/empire/state
```

**Description**: Returns empire era, specializations, dark matter, and active research effects summary.

**Authentication**: Required

**Response**:

```json
{
  "active_era": 3,
  "specializations_unlocked": ["industrial", "military"],
  "dark_matter_current": 150,
  "dark_matter_capacity": 500,
  "dark_matter_production_per_tick": 25,
  "active_research_effects": {
    "per_tick_prod_mul": 1.32,
    "ship_armor": 37,
    "travel_ticks_mul": 0.675,
    "invasion_enabled": true
  },
  "should_prompt_specialization": false
}
```

#### 3. Select Specialization ✅ (Implemented)

```
POST /api/empire/specializations/select
```

**Description**: Unlock a specialization (Option B: can unlock multiple).

**Authentication**: Required

**Request Body**:

```json
{
  "specialization": "industrial"
}
```

**Response (Success)**:

```json
{
  "status": "success",
  "message": "Specialization unlocked",
  "specialization": "industrial",
  "specializations_unlocked": ["industrial"]
}
```

**Response (Error)**:

```json
{
  "status": "error",
  "code": "CANNOT_UNLOCK",
  "message": "Cannot unlock specialization",
  "errors": [
    "Era 3 required to unlock specializations",
    "Advanced Research Lab or Automated Factory required"
  ]
}
```

#### 4. Get Available Facilities ✅ (Use definitions endpoint with filtering)

```
GET /api/facilities/available?era=3&specialization=industrial
```

**Description**: List facilities filtered by era/specialization with prerequisites check.

**Note**: Currently use `GET /api/facilities/definitions?era=3&specialization=industrial` which supports filtering.

**Authentication**: Optional (if provided, filters by empire state)

**Query Parameters**:

- `era` (optional): Filter by era (returns facilities with era <= provided)
- `specialization` (optional): Filter by specialization

**Response**:

```json
{
  "facilities": [
    {
      "id": 1,
      "slug": "mines",
      "name": "Reclaimed Surface Mines",
      "era": 1,
      "specialization": "general",
      "base_tellerium_cost": 1000,
      "base_krypton_cost": 500,
      "build_time_ticks": 2,
      "per_tick": { "tellerium": 10 },
      "upkeep": { "tellerium": 0, "krypton": 0 },
      "prerequisites": [],
      "description": "Scavenged drills and ore processing.",
      "notes": "starter facility; scales with resource_optimization research.",
      "can_build": true,
      "missing_prerequisites": []
    }
  ]
}
```

#### 5. Get Available Research ✅ (Use definitions endpoint with filtering)

```
GET /api/research/available?era=3&specialization=military
```

**Description**: List research filtered by era/specialization with prerequisites check.

**Note**: Currently use `GET /api/research/definitions?era=3&specialization=military` which supports filtering.

**Authentication**: Optional (if provided, filters by empire state)

**Query Parameters**: Same as facilities endpoint

**Response**:

```json
{
  "research": [
    {
      "id": 1,
      "slug": "military_doctrine",
      "name": "Military Doctrine",
      "era": 2,
      "specialization": "military",
      "cost_tellerium": 5000,
      "cost_krypton": 5000,
      "build_time_ticks": 5,
      "prerequisite_facilities": ["research_lab"],
      "prerequisite_research": [],
      "effects": { "ship_attack": 0.05 },
      "description": "Codified field tactics from old manuals.",
      "notes": "small global combat bonus.",
      "can_research": true,
      "completed": false,
      "missing_prerequisites": []
    }
  ]
}
```

#### 6. Get Available Ships ✅ (Implemented)

```
GET /api/ships/available?era=3&specialization=military
```

**Description**: List ships filtered by era/specialization with prerequisites check.

**Authentication**: Optional

**Query Parameters**: Same as facilities endpoint

**Response**: Similar structure to facilities/research endpoints

#### 7. Get Available Defences ✅ (Implemented)

```
GET /api/defences/available?era=3&specialization=military
```

**Description**: List defences filtered by era/specialization.

**Authentication**: Optional

**Response**: Similar structure to other endpoints

#### 8. Check Prerequisites ✅ (Implemented)

```
POST /api/prerequisites/check
```

**Description**: Check if can build specific item (facility/research/ship/defence), returns detailed validation.

**Authentication**: Required

**Request Body**:

```json
{
  "type": "facility",
  "slug": "advanced_shipyard"
}
```

**Response (Can Build)**:

```json
{
  "can_build": true,
  "errors": []
}
```

**Response (Cannot Build)**:

```json
{
  "can_build": false,
  "errors": [
    "Era 3 required (current: 2)",
    "Specialization 'military' required",
    "Facility 'basic_shipyard' required"
  ],
  "missing_prerequisites": {
    "era": 3,
    "specialization": ["military"],
    "facilities": ["basic_shipyard"]
  }
}
```

#### 9. Get Research Effects Summary ✅ (Implemented)

```
GET /api/research/effects
```

**Description**: Get summary of all active research effects for current empire.

**Authentication**: Required

**Response**:

```json
{
  "active_effects": {
    "per_tick_prod_mul": 1.32,
    "tellerium_per_tick_mul": 1.1,
    "travel_ticks_mul": 0.675,
    "upkeep_reduction": 0.05,
    "ship_armor": 37,
    "ship_attack": 0.2,
    "fleet_attack_bonus": 0.08,
    "shield_strength": 50,
    "detection_range": 1,
    "invasion_enabled": true,
    "warp_enabled": false
  },
  "effects_by_research": {
    "resource_optimization": {
      "tellerium_per_tick_mul": 1.1
    },
    "industrial_automation": {
      "per_tick_prod_mul": 1.2
    },
    "military_doctrine": {
      "ship_attack": 0.05
    }
  }
}
```

#### 10. Preview Facility Effects ✅ (Implemented)

```
GET /api/facilities/preview?planet_id=1&facility_slug=mines
```

**Description**: Preview facility effects (per_tick, upkeep) before building.

**Authentication**: Required

**Query Parameters**:

- `planet_id`: Planet ID to check
- `facility_slug`: Facility to preview

**Response**:

```json
{
  "facility": {
    "slug": "mines",
    "name": "Reclaimed Surface Mines",
    "per_tick": { "tellerium": 10 },
    "upkeep": { "tellerium": 0, "krypton": 0 }
  },
  "projected_production": {
    "tellerium_per_tick": 13.2,
    "krypton_per_tick": 0
  },
  "projected_upkeep": {
    "tellerium_per_tick": 0,
    "krypton_per_tick": 0
  },
  "net_production": {
    "tellerium_per_tick": 13.2,
    "krypton_per_tick": 0
  },
  "applied_multipliers": {
    "per_tick_prod_mul": 1.2,
    "tellerium_per_tick_mul": 1.1
  }
}
```

#### 11. Get Era Progression Status ✅ (Implemented)

```
GET /api/empire/era-progression
```

**Description**: Get era progression status and requirements to unlock next era.

**Authentication**: Required

**Response**:

```json
{
  "current_era": 3,
  "next_era": 4,
  "can_progress": false,
  "requirements": {
    "facilities": [
      {
        "slug": "quantum_lab",
        "name": "Quantum Research Laboratory",
        "completed": false
      },
      {
        "slug": "orbital_shipyard",
        "name": "Orbital Shipyard",
        "completed": true
      }
    ],
    "message": "Complete Quantum Lab OR Orbital Shipyard to progress to Era 4"
  },
  "progress_percentage": 50
}
```

#### 12. Get Dark Matter Info ✅ (Implemented)

```
GET /api/empire/dark-matter
```

**Description**: Get dark matter current/capacity and production rate.

**Authentication**: Required

**Response**:

```json
{
  "dark_matter_current": 150,
  "dark_matter_capacity": 500,
  "production_per_tick": 25,
  "capacity_utilization": 0.3,
  "production_by_planet": [
    {
      "planet_id": 1,
      "planet_name": "Homeworld",
      "production_per_tick": 25,
      "facilities": [
        {
          "facility_slug": "singularity_reactor",
          "production": 25
        }
      ]
    }
  ]
}
```

---

### Enhanced Existing Endpoints

> ✅ = Confirmed implemented | ⚠️ = Planned but may need implementation

#### 1. Get Facility Definitions ✅

```
GET /api/facilities/definitions?era=3&specialization=industrial
```

**Changes**:

- Added query parameters: `era`, `specialization`
- Returns new fields: `per_tick`, `upkeep`, `specialization`, `notes`
- If authenticated, filters by empire's available items

**New Response Fields**:

- `per_tick`: JSON object with resource production
- `upkeep`: JSON object with upkeep costs
- `specialization`: String (`general`, `industrial`, `military`, `relic`)
- `notes`: String with dev notes/UI hints

#### 2. Get Research Definitions ✅

```
GET /api/research/definitions?era=3&specialization=military
```

**Changes**:

- Added query parameters: `era`, `specialization`
- Returns new fields: `effects`, `prerequisite_research`, `specialization`, `notes`
- If authenticated, filters by empire's available items

**New Response Fields**:

- `effects`: JSON object with research effects
- `prerequisite_research`: JSON array of research slugs
- `specialization`: String
- `notes`: String

#### 3. Get Ship Definitions ✅

```
GET /api/ships/definitions?era=3&specialization=military
```

**Changes**:

- Added query parameters: `era`, `specialization`
- Returns new fields: `specialization`, `notes`

#### 4. Get Defence Definitions ✅

```
GET /api/defences/definitions?era=3&specialization=military
```

**Changes**:

- Added query parameters: `era`, `specialization`
- Returns new fields: `effects`, `specialization`, `notes`

#### 5. Get Empire Details ✅

```
GET /api/empires/{id}
```

**Changes**:

- Returns new fields in `empire` object:
  - `active_era`: Integer (1-5)
  - `specializations_unlocked`: JSON array of strings
  - `dark_matter_current`: Integer
  - `dark_matter_capacity`: Integer
  - `active_research_effects`: JSON object with all active effects

**Example Response**:

```json
{
  "empire": {
    "id": 1,
    "name": "Galactic Empire",
    "active_era": 3,
    "specializations_unlocked": ["industrial", "military"],
    "dark_matter_current": 150,
    "dark_matter_capacity": 500,
    "active_research_effects": {
      "per_tick_prod_mul": 1.32,
      "ship_armor": 37
    },
    ...
  }
}
```

#### 6. Build Facility ✅ (Enhanced with prerequisite validation)

```
POST /api/planets/{planetId}/facilities
```

**Changes**:

- Now validates era, specialization, and research prerequisites
- Returns detailed error messages if prerequisites not met

**Error Response**:

```json
{
  "status": "error",
  "code": "CANNOT_BUILD",
  "message": "Cannot build facility: Era 3 required (current: 2), Specialization 'military' required",
  "errors": ["Era 3 required (current: 2)", "Specialization 'military' required"]
}
```

#### 7. Start Research ✅ (Enhanced with prerequisite validation)

```
POST /api/planets/{planetId}/research
```

**Changes**:

- Now validates `prerequisite_research` array
- Returns detailed error messages

**Error Response**: Similar to facility build errors

#### 8. Build Ship ✅ (Enhanced with prerequisite validation)

```
POST /api/planets/{planetId}/ships
```

**Changes**:

- Now validates era and specialization requirements
- Returns detailed error messages

#### 9. Build Defence ✅ (Enhanced with prerequisite validation)

```
POST /api/planets/{planetId}/defences
```

**Changes**:

- Now validates era and specialization requirements
- Returns detailed error messages

---

## Integration Patterns

### 1. Tech Tree Visualization

**Data Flow**:

1. Fetch tech tree data: `GET /api/empire/tech-tree`
2. Organize by era and specialization
3. Build dependency graph from prerequisites
4. Highlight unlocked/locked/completed items
5. Show missing prerequisites on hover/click

**Key Fields to Display**:

- `unlocked`: Boolean (era/specialization check)
- `can_build`: Boolean (all prerequisites met)
- `completed`: Boolean (already built/researched)
- `missing_prerequisites`: Array of missing items

### 2. Era Progression Display

**Data Flow**:

1. Fetch era progression: `GET /api/empire/era-progression`
2. Display current era badge
3. Show progress bar to next era
4. List requirements with completion status
5. Highlight when ready to progress

### 3. Specialization Selection

**Data Flow**:

1. Check if should prompt: `GET /api/empire/state` → `should_prompt_specialization`
2. Show selection modal when `true`
3. Display available specializations with descriptions
4. Submit selection: `POST /api/empire/specializations/select`
5. Refresh tech tree to show unlocked items

### 4. Facility Production Display

**Data Flow**:

1. Fetch planet facilities with definitions
2. Calculate total production per resource:
   - Sum `per_tick` from all active facilities
   - Apply research multipliers
3. Calculate total upkeep per resource
4. Display net production (production - upkeep)
5. Show warnings if upkeep exceeds production

**Preview Before Building**:

1. User clicks facility to build
2. Call `GET /api/facilities/preview?planet_id=X&facility_slug=Y`
3. Display projected production and upkeep
4. Show net effect on resources

### 5. Research Effects Summary

**Data Flow**:

1. Fetch effects: `GET /api/research/effects`
2. Group by category (production, combat, travel, etc.)
3. Display multipliers and bonuses
4. Show which research provides which effects
5. Update in real-time when research completes

### 6. Dark Matter Display

**Data Flow**:

1. Fetch dark matter info: `GET /api/empire/dark-matter`
2. Display current/capacity with progress bar
3. Show production rate
4. Display breakdown by planet
5. Warn if approaching capacity

### 7. Prerequisite Validation

**Before Building**:

1. User selects item to build
2. Call `POST /api/prerequisites/check` with type and slug
3. Display results:
   - If `can_build`: Show costs and build time
   - If not: Show `errors` array with missing prerequisites
4. Disable build button if prerequisites not met

### 8. Filtering Available Items

**Pattern**:

1. Fetch empire state: `GET /api/empire/state`
2. Use `active_era` and `specializations_unlocked` to filter
3. Call endpoints with filters:
   - `GET /api/facilities/available?era={active_era}`
   - Or let backend filter automatically if authenticated

---

## Data Structures

### Facility Definition

```json
{
  "id": 1,
  "slug": "mines",
  "name": "Reclaimed Surface Mines",
  "era": 1,
  "specialization": "general",
  "base_tellerium_cost": 1000,
  "base_krypton_cost": 500,
  "build_time_ticks": 2,
  "prerequisites": [],
  "description": "Scavenged drills and ore processing.",
  "per_tick": {
    "tellerium": 10,
    "krypton": 0,
    "dark_matter": 0
  },
  "upkeep": {
    "tellerium": 0,
    "krypton": 0
  },
  "notes": "starter facility; scales with resource_optimization research."
}
```

### Research Definition

```json
{
  "id": 1,
  "slug": "resource_optimization",
  "name": "Resource Optimization",
  "era": 2,
  "specialization": "industrial",
  "cost_tellerium": 4000,
  "cost_krypton": 6000,
  "build_time_ticks": 4,
  "prerequisite_facilities": ["research_lab"],
  "prerequisite_research": [],
  "description": "Improved extraction and refining algorithms.",
  "effects": {
    "tellerium_per_tick_mul": 1.1
  },
  "notes": "applies multiplicatively to per_tick outputs."
}
```

### Ship Definition

```json
{
  "id": 1,
  "slug": "scout_fighter",
  "name": "Scout Fighter",
  "era": 2,
  "specialization": "general",
  "class": "fighter",
  "tellerium_cost": 1000,
  "krypton_cost": 1000,
  "build_time_ticks": 1,
  "prerequisites": ["basic_shipyard", "military_doctrine"],
  "notes": "fast recon unit."
}
```

### Defence Definition

```json
{
  "id": 1,
  "slug": "basic_turret",
  "name": "Basic Scrap Turret",
  "era": 2,
  "specialization": "military",
  "target_class": "fighter",
  "tellerium_cost": 500,
  "krypton_cost": 300,
  "build_time_ticks": 1,
  "effects": {
    "dps": 5
  },
  "notes": ""
}
```

### Empire State

```json
{
  "active_era": 3,
  "specializations_unlocked": ["industrial", "military"],
  "dark_matter_current": 150,
  "dark_matter_capacity": 500,
  "active_research_effects": {
    "per_tick_prod_mul": 1.32,
    "tellerium_per_tick_mul": 1.1,
    "ship_armor": 37,
    "travel_ticks_mul": 0.675,
    "invasion_enabled": true
  }
}
```

### Research Effects Structure

```json
{
  "per_tick_prod_mul": 1.32, // Multiplier (multiplicative)
  "tellerium_per_tick_mul": 1.1, // Multiplier (multiplicative)
  "travel_ticks_mul": 0.675, // Multiplier (multiplicative, reduces travel time)
  "upkeep_reduction": 0.05, // Multiplier (reduces upkeep)
  "ship_armor": 37, // Flat bonus (additive)
  "ship_attack": 0.2, // Percentage bonus (additive)
  "fleet_attack_bonus": 0.08, // Percentage bonus (additive)
  "shield_strength": 50, // Flat bonus (additive)
  "detection_range": 1, // Flat bonus (additive)
  "colony_cap": 1, // Flat bonus (additive)
  "invasion_enabled": true, // Boolean flag
  "warp_enabled": false // Boolean flag
}
```

---

## Error Handling

### Common Error Codes

- `CANNOT_BUILD`: Prerequisites not met (facility/research/ship/defence)
- `CANNOT_UNLOCK`: Cannot unlock specialization
- `INSUFFICIENT_RESOURCES`: Not enough resources for build
- `FACILITY_DEACTIVATED`: Facility deactivated due to insufficient upkeep
- `DARK_MATTER_OVERFLOW`: Dark matter production exceeds capacity

### Error Response Format

```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "errors": ["Detailed error message 1", "Detailed error message 2"],
  "details": {
    // Additional error context
  }
}
```

---

## Best Practices

1. **Always Fetch Empire State First**: Use `GET /api/empire/state` to get current era, specializations, and effects before displaying tech tree

2. **Cache Tech Tree Data**: Tech tree definitions change infrequently, cache them client-side

3. **Validate Prerequisites Before Building**: Use `POST /api/prerequisites/check` to validate before showing build confirmation

4. **Show Production Preview**: Always show facility production/upkeep preview before building

5. **Real-time Updates**: Subscribe to WebSocket events for:
   - Research completion (update effects)
   - Era progression (refresh tech tree)
   - Specialization unlock (refresh tech tree)
   - Facility deactivation (show warnings)

6. **Filter by Empire State**: When authenticated, endpoints automatically filter by empire's era and specializations

7. **Display Missing Prerequisites**: Always show what's missing when item cannot be built

8. **Group Effects by Category**: Organize research effects by category (production, combat, travel, etc.) for better UX

9. **Warn About Upkeep**: Show warnings if facility upkeep exceeds production

10. **Dark Matter Capacity Warnings**: Warn when dark matter approaches capacity

---

## Migration Notes for Frontend

### Breaking Changes

1. **Facility Definitions**: Now include `per_tick`, `upkeep`, `specialization`, `notes` fields
2. **Research Definitions**: Now include `effects`, `prerequisite_research`, `specialization`, `notes` fields
3. **Empire Object**: Now includes `active_era`, `specializations_unlocked`, `dark_matter_current`, `dark_matter_capacity`, `active_research_effects`
4. **Prerequisite Validation**: Build endpoints now return detailed errors if prerequisites not met

### New Features to Implement

1. Era progression display
2. Specialization selection UI
3. Facility production/upkeep display
4. Research effects summary
5. Dark matter resource display
6. Tech tree visualization with prerequisites
7. Prerequisite validation UI
8. Production preview before building

---

## Testing Checklist

- [ ] Era progression displays correctly
- [ ] Specialization selection works
- [ ] Facility production/upkeep calculates correctly
- [ ] Research effects apply and stack correctly
- [ ] Dark matter production and capacity limits work
- [ ] Prerequisite validation works for all item types
- [ ] Filtering by era/specialization works
- [ ] Tech tree visualization shows correct unlock status
- [ ] Facility deactivation warnings appear
- [ ] Dark matter overflow warnings appear

---

## Implementation Status

### ✅ Fully Implemented (All Endpoints)

**Empire Endpoints:**

- `GET /api/v1/empire/state` - Empire state with era, specializations, dark matter, research effects
- `POST /api/v1/empire/specializations/select` - Specialization selection/unlocking
- `GET /api/v1/empire/era-progression` - Era progression status and requirements
- `GET /api/v1/empire/dark-matter` - Dark matter info with production breakdown
- `GET /api/v1/empire/tech-tree` - Complete tech tree visualization data

**Research Endpoints:**

- `GET /api/v1/research/effects` - Research effects summary with breakdown by research
- `GET /api/v1/research/definitions` - Enhanced with era/specialization filtering

**Facility Endpoints:**

- `GET /api/v1/facilities/preview` - Facility production/upkeep preview
- `GET /api/v1/facilities/definitions` - Enhanced with era/specialization filtering

**Ship & Defence Endpoints:**

- `GET /api/v1/ships/available` - Available ships with prerequisite validation
- `GET /api/v1/ships/definitions` - Enhanced with era/specialization filtering
- `GET /api/v1/defences/available` - Available defences with prerequisite validation
- `GET /api/v1/defences/definitions` - Enhanced with era/specialization filtering

**Prerequisite Endpoints:**

- `POST /api/v1/prerequisites/check` - Prerequisite validation endpoint

**Core Systems:**

- Facility definitions with filtering by era/specialization
- Research definitions with filtering by era/specialization
- Empire details with era, specializations, dark matter, research effects
- Enhanced prerequisite validation in build endpoints
- Resource production service with facility per_tick/upkeep
- Research effects application on completion
- Specialization service logic
- Era progression tracking (automatic on facility completion)

**All endpoints are fully functional and tested on staging.**

## Real-World Integration Examples

### Example 1: Building a Facility with Preview

```javascript
// 1. User clicks "Build Mines" button
// 2. Show preview modal
const preview = await fetch('/api/v1/facilities/preview?planet_id=1&facility_slug=mines', {
  headers: { Authorization: `Bearer ${token}` },
})

const data = await preview.json()
// Response:
// {
//   facility: { slug: "mines", name: "Reclaimed Surface Mines", per_tick: {...}, upkeep: {...} },
//   projected_production: { tellerium_per_tick: 13.2, krypton_per_tick: 0, dark_matter_per_tick: 0 },
//   projected_upkeep: { tellerium_per_tick: 0, krypton_per_tick: 0 },
//   net_production: { tellerium_per_tick: 13.2, krypton_per_tick: 0 },
//   applied_multipliers: { per_tick_prod_mul: 1.2, tellerium_per_tick_mul: 1.1 }
// }

// 3. Display preview:
// - Show production: +13.2 tellerium/tick
// - Show upkeep: 0 tellerium/tick
// - Show net: +13.2 tellerium/tick
// - Show applied multipliers: "20% production, 10% tellerium"

// 4. User confirms, build facility
await fetch('/api/v1/planets/1/facilities', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ facility_slug: 'mines' }),
})
```

### Example 2: Specialization Selection Flow

```javascript
// 1. Check if should prompt
const state = await fetch('/api/v1/empire/state', {
  headers: { Authorization: `Bearer ${token}` },
})

const stateData = await state.json()
if (stateData.should_prompt_specialization) {
  // 2. Show specialization selection modal
  showSpecializationModal({
    options: [
      {
        slug: 'industrial',
        name: 'Industrial',
        description: 'Focus on resource production and automation',
        icon: '🏭',
      },
      {
        slug: 'military',
        name: 'Military',
        description: 'Focus on combat and warfare technologies',
        icon: '⚔️',
      },
      {
        slug: 'relic',
        name: 'Relic',
        description: 'Focus on exotic tech and dark matter',
        icon: '🔮',
      },
    ],
  })
}

// 3. User selects specialization(s)
async function unlockSpecialization(specialization) {
  const response = await fetch('/api/v1/empire/specializations/select', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ specialization }),
  })

  if (response.ok) {
    // 4. Refresh tech tree to show newly unlocked items
    refreshTechTree()
    showNotification(`Specialization "${specialization}" unlocked!`)
  }
}
```

### Example 3: Era Progression Display

```javascript
// 1. Fetch era progression status
const progression = await fetch('/api/v1/empire/era-progression', {
  headers: { Authorization: `Bearer ${token}` },
})

const data = await progression.json()
// Response:
// {
//   current_era: 2,
//   next_era: 3,
//   can_progress: false,
//   requirements: {
//     facilities: [
//       { slug: "advanced_research_lab", name: "Advanced Research Lab", completed: false },
//       { slug: "automated_factory", name: "Automated Factory", completed: true }
//     ],
//     message: "Complete Advanced Research Lab OR Automated Factory to progress to Era 3"
//   },
//   progress_percentage: 50
// }

// 2. Display era progression UI
renderEraProgression({
  currentEra: data.current_era,
  nextEra: data.next_era,
  progress: data.progress_percentage,
  requirements: data.requirements.facilities,
  canProgress: data.can_progress,
  message: data.requirements.message,
})

// 3. Listen for era progression (WebSocket or polling)
// When era progresses, show celebration and refresh tech tree
```

### Example 4: Research Effects Summary

```javascript
// 1. Fetch research effects
const effects = await fetch('/api/v1/research/effects', {
  headers: { Authorization: `Bearer ${token}` },
})

const data = await effects.json()
// Response:
// {
//   active_effects: {
//     per_tick_prod_mul: 1.32,
//     tellerium_per_tick_mul: 1.1,
//     travel_ticks_mul: 0.675,
//     upkeep_reduction: 0.05,
//     ship_armor: 37,
//     invasion_enabled: true
//   },
//   effects_by_research: {
//     resource_optimization: { tellerium_per_tick_mul: 1.1 },
//     industrial_automation: { per_tick_prod_mul: 1.2 },
//     military_doctrine: { ship_armor: 10 }
//   }
// }

// 2. Display effects summary
renderEffectsSummary({
  production: {
    total: '32% increase',
    tellerium: '10% increase',
    breakdown: data.effects_by_research,
  },
  travel: {
    speed: '32.5% faster',
    multiplier: data.active_effects.travel_ticks_mul,
  },
  combat: {
    armor: '+37',
    breakdown: data.effects_by_research,
  },
  unlocks: {
    invasion: data.active_effects.invasion_enabled,
  },
})
```

### Example 5: Dark Matter Display

```javascript
// 1. Fetch dark matter info
const darkMatter = await fetch('/api/v1/empire/dark-matter', {
  headers: { Authorization: `Bearer ${token}` },
})

const data = await darkMatter.json()
// Response:
// {
//   dark_matter_current: 150,
//   dark_matter_capacity: 500,
//   production_per_tick: 25,
//   capacity_utilization: 0.3,
//   production_by_planet: [
//     {
//       planet_id: 1,
//       planet_name: "Homeworld",
//       production_per_tick: 25,
//       facilities: [
//         { facility_slug: "singularity_reactor", production: 25 }
//       ]
//     }
//   ]
// }

// 2. Display dark matter resource bar
renderDarkMatterBar({
  current: data.dark_matter_current,
  capacity: data.dark_matter_capacity,
  utilization: data.capacity_utilization,
  production: data.production_per_tick,
  warning: data.capacity_utilization > 0.8 ? 'Approaching capacity!' : null,
})

// 3. Show production breakdown
renderProductionBreakdown(data.production_by_planet)
```

## Common Edge Cases & Gotchas

### 1. Era Progression Timing

- **Issue**: Era progression happens immediately on facility completion, not on next tick
- **Solution**: Listen for empire update events or poll `GET /api/v1/empire/state` after facility completion
- **Note**: Era progression is automatic - don't try to manually trigger it

### 2. Specialization Unlocking

- **Issue**: Can unlock multiple specializations (Option B), but can't unlock same one twice
- **Solution**: Check `specializations_unlocked` array before showing unlock button
- **Note**: Specialization unlock requires Era 3 AND prerequisite facility

### 3. Facility Deactivation

- **Issue**: If planet resources go negative, ALL facilities on that planet are deactivated
- **Solution**: Show warning if upkeep exceeds production, suggest transferring resources
- **Note**: Deactivation happens server-side on tick, not client-side

### 4. Research Effects Stacking

- **Issue**: Multipliers stack multiplicatively, not additively
- **Solution**: Display effective multipliers, not individual values
- **Note**: `per_tick_prod_mul: 0.2` means 20% increase (multiply by 1.2), not add 0.2

### 5. Dark Matter Overflow

- **Issue**: Production exceeding capacity is discarded, not stored
- **Solution**: Warn when approaching capacity, suggest building capacity-increasing facilities
- **Note**: Overflow is logged server-side but not visible to player

### 6. Prerequisite Validation

- **Issue**: Research prerequisites are checked across ALL planets, not just one planet
- **Solution**: Show global research completion status, not per-planet
- **Note**: Facility prerequisites are per-planet, research prerequisites are empire-wide

### 7. Tech Tree Filtering

- **Issue**: Items are filtered by era AND specialization, both must pass
- **Solution**: Show locked items with explanation (era locked vs specialization locked)
- **Note**: Items with `specialization: "general"` are always available (if era allows)

### 8. Build Queue

- **Issue**: Build queue is per-planet, not empire-wide
- **Solution**: Show build queue for each planet separately
- **Note**: Queue items are processed in order (FIFO)

## Tick Processing Order & Timing

Understanding the tick processing order is crucial for frontend display accuracy:

**Tick Processing Sequence (Server-Side):**

1. **Resource Production** (`processResourceProduction`):
   - Apply facility `per_tick` production to planets
   - Apply facility `upkeep` costs (deduct from planets)
   - Handle facility deactivation if upkeep cannot be paid
   - Aggregate dark matter production to empire-level
   - Apply research multipliers to production
   - Apply boosters if active

2. **AI Actions** (`processAIActions`):
   - Generate AI decisions
   - Execute AI actions
   - (Not directly related to tech tree, but runs during tick)

3. **Construction Queue Decrement** (`decrementConstructionTicks`):
   - Decrement `ticks_remaining` for all active queue items
   - Apply construction boosters if active

4. **Construction Completion** (`processConstructionCompletion`):
   - Process items with `ticks_remaining <= 0`
   - **Facilities**: Create facility instance, check era progression
   - **Research**: Add to `research_completed`, apply research effects
   - **Ships**: Create fleet with ships
   - **Defences**: Create defence instance

5. **Fleet Arrivals & Combat** (`processFleetArrivals`):
   - Process fleets arriving this tick
   - Resolve combat if attacking enemy planet

6. **Score Recalculation** (`recalculateEmpireScores`):
   - Update empire scores based on new state

**Frontend Implications:**

- **Era Progression**: Happens on facility completion (step 4), not on tick start
- **Research Effects**: Applied on research completion (step 4), affects next tick's production
- **Facility Deactivation**: Happens during resource production (step 1), affects same tick
- **Production Display**: Should show "next tick" production (after current tick completes)
- **Build Queue**: Decrements each tick (step 3), completes when reaches 0 (step 4)

**WebSocket Events to Listen For:**

- `EmpireUpdated` - Fired when empire state changes (era progression, specializations)
- `PlanetUpdated` - Fired when planet resources or facilities change
- `TickProcessed` - Fired after each tick completes (for real-time updates)
- (Future: `FacilityDeactivated` - When facilities are deactivated)

## Support

For questions or issues, refer to:

- **API Documentation**: `/api/documentation` (Swagger) - Full API reference
- **Game Definitions**: `database/seeders/GameDefinitionsSeederNew.php` - All game data
- **Implementation Status**: All endpoints are fully implemented and tested on staging
- **Backend Services**:
  - `app/Services/SpecializationService.php` - Era progression and specialization logic
  - `app/Services/ResearchEffectService.php` - Research effects management
  - `app/Services/ConstructionService.php` - Prerequisite validation and construction completion
  - `app/Services/ResourceProductionService.php` - Facility production/upkeep and deactivation
  - `app/Services/TickProcessor.php` - Overall tick processing orchestration

## Nuanced Gameplay Details

### Era Progression Mechanics

**Automatic Progression:**
Era progression happens automatically when facilities are completed. The system checks for era milestones on every facility completion:

- **Era 1 → Era 2**: Automatically when `research_lab` facility is completed on any planet
- **Era 2 → Era 3**: Automatically when `advanced_research_lab` OR `automated_factory` is completed
- **Era 3 → Era 4**: Automatically when `quantum_lab` OR `orbital_shipyard` is completed
- **Era 4 → Era 5**: Automatically when `singularity_reactor` OR `fortress_shipyard` is completed

**Frontend Implications:**

- Era progression is **not** manual - it happens automatically
- Use `GET /api/v1/empire/era-progression` to show progress toward next era
- Display era unlock requirements before they're met
- Show celebration/notification when era progresses (listen for empire update events)
- Era progression is checked server-side, so you don't need to manually trigger it

**Important Notes:**

- Era progression is checked on facility completion, not on tick
- Multiple facilities can trigger the same era (OR logic)
- Era progression is one-way (can't go backwards)
- Once an era requirement is met, progression happens immediately

### Specialization Unlocking Flow

**Unlock Requirements:**

1. **Era 3** must be reached (automatically when `advanced_research_lab` or `automated_factory` is built)
2. **Prerequisite Facility**: Must have either:
   - `advanced_research_lab` OR
   - `automated_factory`
3. **Specialization Not Already Unlocked** (Option B allows multiple, but can't unlock same one twice)

**Unlock Process:**

1. Check `GET /api/v1/empire/state` → `should_prompt_specialization` field
2. If `true`, show specialization selection UI
3. User selects one or more specializations (Option B: flexible)
4. Call `POST /api/v1/empire/specializations/select` with `{"specialization": "industrial"}` (can be called multiple times for different specializations)
5. Refresh tech tree to show newly unlocked items

**Specialization Options:**

- **Industrial**: Focus on resource production, automation, efficiency
- **Military**: Focus on combat, ships, defenses, warfare
- **Relic**: Focus on exotic tech, dark matter, late-game content

**Frontend UI Recommendations:**

- Show specialization selection modal when `should_prompt_specialization` is `true`
- Display what each specialization unlocks (show tech tree preview)
- Allow multiple selections (Option B)
- Show which items become available after each selection
- Highlight specialization-specific items in tech tree

### Dark Matter System Details

**Production Mechanics:**

- Dark Matter is produced by facilities with `dark_matter` in their `per_tick` JSON
- Production is **per-planet** (each facility on each planet produces independently)
- Production is **aggregated to empire-level** (all planet production summed)
- Research multipliers apply to dark matter production
- Example: `singularity_reactor` produces 50 DM per tick (base), multiplied by research effects

**Capacity Management:**

- Dark Matter has a capacity limit stored in `dark_matter_capacity` (empire-level)
- Capacity starts at 0 (new empires have no capacity)
- Capacity can be increased by facilities (e.g., `storage_depot` might increase capacity)
- Overflow handling: If production exceeds capacity, excess is **discarded** (logged but not stored)
- Use `GET /api/v1/empire/dark-matter` to see capacity utilization

**Frontend Display:**

- Show dark matter as a separate resource bar (like tellerium/krypton)
- Display current/capacity with progress bar
- Show production rate per tick
- Display breakdown by planet (which planets produce DM)
- Warn when approaching capacity (e.g., 80% full)
- Show overflow warnings if production would exceed capacity

**Usage:**

- Dark Matter is required for Era 5 builds (check `cost_dark_matter` in definitions)
- Used for special actions and late-game content
- Not tradeable (design choice to preserve rarity)

### Facility Production & Upkeep Calculations

**Production Calculation:**

```
Base Production = facility.definition.per_tick
Research Multipliers = product(1 + each_per_tick_prod_mul_from_research)
Effective Production = Base Production × Research Multipliers
```

**Example:**

- Facility produces: `{"tellerium": 10, "krypton": 5}`
- Research effects: `per_tick_prod_mul: 1.2`, `tellerium_per_tick_mul: 1.1`
- Effective production:
  - Tellerium: `10 × 1.2 × 1.1 = 13.2` per tick
  - Krypton: `5 × 1.2 = 6` per tick

**Upkeep Calculation:**

```
Base Upkeep = facility.definition.upkeep
Upkeep Reduction = sum(upkeep_reduction_from_research) (capped at 90%)
Effective Upkeep = Base Upkeep × (1 - Upkeep Reduction)
```

**Example:**

- Facility upkeep: `{"tellerium": 5, "krypton": 3}`
- Research effect: `upkeep_reduction: 0.05` (5% reduction)
- Effective upkeep:
  - Tellerium: `5 × (1 - 0.05) = 4.75` per tick
  - Krypton: `3 × (1 - 0.05) = 2.85` per tick

**Deactivation Logic:**

- Each tick, upkeep is deducted from planet's resource balance
- If planet's balance goes negative (insufficient resources), **all facilities on that planet** are deactivated
- Deactivated facilities don't produce resources
- Facilities can reactivate when resources become available again
- Use `GET /api/v1/facilities/preview` to show projected production/upkeep before building

**Frontend Display:**

- Show per-tick production for each facility
- Display upkeep costs clearly
- Calculate and show net production (production - upkeep)
- Show facility active/inactive status
- Warn if resources insufficient for upkeep
- Display production breakdown with applied multipliers

### Research Effects Stacking Rules

**Multiplier Stacking (Multiplicative):**
Multipliers stack multiplicatively:

```
final_multiplier = 1.0
foreach multiplier in research_effects:
    final_multiplier *= (1 + multiplier_value)
```

**Example:**

- Research 1: `per_tick_prod_mul: 0.10` (10% increase)
- Research 2: `per_tick_prod_mul: 0.20` (20% increase)
- Final multiplier: `1.0 × 1.10 × 1.20 = 1.32` (32% total increase)

**Flat Bonus Stacking (Additive):**
Flat bonuses stack additively:

```
final_bonus = 0
foreach bonus in research_effects:
    final_bonus += bonus_value
```

**Example:**

- Research 1: `ship_armor: 10`
- Research 2: `ship_armor: 25`
- Final bonus: `10 + 25 = 35` armor

**Boolean Effects:**

- Boolean effects (like `invasion_enabled`, `warp_enabled`) are set to `true` if any research provides it
- Once enabled, it stays enabled (can't be disabled)

**Effect Types Reference:**

- `per_tick_prod_mul`: Multiplies all facility production (multiplicative)
- `tellerium_per_tick_mul`: Multiplies tellerium production specifically (multiplicative)
- `krypton_per_tick_mul`: Multiplies krypton production specifically (multiplicative)
- `travel_ticks_mul`: Multiplies travel time (reduces it) - values < 1.0 mean faster travel (multiplicative)
- `upkeep_reduction`: Reduces upkeep costs (additive, capped at 90%)
- `ship_armor`: Flat armor bonus (additive)
- `ship_attack`: Percentage attack bonus (additive)
- `fleet_attack_bonus`: Fleet coordination bonus (additive)
- `shield_strength`: Flat shield bonus (additive)
- `detection_range`: Flat detection range bonus (additive)
- `colony_cap`: Additional colony capacity (additive)
- `invasion_enabled`: Boolean flag (enables invasion mechanics)
- `warp_enabled`: Boolean flag (enables warp travel)

### Prerequisite Validation Details

**Validation Order:**
When checking if an item can be built, the system validates in this order:

1. **Era Requirement**: `definition.era <= empire.active_era`
2. **Specialization Requirement**: `definition.specialization == 'general' OR in_array(definition.specialization, empire.specializations_unlocked)`
3. **Facility Prerequisites**: All facilities in `definition.prerequisites` (for facilities/ships) or `definition.prerequisite_facilities` (for research) must exist on the planet
4. **Research Prerequisites**: All research in `definition.prerequisite_research` must be completed (checked across all planets)
5. **Resource Availability**: Planet must have sufficient `tellerium_balance` and `krypton_balance` (and `dark_matter_current` for Era 5 items)

**Error Messages:**

- `"Era {X} required (current: {Y})"` - Era not high enough
- `"Specialization '{specialization}' required"` - Specialization not unlocked
- `"Facility '{slug}' required"` - Missing facility prerequisite
- `"Research '{slug}' required"` - Missing research prerequisite
- `"Insufficient tellerium (need {X}, have {Y})"` - Not enough resources

**Frontend Validation:**

- Use `POST /api/v1/prerequisites/check` to validate before showing build confirmation
- Display all missing prerequisites clearly
- Show which prerequisites are met (green checkmark) vs missing (red X)
- Group errors by type (era, specialization, facilities, research, resources)

### Build Queue Mechanics

**Build Queue Structure:**

- Each planet has its own build queue (stored in `construction_queue` table)
- Queue items have `ticks_remaining` that decrements each tick
- When `ticks_remaining` reaches 0, the item is completed
- Queue items are processed in order (FIFO - First In, First Out)

**Build Time Calculation:**

- Base build time: `definition.build_time_ticks` (integer ticks)
- Construction boosters can reduce build time (multiplier applied to decrement amount)
- Example: 1.5x booster means `ticks_remaining` decreases by 1.5 per tick (faster completion)
- Research multipliers can affect build time (if implemented in future)

**Queue Processing:**

- Each tick, `ticks_remaining` is decremented for all active queue items
- When `ticks_remaining <= 0`, the item is completed
- Completion triggers:
  - **Facilities**: Facility instance created, era progression checked
  - **Research**: Research added to `research_completed` array, effects applied
  - **Ships**: Fleet created with ships
  - **Defences**: Defence instance created

**Queue Limits:**

- Currently **no hard limits** on queue length
- Each planet can queue multiple items simultaneously
- Items are processed independently (multiple items can complete in same tick)

**Frontend Display Requirements:**

- Show build queue for each planet separately
- Display `ticks_remaining` with progress bar (0% to 100%)
- Show build time estimates (convert ticks to real time: `ticks * 30 seconds`)
- Allow canceling queued items (refund resources if implemented)
- Show what's being built and when it completes
- Display queue order (first item builds first)

### Tech Tree Visualization

**Data Structure:**
The `GET /api/v1/empire/tech-tree` endpoint returns:

- `empire`: Current era and unlocked specializations
- `facilities`: All facilities with unlock status and prerequisites
- `research`: All research with unlock status and prerequisites
- `ships`: All ships with unlock status and prerequisites
- `defences`: All defences with unlock status and prerequisites

**Each Item Includes:**

- `unlocked`: Boolean - Can see this item (era/specialization check passed)
- `can_build`: Boolean - Can build this item (all prerequisites met, resources available)
- `completed`: Boolean - Already built/researched (checked across all planets for facilities/research)
- `missing_prerequisites`: Array of error messages (if `can_build: false`)
- `type`: String - Item type ("facility", "research", "ship", "defence")
- All definition fields (era, specialization, costs, etc.)

**Frontend Visualization Requirements:**

1. **Organization:**
   - Group by era (1-5) - create era sections
   - Filter by specialization (general, industrial, military, relic)
   - Build dependency graph from prerequisites (connect items with lines/arrows)
   - Show prerequisite chains visually

2. **Color-Coding:**
   - **Green**: `unlocked: true` AND `can_build: true` (ready to build)
   - **Yellow**: `unlocked: true` AND `can_build: false` (missing prerequisites)
   - **Gray**: `unlocked: false` (locked by era/specialization)
   - **Blue**: `completed: true` (already built/researched)
   - **Orange**: `unlocked: true` AND `can_build: true` AND `completed: false` (can build again)

3. **Interaction:**
   - Click item to show details modal
   - Hover to show tooltip with prerequisites
   - Show missing prerequisites on click
   - Link to missing prerequisites (click to navigate to required item)
   - Filter/search by name, era, specialization

4. **Visual Indicators:**
   - Show era badge on each item
   - Display specialization icon (industrial 🏭, military ⚔️, relic 🔮)
   - Show prerequisite count (e.g., "Requires 2 facilities, 1 research")
   - Display costs and build time
   - Highlight newly unlocked items when specialization is selected

5. **Dependency Graph:**
   - Draw lines/arrows from prerequisites to dependent items
   - Show prerequisite tree (what unlocks what)
   - Highlight critical path items (must-have items for progression)
   - Show alternative paths (OR prerequisites)
