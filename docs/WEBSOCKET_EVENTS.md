# WebSocket Events Reference

Complete list of all WebSocket events broadcast by the EmpireQuest API for frontend integration.

## Event Overview

All events use Pusher as the broadcasting driver. Events are broadcast on private channels (requiring authentication) or public channels.

### Channel Types

-   **Private Channels:** Require authentication, format: `empire.{id}` or `alliance.{id}`
    -   Frontend subscribes as: `private-empire.{id}` or `private-alliance.{id}`
    -   Laravel automatically strips the `private-` prefix when matching authorization
-   **Public Channels:** No authentication required, format: `public.tick` or `public-galaxy.{quadrant}.{sector}.{galaxy}`

---

## Events List

### 1. `empire.updated`

**Channel:** `empire.{id}` (private)  
**Also broadcasts to:** `alliance.{id}` (if empire is in an alliance)

**Triggered when:** Empire data changes (score, planets, alliance status, etc.)

**Event Data:**

```typescript
{
    empire: {
        id: number;
        name: string;
        score: number;
        planets_owned: number;
        alliance_id: number | null;
    }
    changes: Record<string, any>; // What changed
    timestamp: string; // ISO 8601
}
```

**Frontend Listener:**

```javascript
channel.listen(".empire.updated", (data) => {
    // data.empire - updated empire object
    // data.changes - what changed
    updateEmpireData(data.empire, data.changes);
});
```

---

### 2. `combat.resolved`

**Channel:** `empire.{id}` (private) for each participating empire  
**Also broadcasts to:** `public-galaxy.{quadrant}.{sector}.{galaxy}` (public)

**Triggered when:** A battle/combat is resolved

**Event Data:**

```typescript
{
  combat_log: {
    id: number;
    tick_number: number;
    location: {
      coordinate: string; // "1:1:1:5"
    };
    participants: Array<{
      empire_id: number;
      type: 'fleet' | 'planet';
      ships?: Record<string, number>;
      defences?: Record<string, number>;
      strength: number;
    }>;
    result: {
      winner_empire_id: number | null;
      ships_lost: Record<number, Record<string, number>>; // empire_id => ship_type => quantity
      facilities_destroyed?: Array<any>;
      planets_captured?: Array<any>;
    };
  };
  timestamp: string;
}
```

**Frontend Listener:**

```javascript
channel.listen(".combat.resolved", (data) => {
    // data.combat_log - full battle report
    showBattleReport(data.combat_log);
    refreshCombatLogsList();
});
```

---

### 3. `planet.updated`

**Channel:** `empire.{id}` (private) if planet is owned  
**Also broadcasts to:** `public-galaxy.{quadrant}.{sector}.{galaxy}` (public)

**Triggered when:** Planet data changes (resources, ownership, mines, probes, etc.)

**Event Data:**

```typescript
{
    planet: {
        id: number;
        name: string;
        coordinate: {
            quadrant: number;
            sector: number;
            galaxy: number;
            planet: number;
        }
        state: string;
        owner_empire_id: number | null;
        mines: number;
        probes: number;
        tellerium_balance: number;
        krypton_balance: number;
    }
    changes: Record<string, any>; // What changed
    timestamp: string;
}
```

**Frontend Listener:**

```javascript
channel.listen(".planet.updated", (data) => {
    // data.planet - updated planet object
    updatePlanetDisplay(data.planet, data.changes);
});
```

---

### 4. `fleet.arrived`

**Channel:** `empire.{id}` (private) for fleet owner  
**Also broadcasts to:** `alliance.{id}` (if owner or destination empire is in an alliance)

**Triggered when:** A fleet arrives at its destination

**Event Data:**

```typescript
{
    fleet: {
        id: number;
        ships: Record<string, number>; // ship_type => quantity
        destination: {
            coordinate: string; // "1:1:1:5"
        }
        status: "arrived" | "stationed";
        order_type: "attack" | "station" | "return";
        arrival_tick: number;
    }
    timestamp: string;
}
```

**Frontend Listener:**

```javascript
channel.listen(".fleet.arrived", (data) => {
    // data.fleet - fleet that arrived
    notifyFleetArrival(data.fleet);
    refreshFleetList();
});
```

---

### 5. `mail.received`

**Channel:** `empire.{id}` (private) for recipient

**Triggered when:** New mail is received

**Event Data:**

```typescript
{
    mail: {
        id: number;
        from_empire: {
            id: number;
            name: string;
        }
        subject: string;
        created_at: string; // ISO 8601
    }
    timestamp: string;
}
```

**Frontend Listener:**

```javascript
channel.listen(".mail.received", (data) => {
    // data.mail - new mail notification (summary only)
    showMailNotification(data.mail);
    refreshMailList();
});
```

**Note:** Full mail content should be fetched via API: `GET /api/v1/mail/{id}`

---

### 6. `news.created`

**Channel:** `empire.{id}` (private)

**Triggered when:** News is created for an empire

**Event Data:**

```typescript
{
    news: {
        id: number;
        type: string; // News type
        payload: Record<string, any>; // News data
        created_at: string; // ISO 8601
    }
    timestamp: string;
}
```

**Frontend Listener:**

```javascript
channel.listen(".news.created", (data) => {
    // data.news - new news item
    addNewsItem(data.news);
    showNewsNotification(data.news);
});
```

---

### 7. `alliance.chat.message`

**Channel:** `alliance.{id}` (private)

**Triggered when:** A new message is posted in alliance chat

**Event Data:**

```typescript
{
    message: {
        id: number;
        alliance_id: number;
        sender_empire: {
            id: number;
            name: string;
        }
        message: string;
        created_at: string; // ISO 8601
    }
    timestamp: string;
}
```

**Frontend Listener:**

```javascript
allianceChannel.listen(".alliance.chat.message", (data) => {
    // data.message - new chat message
    appendChatMessage(data.message);
});
```

---

### 8. `tick.processed`

**Channel:** `public.tick` (public - no authentication required)

**Triggered when:** Game tick processing completes

**Event Data:**

```typescript
{
    tick_number: number;
    stats: {
        planets_processed: number;
        production_applied: number;
        facilities_completed: number;
        defences_completed: number;
        ships_completed: number;
        research_completed: number;
        fleets_arrived: number;
        combats_resolved: number;
        duration_seconds: number;
    }
    next_tick_eta: number; // Seconds until next tick
    timestamp: string;
}
```

**Frontend Listener:**

```javascript
// Subscribe to public channel (no auth needed)
const tickChannel = echo.channel("public.tick");

tickChannel.listen(".tick.processed", (data) => {
    // data.tick_number - current tick number
    // data.stats - tick processing statistics
    // data.next_tick_eta - seconds until next tick
    updateTickDisplay(data);
    refreshAllGameData(); // Refresh UI after tick
});
```

---

## Frontend Integration Example

```javascript
import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: "pusher",
    key: "33d7245f0190d9d32296",
    cluster: "eu",
    forceTLS: true,
    authEndpoint: "https://api.agameof.space/broadcasting/auth",
    auth: {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        },
    },
});

// Subscribe to empire channel
const empireChannel = echo.private(`empire.${empireId}`);

// Map all events
empireChannel
    .listen(".empire.updated", handleEmpireUpdated)
    .listen(".combat.resolved", handleCombatResolved)
    .listen(".planet.updated", handlePlanetUpdated)
    .listen(".fleet.arrived", handleFleetArrived)
    .listen(".mail.received", handleMailReceived)
    .listen(".news.created", handleNewsCreated);

// Subscribe to alliance channel (if in alliance)
if (allianceId) {
    const allianceChannel = echo.private(`alliance.${allianceId}`);
    allianceChannel.listen(".alliance.chat.message", handleAllianceChatMessage);
}

// Subscribe to public tick channel
const tickChannel = echo.channel("public.tick");
tickChannel.listen(".tick.processed", handleTickProcessed);
```

---

## Event Summary Table

| Event Name              | Channel Type     | Channel Name                      | Auth Required |
| ----------------------- | ---------------- | --------------------------------- | ------------- |
| `empire.updated`        | Private          | `empire.{id}`                     | Yes           |
| `combat.resolved`       | Private + Public | `empire.{id}` + `public-galaxy.*` | Yes (private) |
| `planet.updated`        | Private + Public | `empire.{id}` + `public-galaxy.*` | Yes (private) |
| `fleet.arrived`         | Private          | `empire.{id}`                     | Yes           |
| `mail.received`         | Private          | `empire.{id}`                     | Yes           |
| `news.created`          | Private          | `empire.{id}`                     | Yes           |
| `alliance.chat.message` | Private          | `alliance.{id}`                   | Yes           |
| `tick.processed`        | Public           | `public.tick`                     | No            |

---

## Notes

1. **Event Names:** Laravel Echo prefixes private channel events with a dot (`.empire.updated`). Always use the dot prefix when listening.

2. **Channel Authorization:** Private channels require authentication via the `/broadcasting/auth` endpoint with a valid Bearer token.

3. **Data Structure:** All events include a `timestamp` field in ISO 8601 format.

4. **Changes Field:** Events like `empire.updated` and `planet.updated` include a `changes` object indicating what was modified.

5. **Public vs Private:** Public channels (`public.tick`, `public-galaxy.*`) don't require authentication and can be subscribed without a token.
