## Tech Tree Persistence Requirements

This document defines the backend support the frontend needs to persist a player's tech-planning workflows and advisor insights in the redesigned encyclopaedia view.

---

### 1. Tech Plans

**Purpose**
- Retain a player's curated research/build plan across sessions and devices.
- Enable syncing between multiple browser tabs and future native clients.

**Data Model**
- `id` (UUID, generated server-side)
- `player_id` (UUID; implicit via auth token, but persisted for auditing)
- `name` (string, 2–60 chars)
- `node_ids` (ordered array of `tech_node_id` strings, e.g. `facility-basic_shipyard`)
- `notes` (optional string, up to 2048 chars)
- `created_at`, `updated_at` (ISO 8601)
- `metadata` (optional JSON for future tagging, e.g. `{ "focus": "naval", "minEra": 2 }`)

**REST Endpoints**
| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/tech-plans` | List plans for authenticated player. |
| `POST` | `/api/v1/tech-plans` | Create new plan. |
| `PUT` | `/api/v1/tech-plans/{id}` | Update name, notes, node order. |
| `PATCH` | `/api/v1/tech-plans/{id}/nodes` | Optional helper to reorder/add/remove nodes. |
| `DELETE` | `/api/v1/tech-plans/{id}` | Remove plan. |

**Example Payloads**
```json
// POST /api/v1/tech-plans
{
  "name": "Industrial Ramp",
  "node_ids": [
    "research-mining_foundations",
    "facility-mining_station",
    "facility-ore_refinery"
  ],
  "notes": "Rush production, then pivot to military tier 2."
}
```

```json
// GET /api/v1/tech-plans response
{
  "plans": [
    {
      "id": "1b2c5e56-0215-4cf3-8d4f-4f1725f7e2e1",
      "name": "Industrial Ramp",
      "node_ids": [
        "research-mining_foundations",
        "facility-mining_station",
        "facility-ore_refinery"
      ],
      "notes": "Rush production, then pivot to military tier 2.",
      "metadata": { "focus": "industrial" },
      "created_at": "2025-11-01T18:44:22Z",
      "updated_at": "2025-11-05T03:12:19Z"
    }
  ]
}
```

**WebSocket Events**
- `tech-plan.created`, `tech-plan.updated`, `tech-plan.deleted`
  - Payload includes the full plan record.
  - Allows hot reload without polling (frontend will merge into Redux state).

---

### 2. Advisor Suggestions

**Purpose**
- Persist the dynamic advisor context so players resume strategy guidance seamlessly.
- Track dismissals and priorities to personalise recommendations.

**Data Model**
- `player_id`
- `current_focus_node_id` (nullable string; last node that populated the advisor)
- `dismissed_suggestions` (array of `{ node_id, advisor_id?, dismissed_at }`)
- `pinned_suggestions` (optional array for future “starred” advice)
- `updated_at`

Advisor suggestions themselves can be derived server-side each time (based on empire metrics). The frontend only needs the latest state and to record dismiss/pin actions.

**REST Endpoints**
| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/tech-advisor/state` | Fetch persisted advisor context for player. |
| `PUT` | `/api/v1/tech-advisor/state` | Replace `current_focus_node_id`, `dismissed_suggestions`, etc. |
| `POST` | `/api/v1/tech-advisor/dismiss` | Append dismissal for a given node/advice. |
| `POST` | `/api/v1/tech-advisor/pin` | (Optional) Pin a suggestion for emphasis. |

**Example Payload**
```json
// GET /api/v1/tech-advisor/state
{
  "current_focus_node_id": "research-energy_shields",
  "dismissed_suggestions": [
    {
      "node_id": "facility-basic_shipyard",
      "advisor_id": "logistics_ai",
      "dismissed_at": "2025-11-05T04:12:19Z"
    }
  ],
  "updated_at": "2025-11-05T04:12:19Z"
}
```

**WebSocket Events**
- `tech-advisor.state.updated`
  - Payload mirrors the `GET` response.
  - Emitted when server-side insights change (e.g. empire state makes new advice available).

---

### 3. Supporting Metadata

**Reference Data**
- The frontend already consumes `/api/v1/tech-tree/definitions`.
- To hydrate imagery and prerequisite tooltips, continue returning:
  - `slug`, `name`, `type`, `specialization`, `era`
  - `prerequisites` arrays for facilities/research/defences
  - `effects`, `costs`, `build_time_ticks`
  - `image_path` (optional string; we derive fallback from slug as `assets/images/{type}s/{slug}.png`)

**Prerequisite Endpoint**
- `/api/v1/prerequisites/{slug}` should remain available to resolve locked content for tooltips when a node is missing from the immediate buildable list.

---

### 4. Authentication & Multi-Device Sync

- All endpoints require the existing session token.
- Plans/advisor state are scoped per empire/player.
- Consider optimistic locking via `updated_at` to avoid overwriting more recent edits.
- Rate limiting expectations: low (UI produces at most a handful of calls per session).

---

### 5. Implementation Notes for Backend Team

1. **Storage**: A simple table per entity is sufficient (e.g. `tech_plans`, `tech_advisor_states`). JSON column for `node_ids` is acceptable; ordering matters.
2. **Validation**:
   - Verify node IDs exist in tech definitions.
   - Cap plan count per player (frontend copy suggests 10-15 max).
   - Enforce string length limits; return validation errors with field detail.
3. **Security**:
   - Ensure CRUD routes only touch the authenticated player's records.
   - WebSocket events should broadcast only to that player.
4. **Versioning**:
   - If tech tree definitions change (e.g. new nodes), keep plans referencing retired nodes but flag them for frontend to resolve.
5. **Testing**:
   - Provide fixture data for automated frontend tests (seed a plan and advisor state).

This spec should give the backend team everything required to wire persistent storage for tech plans and advisor context. Let us know if additional fields or constraints are needed as implementation progresses.

