# Admin Portal API Integration Guide

This guide provides comprehensive documentation for integrating the enhanced admin features into the admin portal frontend.

## Table of Contents

1. [Authentication & Permissions](#authentication--permissions)
2. [Enhanced Battle Simulation System](#enhanced-battle-simulation-system)
3. [Tick Testing System](#tick-testing-system)
4. [Game Definitions Management](#game-definitions-management)
5. [Error Handling](#error-handling)
6. [UI/UX Recommendations](#uiux-recommendations)

---

## Authentication & Permissions

All admin endpoints require:

-   **Authentication**: Valid Sanctum token in `Authorization: Bearer {token}` header
-   **Authorization**: User must have appropriate admin permissions

### Required Permissions

| Feature              | Permission                |
| -------------------- | ------------------------- |
| Battle Simulations   | `simulate_combats`        |
| Tick Testing         | `run_tick_tests`          |
| Game Definitions     | `manage_game_definitions` |
| Rollback Definitions | `rollback_definitions`    |

### Permission Check Endpoint

```javascript
// Check if user has permission
const hasPermission = (permission) => {
    return user?.permissions?.includes(permission);
};

// Example usage
if (!hasPermission("simulate_combats")) {
    // Hide/disable battle simulation features
}
```

---

## Enhanced Battle Simulation System

### 1. Single Combat Simulation

**Endpoint:** `POST /api/v1/admin/combats/simulate`

**Description:** Simulate a single combat scenario with enhanced options.

**Request Body:**

```json
{
    "fleet_id": 123, // Optional: Existing fleet ID
    "planet_id": 456, // Optional: Existing planet ID
    "custom_fleet_ships": {
        // Optional: Custom fleet composition
        "scout_fighter": 10,
        "assault_fighter": 5,
        "patrol_corvette": 3
    },
    "custom_planet_defences": [
        // Optional: Custom defences
        {
            "defence_slug": "ion_cannon",
            "quantity": 5
        },
        {
            "defence_slug": "missile_battery",
            "quantity": 3
        }
    ],
    "tick_number": 5000, // Optional: Specific tick (defaults to current)
    "override_seed": "custom_seed_123", // Optional: Override RNG seed
    "detailed_logs": true // Optional: Get round-by-round logs
}
```

**Response (Success):**

```json
{
  "message": "Combat simulated successfully",
  "simulation": {
    "winner_empire_id": 1,
    "ships_lost": {
      "1": {
        "scout_fighter": 3,
        "assault_fighter": 1
      },
      "2": {}
    },
    "defences_destroyed": [
      {
        "defence_slug": "ion_cannon",
        "quantity": 2
      }
    ],
    "seed": 1234567890,
    "battle_id": "battle_5000_123_456",
    "final_participants": [
      {
        "empire_id": 1,
        "type": "fleet",
        "ships": {
          "scout_fighter": 7,
          "assault_fighter": 4
        }
      },
      {
        "empire_id": 2,
        "type": "planet",
        "defences": [
          {
            "defence_slug": "ion_cannon",
            "quantity": 3
          }
        ]
      }
    ],
    "round_logs": [                    // Only if detailed_logs: true
      {
        "round": 1,
        "participants_before": [...],
        "actions": [
          {
            "attacker": {
              "empire_id": 1,
              "type": "fleet",
              "ships": {...}
            },
            "target": {
              "empire_id": 2,
              "type": "planet",
              "defences": [...]
            },
            "damage_dealt": 150
          }
        ],
        "participants_after": [...]
      }
    ]
  }
}
```

**Response (Error):**

```json
{
    "status": "error",
    "code": "COMBAT_FAILED",
    "message": "Not enough participants for combat"
}
```

**Frontend Example:**

```javascript
async function simulateCombat(params) {
    const response = await fetch("/api/v1/admin/combats/simulate", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            fleet_id: params.fleetId,
            planet_id: params.planetId,
            detailed_logs: params.detailedLogs || false,
            override_seed: params.seed || null,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
    }

    return await response.json();
}

// Usage
try {
    const result = await simulateCombat({
        fleetId: 123,
        planetId: 456,
        detailedLogs: true,
    });

    console.log("Winner:", result.simulation.winner_empire_id);
    console.log("Rounds:", result.simulation.round_logs?.length || 0);
} catch (error) {
    console.error("Simulation failed:", error.message);
}
```

---

### 2. Batch Combat Simulation

**Endpoint:** `POST /api/v1/admin/combats/simulate/batch`

**Description:** Run multiple combat scenarios in one request for comparison.

**Request Body:**

```json
{
    "scenarios": [
        {
            "name": "Small Fleet vs Light Defences",
            "fleet_id": 123,
            "planet_id": 456,
            "tick_number": 5000,
            "detailed_logs": false
        },
        {
            "name": "Large Fleet vs Heavy Defences",
            "custom_fleet_ships": {
                "battle_cruiser": 5,
                "fleet_carrier": 2
            },
            "custom_planet_defences": [
                {
                    "defence_slug": "plasma_cannon",
                    "quantity": 10
                }
            ],
            "tick_number": 5000,
            "override_seed": "batch_test_1"
        }
    ],
    "compare_results": true // Optional: Generate comparison report
}
```

**Response:**

```json
{
  "message": "Batch simulations completed",
  "results": {
    "total_scenarios": 2,
    "successful": 2,
    "failed": 0,
    "results": [
      {
        "scenario_index": 0,
        "scenario_name": "Small Fleet vs Light Defences",
        "success": true,
        "result": {
          "winner_empire_id": 1,
          "ships_lost": {...},
          "seed": 1234567890
        }
      },
      {
        "scenario_index": 1,
        "scenario_name": "Large Fleet vs Heavy Defences",
        "success": true,
        "result": {
          "winner_empire_id": 2,
          "ships_lost": {...},
          "seed": 9876543210
        }
      }
    ],
    "comparison": {                    // Only if compare_results: true
      "total_simulations": 2,
      "winner_distribution": {
        "1": 1,
        "2": 1
      },
      "average_ships_lost": {
        "1": {
          "scout_fighter": 2.5,
          "assault_fighter": 1.0
        }
      }
    }
  }
}
```

**Frontend Example:**

```javascript
async function batchSimulate(scenarios, compareResults = false) {
    const response = await fetch("/api/v1/admin/combats/simulate/batch", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            scenarios: scenarios.map((s) => ({
                name: s.name,
                fleet_id: s.fleetId || null,
                planet_id: s.planetId || null,
                custom_fleet_ships: s.customFleet || null,
                custom_planet_defences: s.customDefences || null,
                tick_number: s.tickNumber || null,
                override_seed: s.seed || null,
                detailed_logs: s.detailedLogs || false,
            })),
            compare_results: compareResults,
        }),
    });

    return await response.json();
}
```

---

### 3. Test Fleet Against Defences

**Endpoint:** `POST /api/v1/admin/combats/simulate/test-fleet`

**Description:** Test a specific fleet composition against multiple defence configurations.

**Request Body:**

```json
{
    "fleet_ships": {
        "scout_fighter": 20,
        "assault_fighter": 10,
        "patrol_corvette": 5
    },
    "fleet_empire_id": 1,
    "defence_configs": [
        {
            "name": "Light Defences",
            "defences": [
                {
                    "defence_slug": "ion_cannon",
                    "quantity": 3
                }
            ],
            "empire_id": 2
        },
        {
            "name": "Heavy Defences",
            "defences": [
                {
                    "defence_slug": "plasma_cannon",
                    "quantity": 10
                },
                {
                    "defence_slug": "missile_battery",
                    "quantity": 5
                }
            ],
            "empire_id": 2,
            "override_seed": "test_seed_1"
        }
    ]
}
```

**Response:**

```json
{
  "message": "Fleet testing completed",
  "results": {
    "fleet_composition": {
      "scout_fighter": 20,
      "assault_fighter": 10,
      "patrol_corvette": 5
    },
    "tests_run": 2,
    "fleet_wins": 1,
    "fleet_losses": 1,
    "win_rate_percent": 50.0,
    "results": [
      {
        "defence_config": "Light Defences",
        "defences": [...],
        "winner_empire_id": 1,
        "fleet_won": true,
        "ships_lost": {
          "1": {
            "scout_fighter": 5
          }
        },
        "defences_destroyed": [...]
      },
      {
        "defence_config": "Heavy Defences",
        "winner_empire_id": 2,
        "fleet_won": false,
        "ships_lost": {
          "1": {
            "scout_fighter": 20,
            "assault_fighter": 10
          }
        }
      }
    ]
  }
}
```

**Frontend UI Recommendation:**

-   Display win rate as a percentage bar
-   Show results in a table with expandable rows for detailed ship losses
-   Highlight winning scenarios
-   Provide export functionality for results

---

### 4. Test Defence Against Fleets

**Endpoint:** `POST /api/v1/admin/combats/simulate/test-defence`

**Description:** Test a specific defence configuration against multiple fleet compositions.

**Request Body:**

```json
{
    "defences": [
        {
            "defence_slug": "plasma_cannon",
            "quantity": 8
        },
        {
            "defence_slug": "missile_battery",
            "quantity": 4
        }
    ],
    "planet_empire_id": 2,
    "fleet_configs": [
        {
            "name": "Light Attack Fleet",
            "ships": {
                "scout_fighter": 10,
                "assault_fighter": 5
            },
            "empire_id": 1
        },
        {
            "name": "Heavy Attack Fleet",
            "ships": {
                "battle_cruiser": 5,
                "fleet_carrier": 2
            },
            "empire_id": 1,
            "override_seed": "test_seed_2"
        }
    ]
}
```

**Response:** Similar structure to test-fleet, but with `defence_wins`/`defence_losses` instead of `fleet_wins`/`fleet_losses`.

---

## Tick Testing System

### 1. Dry-Run Tick Processing

**Endpoint:** `POST /api/v1/admin/tick/dry-run`

**Description:** Process a tick without persisting changes. Shows what would happen.

**Request Body:**

```json
{
    "force_recalc": false, // Optional: Force recalculation even if already processed
    "detailed_diff": true // Optional: Show before/after diff of all changes
}
```

**Response:**

```json
{
    "message": "Dry-run tick completed",
    "results": {
        "dry_run": true,
        "stats": {
            "tick_number": 3223,
            "planets_processed": 150,
            "production_applied": 150,
            "facilities_completed": 5,
            "research_completed": 2,
            "fleets_arrived": 12,
            "combats_resolved": 3,
            "ai_actions_generated": 45,
            "ai_actions_executed": 42,
            "ai_actions_failed": 3,
            "duration_seconds": 8.5
        },
        "diff": {
            // Only if detailed_diff: true
            "planets": {
                "44": {
                    "tellerium_balance": {
                        "before": 15000,
                        "after": 17500,
                        "change": 2500
                    },
                    "krypton_balance": {
                        "before": 12000,
                        "after": 13500,
                        "change": 1500
                    }
                }
            },
            "empires": {
                "6": {
                    "score": {
                        "before": 125000,
                        "after": 128500,
                        "change": 3500
                    }
                }
            },
            "construction_queues": {
                "71434": {
                    "ticks_remaining": {
                        "before": 5.0,
                        "after": 3.5,
                        "change": -1.5
                    }
                }
            }
        },
        "warning": "Due to TickProcessor using internal transactions, some database changes may persist. Only the TickLog entry is removed."
    }
}
```

**Frontend UI Recommendation:**

-   Display stats in a dashboard-style card layout
-   Show diff in an expandable accordion
-   Use color coding: green for increases, red for decreases
-   Highlight significant changes
-   Show a warning banner about transaction limitations

**Frontend Example:**

```javascript
async function dryRunTick(detailedDiff = false) {
    const response = await fetch("/api/v1/admin/tick/dry-run", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            force_recalc: false,
            detailed_diff: detailedDiff,
        }),
    });

    const result = await response.json();

    if (result.results.warning) {
        // Display warning banner
        showWarning(result.results.warning);
    }

    return result;
}
```

---

### 2. Sandbox Tick Processing

**Endpoint:** `POST /api/v1/admin/tick/sandbox`

**Description:** Process multiple ticks in isolation for testing.

**Request Body:**

```json
{
    "ticks_to_process": 3, // Required: 1-10
    "reset_before": false, // Optional: Reset sandbox state before processing
    "initial_state": null // Optional: Override initial state
}
```

**Response:**

```json
{
  "message": "Sandbox tick processing completed",
  "results": {
    "sandbox": true,
    "ticks_processed": 3,
    "stats": [
      {
        "tick_number": 3223,
        "planets_processed": 150,
        "facilities_completed": 5,
        "duration_seconds": 8.5
      },
      {
        "tick_number": 3224,
        "planets_processed": 150,
        "facilities_completed": 2,
        "duration_seconds": 7.2
      },
      {
        "tick_number": 3225,
        "planets_processed": 150,
        "facilities_completed": 8,
        "duration_seconds": 9.1
      }
    ],
    "final_state": {
      "planets": {...},
      "empires": {...},
      "fleets": {...},
      "construction_queues": {...}
    },
    "warning": "Due to TickProcessor using internal transactions, some database changes may persist. Only TickLog entries are removed."
  }
}
```

**Frontend UI Recommendation:**

-   Show progress indicator for multiple ticks
-   Display each tick's stats in a timeline view
-   Allow export of final state
-   Provide comparison with initial state

---

### 3. Compare Tick Results

**Endpoint:** `POST /api/v1/admin/tick/compare`

**Description:** Compare results from different tick runs (placeholder for future enhancement).

**Status:** Currently returns a placeholder message. Implementation coming soon.

---

## Game Definitions Management

### Overview

Game definitions include:

-   **Facilities** (`facilities`)
-   **Ships** (`ships`) - _Note: CRUD endpoints follow same pattern as facilities_
-   **Defences** (`defences`) - _Note: CRUD endpoints follow same pattern as facilities_
-   **Research** (`research`) - _Note: CRUD endpoints follow same pattern as facilities_

All definition types support versioning, rollback, and impact analysis.

---

### 1. List Facilities

**Endpoint:** `GET /api/v1/admin/definitions/facilities`

**Query Parameters:**

-   `page` (default: 1)
-   `per_page` (default: 25, max: 100)

**Response:**

```json
{
    "data": [
        {
            "id": 1,
            "slug": "mines",
            "name": "Mines",
            "era": 1,
            "base_tellerium_cost": 1000,
            "base_krypton_cost": 500,
            "build_time_ticks": 2,
            "prerequisites": [],
            "description": "Extracts Tellerium from the planet surface.",
            "created_at": "2025-01-01T00:00:00.000000Z",
            "updated_at": "2025-01-01T00:00:00.000000Z"
        }
    ],
    "meta": {
        "page": 1,
        "per_page": 25,
        "total": 50,
        "pages": 2
    }
}
```

---

### 2. Get Facility

**Endpoint:** `GET /api/v1/admin/definitions/facilities/{id}`

**Response:**

```json
{
    "data": {
        "id": 1,
        "slug": "mines",
        "name": "Mines",
        "era": 1,
        "base_tellerium_cost": 1000,
        "base_krypton_cost": 500,
        "build_time_ticks": 2,
        "prerequisites": [],
        "description": "Extracts Tellerium from the planet surface."
    }
}
```

---

### 3. Create Facility

**Endpoint:** `POST /api/v1/admin/definitions/facilities`

**Request Body:**

```json
{
    "slug": "advanced_extractor",
    "name": "Advanced Extraction Facility",
    "era": 2,
    "base_tellerium_cost": 10000,
    "base_krypton_cost": 8000,
    "build_time_ticks": 5,
    "prerequisites": ["refinery", "research_lab"],
    "description": "Automated deep-core mining technology."
}
```

**Response (Success):**

```json
{
    "message": "Facility created successfully",
    "data": {
        "id": 51,
        "slug": "advanced_extractor",
        "name": "Advanced Extraction Facility",
        "era": 2,
        "base_tellerium_cost": 10000,
        "base_krypton_cost": 8000,
        "build_time_ticks": 5,
        "prerequisites": ["refinery", "research_lab"],
        "description": "Automated deep-core mining technology."
    }
}
```

**Validation Errors:**

```json
{
    "status": "error",
    "code": "VALIDATION_ERROR",
    "message": "Definition validation failed",
    "errors": [
        "Prerequisite facility 'invalid_facility' does not exist",
        "base_tellerium_cost must be a non-negative number"
    ]
}
```

**Frontend Form Validation:**

```javascript
const facilitySchema = {
    slug: {
        required: true,
        pattern: /^[a-z0-9_]+$/,
        message:
            "Slug must contain only lowercase letters, numbers, and underscores",
    },
    name: { required: true, maxLength: 255 },
    era: { required: true, min: 1, max: 10, type: "number" },
    base_tellerium_cost: {
        required: true,
        min: 0,
        max: 999999999,
        type: "number",
    },
    base_krypton_cost: {
        required: true,
        min: 0,
        max: 999999999,
        type: "number",
    },
    build_time_ticks: { required: true, min: 1, max: 1000, type: "number" },
    prerequisites: { type: "array", items: "string" },
    description: { maxLength: 1000 },
};
```

---

### 4. Update Facility

**Endpoint:** `PATCH /api/v1/admin/definitions/facilities/{id}`

**Request Body:** (All fields optional - only include fields to update)

```json
{
    "name": "Improved Advanced Extraction Facility",
    "base_tellerium_cost": 9500,
    "change_reason": "Balance adjustment based on player feedback"
}
```

**Response:**

```json
{
  "message": "Facility updated successfully",
  "data": {
    "id": 1,
    "slug": "advanced_extractor",
    "name": "Improved Advanced Extraction Facility",
    "base_tellerium_cost": 9500,
    ...
  },
  "warnings": [
    "This facility is in 15 active construction queue(s)",
    "This facility exists on 8 planet(s)"
  ]
}
```

**Important:** Always check for warnings - they indicate the definition is actively being used in-game.

---

### 5. Delete Facility

**Endpoint:** `DELETE /api/v1/admin/definitions/facilities/{id}`

**Response (Success):**

```json
{
    "message": "Facility deleted successfully"
}
```

**Response (Error - In Use):**

```json
{
    "status": "error",
    "code": "IN_USE",
    "message": "Cannot delete facility that is in use",
    "warnings": [
        "This facility is in 15 active construction queue(s)",
        "This facility exists on 8 planet(s)"
    ]
}
```

**Frontend Recommendation:**

-   Show a confirmation dialog with usage warnings
-   Disable delete button if warnings exist, or show a "Force Delete" option with clear warning

---

### 6. Impact Analysis

**Endpoint:** `POST /api/v1/admin/definitions/{type}/{id}/impact-analysis`

**Request Body:**

```json
{
    "proposed_changes": {
        "build_time_ticks": 6,
        "base_tellerium_cost": 12000
    }
}
```

**Response:**

```json
{
    "analysis": {
        "definition_type": "facilities",
        "definition_id": 1,
        "definition_slug": "advanced_extractor",
        "proposed_changes": {
            "build_time_ticks": 6,
            "base_tellerium_cost": 12000
        },
        "current_usage": [
            "This facility is in 15 active construction queue(s)",
            "This facility exists on 8 planet(s)"
        ],
        "impact": {
            "build_time_change": {
                "active_queues_affected": 15,
                "note": "Changing build time will not affect queues already in progress"
            },
            "cost_change": {
                "note": "Cost changes will not affect existing construction queues or completed items"
            }
        }
    }
}
```

**Frontend UI Recommendation:**

-   Show impact analysis before confirming update
-   Display in a modal or expandable section
-   Highlight potentially breaking changes
-   Provide "Continue" and "Cancel" buttons

---

### 7. Version History

**Endpoint:** `GET /api/v1/admin/definitions/{type}/{id}/history`

**Response:**

```json
{
    "history": [
        {
            "version_number": 3,
            "changed_by": {
                "id": 6,
                "username": "admin_user"
            },
            "changed_at": "2025-11-02T16:30:00.000000Z",
            "change_reason": "Balance adjustment",
            "rollback_count": 0
        },
        {
            "version_number": 2,
            "changed_by": {
                "id": 6,
                "username": "admin_user"
            },
            "changed_at": "2025-11-01T10:15:00.000000Z",
            "change_reason": "Initial creation",
            "rollback_count": 1
        },
        {
            "version_number": 1,
            "changed_by": {
                "id": 6,
                "username": "admin_user"
            },
            "changed_at": "2025-11-01T09:00:00.000000Z",
            "change_reason": null,
            "rollback_count": 0
        }
    ]
}
```

**Frontend UI Recommendation:**

-   Display as a timeline or version list
-   Show most recent version first
-   Highlight versions that have been rolled back
-   Allow clicking to view version details

---

### 8. Compare Versions

**Endpoint:** `POST /api/v1/admin/definitions/{type}/{id}/compare`

**Request Body:**

```json
{
    "version1": 2,
    "version2": 3
}
```

**Response:**

```json
{
    "comparison": {
        "version_1": {
            "version_number": 2,
            "changed_at": "2025-11-01T10:15:00.000000Z",
            "changed_by": "admin_user"
        },
        "version_2": {
            "version_number": 3,
            "changed_at": "2025-11-02T16:30:00.000000Z",
            "changed_by": "admin_user"
        },
        "differences": {
            "name": {
                "version_2": "Advanced Extraction Facility",
                "version_3": "Improved Advanced Extraction Facility"
            },
            "base_tellerium_cost": {
                "version_2": 10000,
                "version_3": 9500
            }
        }
    }
}
```

**Frontend UI Recommendation:**

-   Display in a side-by-side comparison view
-   Highlight changed fields
-   Show diff-style formatting (green for additions, red for removals)
-   Allow selecting versions from dropdowns

---

### 9. Rollback to Version

**Endpoint:** `POST /api/v1/admin/definitions/{type}/{id}/rollback`

**Request Body:**

```json
{
    "version_number": 2,
    "reason": "Reverting balance changes - caused player complaints"
}
```

**Response:**

```json
{
    "message": "Definition rolled back successfully"
}
```

**Important:** Rolling back creates a new version with the old state, preserving history.

**Frontend UI Recommendation:**

-   Show confirmation dialog with version details
-   Require reason input
-   Display warning about creating a new version
-   Show success notification

**Frontend Example:**

```javascript
async function rollbackDefinition(type, id, versionNumber, reason) {
    const response = await fetch(
        `/api/v1/admin/definitions/${type}/${id}/rollback`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version_number: versionNumber,
                reason: reason,
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
    }

    return await response.json();
}
```

---

## Error Handling

### Standard Error Response Format

All endpoints return errors in this format:

```json
{
    "status": "error",
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
        // Optional: Validation errors
        "field_name": ["Error message"]
    },
    "trace": "..." // Only in debug mode
}
```

### Common Error Codes

| Code               | Meaning                   | Action                                              |
| ------------------ | ------------------------- | --------------------------------------------------- |
| `FORBIDDEN`        | Insufficient permissions  | Check user permissions, show access denied message  |
| `VALIDATION_ERROR` | Request validation failed | Display field-specific errors to user               |
| `NOT_FOUND`        | Resource not found        | Show "not found" message, redirect if appropriate   |
| `COMBAT_FAILED`    | Combat simulation failed  | Show error, allow retry                             |
| `IN_USE`           | Resource is in use        | Show warnings, prevent action or allow force delete |
| `ROLLBACK_FAILED`  | Rollback operation failed | Show error, allow retry                             |

### Frontend Error Handling Pattern

```javascript
async function handleApiCall(apiCall) {
    try {
        const response = await apiCall();

        if (!response.ok) {
            const error = await response.json();

            switch (error.code) {
                case "FORBIDDEN":
                    showError(
                        "You do not have permission to perform this action"
                    );
                    break;
                case "VALIDATION_ERROR":
                    showValidationErrors(error.details);
                    break;
                case "IN_USE":
                    showWarningDialog(error.warnings, () => {
                        // Allow force action if user confirms
                    });
                    break;
                default:
                    showError(error.message || "An error occurred");
            }

            throw error;
        }

        return await response.json();
    } catch (error) {
        console.error("API call failed:", error);
        throw error;
    }
}
```

---

## UI/UX Recommendations

### 1. Battle Simulation Interface

**Recommended Layout:**

```
┌─────────────────────────────────────────┐
│  Battle Simulator                       │
├─────────────────────────────────────────┤
│  [Simulation Mode]                      │
│  ○ Single  ○ Batch  ○ Test Fleet        │
│                                         │
│  [Configuration]                        │
│  Fleet: [Select] [Custom]                │
│  Planet: [Select] [Custom]              │
│  Options:                               │
│  ☑ Detailed Logs                        │
│  ☐ Override Seed: [____]                │
│                                         │
│  [Actions]                              │
│  [Run Simulation] [Clear]               │
└─────────────────────────────────────────┘
```

**Features:**

-   Tabbed interface for different simulation modes
-   Fleet/Planet selector with "Custom" option
-   Real-time results display
-   Export results as JSON/CSV
-   Save simulation presets

### 2. Tick Testing Interface

**Recommended Layout:**

```
┌─────────────────────────────────────────┐
│  Tick Testing                           │
├─────────────────────────────────────────┤
│  Mode: ○ Dry-Run  ○ Sandbox            │
│                                         │
│  Options:                               │
│  ☐ Force Recalc                        │
│  ☑ Detailed Diff                       │
│                                         │
│  Sandbox:                               │
│  Ticks to Process: [3] (1-10)           │
│  ☐ Reset Before Processing              │
│                                         │
│  [Run Test]                             │
│                                         │
│  [Results Panel]                        │
│  ┌─────────────────────────────────┐  │
│  │ Tick #3223                       │  │
│  │ Duration: 8.5s                   │  │
│  │ Planets: 150 | Facilities: 5    │  │
│  │ [View Diff]                      │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Features:**

-   Warning banner about transaction limitations
-   Progress indicator for multiple ticks
-   Expandable diff view with color coding
-   Comparison charts for multiple runs

### 3. Game Definitions Interface

**Recommended Layout:**

```
┌─────────────────────────────────────────┐
│  Game Definitions                       │
├─────────────────────────────────────────┤
│  [Tabs: Facilities | Ships | Defences | │
│   Research]                             │
│                                         │
│  [List View]                            │
│  ┌─────────────────────────────────┐  │
│  │ Name          Era  Cost    [Actions]│
│  ├─────────────────────────────────┤  │
│  │ Mines         1    1,500   [Edit] │  │
│  │ Probes        1    1,800   [Edit] │  │
│  │ ...                                │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Edit Form - Side Panel]               │
│  ┌─────────────────────────────────┐  │
│  │ Edit Facility                    │  │
│  │                                  │  │
│  │ Slug: [advanced_extractor]       │  │
│  │ Name: [Advanced Extractor]       │  │
│  │ ...                              │  │
│  │                                  │  │
│  │ [Impact Analysis]                │  │
│  │ ⚠️ 15 active queues              │  │
│  │                                  │  │
│  │ [Save] [Cancel] [View History]   │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Features:**

-   Tabbed interface for definition types
-   Search/filter functionality
-   Inline editing with validation
-   Version history sidebar
-   Impact analysis modal
-   Bulk operations support

### 4. Version History Interface

**Recommended Layout:**

```
┌─────────────────────────────────────────┐
│  Version History                        │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐  │
│  │ v3 - Admin User                  │  │
│  │ Nov 2, 2025 4:30 PM             │  │
│  │ "Balance adjustment"            │  │
│  │ [View] [Compare] [Rollback]     │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │ v2 - Admin User                  │  │
│  │ Nov 1, 2025 10:15 AM            │  │
│  │ "Initial creation"              │  │
│  │ [Rolled back once]               │  │
│  │ [View] [Compare]                │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │ v1 - Admin User                  │  │
│  │ Nov 1, 2025 9:00 AM             │  │
│  │ (No reason)                      │  │
│  │ [View] [Compare]                │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Features:**

-   Timeline view with visual indicators
-   Version comparison tool
-   One-click rollback with confirmation
-   Show rollback count badges
-   Filter by date/user

---

## Best Practices

### 1. Loading States

Always show loading indicators for async operations:

```javascript
const [loading, setLoading] = useState(false);

async function simulateCombat() {
    setLoading(true);
    try {
        const result = await api.simulateCombat(params);
        // Handle result
    } finally {
        setLoading(false);
    }
}
```

### 2. Optimistic Updates

For non-critical operations, consider optimistic updates:

```javascript
// Optimistically update UI
const optimisticDefinition = { ...definition, ...updates };
setDefinition(optimisticDefinition);

try {
    await api.updateDefinition(id, updates);
} catch (error) {
    // Revert on error
    setDefinition(definition);
    showError(error.message);
}
```

### 3. Form Validation

Validate on both client and server:

```javascript
// Client-side validation
const errors = validateForm(formData);
if (errors.length > 0) {
    setFormErrors(errors);
    return;
}

// Server validation will catch anything missed
try {
    await api.createDefinition(formData);
} catch (error) {
    if (error.code === "VALIDATION_ERROR") {
        setFormErrors(error.details);
    }
}
```

### 4. Permission Gating

Hide/disable features based on permissions:

```javascript
{
    hasPermission("manage_game_definitions") && (
        <button onClick={handleCreate}>Create Definition</button>
    );
}
```

### 5. Error Recovery

Provide retry mechanisms for transient errors:

```javascript
async function retryOperation(operation, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await delay(1000 * (i + 1)); // Exponential backoff
        }
    }
}
```

---

## Additional Resources

### API Base URL

-   **Development**: `http://localhost:8000/api/v1`
-   **Staging**: `https://staging-api.astralus.online/api/v1`
-   **Production**: `https://api.astralus.online/api/v1`

### Rate Limiting

Admin endpoints may have rate limiting. Implement exponential backoff for retries.

### WebSocket Events

For real-time updates, consider subscribing to relevant channels:

-   `private-empire.{empire_id}` - Empire updates
-   `private-user.{user_id}` - User-specific notifications

---

## Support

For questions or issues:

1. Check this documentation first
2. Review API responses for error details
3. Check server logs (if accessible)
4. Contact backend team with:
    - Endpoint and method
    - Request payload
    - Response body
    - Timestamp

---

**Last Updated:** November 2, 2025
**Version:** 1.0.0

---

## Additional Resources

### Quick Reference Guide

See `ADMIN_PORTAL_QUICK_REFERENCE.md` for:

-   TypeScript type definitions
-   React component examples
-   Common UI patterns
-   CSS class recommendations
-   Testing checklist

### Related Documentation

-   `ADMIN_PANEL_API_GUIDE.md` - General admin panel API documentation
-   `PREMIUM_CURRENCY_API.md` - Quantum Credits and Boosters API
