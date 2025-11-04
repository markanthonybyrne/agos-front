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

**Production Flow:**

1. Each tick, facilities on a planet produce resources via `per_tick`
2. Research multipliers applied multiplicatively
3. Resources added to planet's balance
4. Upkeep costs deducted from planet's balance
5. If resources go negative, facilities deactivate

**Upkeep Flow:**

1. Each tick, upkeep costs deducted
2. Research `upkeep_reduction` applied (reduces upkeep)
3. If insufficient resources, facilities deactivate
4. Facilities can reactivate when resources available

**Frontend Display:**

- Show per-tick production for each facility
- Show upkeep costs
- Display facility active/inactive status
- Warn if resources insufficient for upkeep

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

**Production:**

- Produced by facilities with `dark_matter` in `per_tick`
- Examples: `singularity_reactor` produces 50 per tick
- Aggregated to empire-level (not per-planet)

**Capacity:**

- Starts at 0
- Increased by facilities (e.g., `storage_depot` might increase capacity)
- Overflow discarded (logged)

**Usage:**

- Required for Era 5 builds
- Used in special actions
- Not tradeable (design choice)

**Frontend Display:**

- Show current dark matter and capacity
- Display production rate
- Show breakdown by planet
- Warn if approaching capacity

---

## API Endpoints Reference

### New Endpoints

> **Note**: Some endpoints below are described for completeness but may not be fully implemented yet. Check the actual API to confirm availability. Endpoints marked with ✅ are confirmed implemented.

#### 1. Get Tech Tree Data ⚠️ (Planned)

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

#### 2. Get Empire State ⚠️ (Planned)

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

#### 3. Select Specialization ⚠️ (Planned)

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

#### 4. Get Available Facilities ⚠️ (Planned - Use definitions endpoint instead)

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

#### 5. Get Available Research ⚠️ (Planned - Use definitions endpoint instead)

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

#### 6. Get Available Ships ⚠️ (Planned)

```
GET /api/ships/available?era=3&specialization=military
```

**Description**: List ships filtered by era/specialization with prerequisites check.

**Authentication**: Optional

**Query Parameters**: Same as facilities endpoint

**Response**: Similar structure to facilities/research endpoints

#### 7. Get Available Defences ⚠️ (Planned)

```
GET /api/defences/available?era=3&specialization=military
```

**Description**: List defences filtered by era/specialization.

**Authentication**: Optional

**Response**: Similar structure to other endpoints

#### 8. Check Prerequisites ⚠️ (Planned)

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

#### 9. Get Research Effects Summary ⚠️ (Planned)

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

#### 10. Preview Facility Effects ⚠️ (Planned)

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

#### 11. Get Era Progression Status ⚠️ (Planned)

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

#### 12. Get Dark Matter Info ⚠️ (Planned)

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

#### 3. Get Ship Definitions ⚠️

```
GET /api/ships/definitions?era=3&specialization=military
```

**Changes**:

- Added query parameters: `era`, `specialization`
- Returns new fields: `specialization`, `notes`

#### 4. Get Defence Definitions ⚠️

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

### ✅ Fully Implemented

- Facility definitions with filtering by era/specialization
- Research definitions with filtering by era/specialization
- Empire details with era, specializations, dark matter, research effects
- Enhanced prerequisite validation in build endpoints
- Resource production service with facility per_tick/upkeep
- Research effects application on completion
- Specialization service logic
- Era progression tracking

### ⚠️ Planned / Partially Implemented

The following endpoints are described in this guide but may need additional implementation:

- Tech tree visualization endpoint
- Specialization selection endpoint
- Era progression status endpoint
- Dark matter info endpoint
- Research effects summary endpoint
- Facility preview endpoint
- Prerequisite check endpoint
- Available ships/defences endpoints with filtering

**Note**: Core functionality is implemented. The missing endpoints can be added to controllers as needed. The backend logic (services, models, validation) is complete and ready to support these endpoints.

## Current Workarounds

For endpoints marked as ⚠️ (Planned), you can:

1. **Tech Tree Data**: Combine multiple calls:
   - `GET /api/facilities/definitions` (filtered by era/specialization)
   - `GET /api/research/definitions` (filtered by era/specialization)
   - `GET /api/empires/{id}` (for empire state)
   - Check prerequisites client-side using the data structures

2. **Empire State**: Use `GET /api/empires/{id}` which now includes all new fields

3. **Specialization Selection**: Use `POST /api/empires/my/description` pattern or create custom endpoint

4. **Research Effects**: Extract from `active_research_effects` field in empire response

5. **Prerequisites Check**: Validate client-side using definition data and empire state
