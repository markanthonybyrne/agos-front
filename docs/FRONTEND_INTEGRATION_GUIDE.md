# Frontend Integration Guide - A Game Of Space (AGOS)

## Overview

This guide provides comprehensive instructions for frontend developers on how to integrate with the AGOS API. The game is a tick-driven space strategy game where players manage empires, colonize planets, build facilities, research technologies, and engage in combat.

## Base Configuration

### API Endpoints

-   **Production**: `https://api.astralus.online/api/v1`
-   **Staging**: `https://staging-api.astralus.online/api/v1`
-   **Local Development**: `http://localhost:8000/api/v1` (or `https://empirequest.lndo.site/api/v1` for Lando)

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Tick System

-   Game ticks occur approximately every 30 minutes
-   Heavy operations (construction, research, combat) are resolved during ticks
-   Use WebSocket channels for real-time updates

---

## 1. Authentication & User Management

### User Registration

```javascript
// POST /auth/register
const registerUser = async (userData) => {
    const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: "CommanderZen",
            email: "zen@agameof.space",
            password: "securePassword123",
            empire_name: "MorcaoLand",
        }),
    });

    const data = await response.json();
    // Store token for future requests
    localStorage.setItem("auth_token", data.token);
    return data;
};
```

### User Login

```javascript
// POST /auth/login
const loginUser = async (email, password) => {
    const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    localStorage.setItem("auth_token", data.token);
    return data;
};
```

### Get Current User & Empire

```javascript
// GET /me
const getCurrentUser = async () => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch("/api/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
    // Returns: { user, empire, planets, next_tick }
};
```

**Frontend Usage:**

-   Call on app initialization to get user state
-   Display empire name, score, and planet count
-   Show next tick countdown timer
-   Use `planets` array to populate planet list

---

## 2. Planet Management

### Get All User's Planets

```javascript
// GET /planets
const getUserPlanets = async () => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch("/api/v1/planets", {
        headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
    // Returns: { planets: [...] }
};
```

### Get Planet Details

```javascript
// GET /planets/{id}
const getPlanetDetails = async (planetId) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`/api/v1/planets/${planetId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
    // Returns: Planet object with facilities, defences, fleets_in_orbit
};
```

### Colonize New Planet

```javascript
// POST /planets
const colonizePlanet = async (coordinate) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch("/api/v1/planets", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            coordinate: {
                quadrant: 1,
                sector: 2,
                galaxy: 3,
                planet: 4,
            },
        }),
    });

    return await response.json();
};
```

**Frontend Usage:**

-   Display planet list with coordinates, resources, and facilities
-   Show planet details in modal/sidebar
-   Implement planet colonization from universe map
-   Display resource balances and production rates

---

## 3. Construction & Building

### Get Buildable Items

```javascript
// GET /planets/{id}/buildable
const getBuildableItems = async (planetId) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`/api/v1/planets/${planetId}/buildable`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
    // Returns: { facilities: [...], research: [...], ships: [...], defences: [...] }
};
```

### Build Facility

```javascript
// POST /planets/{planetId}/facilities
const buildFacility = async (planetId, facilitySlug, level = 1) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`/api/v1/planets/${planetId}/facilities`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            facility_slug: facilitySlug,
            level: level,
        }),
    });

    return await response.json();
};
```

### Build Ship

```javascript
// POST /planets/{planetId}/ships
const buildShip = async (planetId, shipSlug, quantity = 1) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`/api/v1/planets/${planetId}/ships`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ship_slug: shipSlug,
            quantity: quantity,
        }),
    });

    return await response.json();
};
```

### Build Defence

```javascript
// POST /planets/{planetId}/defences
const buildDefence = async (planetId, defenceSlug, quantity = 1) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`/api/v1/planets/${planetId}/defences`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            defence_slug: defenceSlug,
            quantity: quantity,
        }),
    });

    return await response.json();
};
```

### Start Research

```javascript
// POST /planets/{planetId}/research/start
const startResearch = async (planetId, researchSlug) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`/api/v1/planets/${planetId}/research/start`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            research_slug: researchSlug,
        }),
    });

    return await response.json();
};
```

### Get Construction Queue

```javascript
// GET /planets/{id}/construction-queue
const getConstructionQueue = async (planetId) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(
        `/api/v1/planets/${planetId}/construction-queue`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    return await response.json();
    // Returns: { construction_queue: [...] }
};
```

### Cancel Construction

```javascript
// DELETE /planets/{planetId}/facilities/{id}/cancel
const cancelFacilityConstruction = async (planetId, constructionId) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(
        `/api/v1/planets/${planetId}/facilities/${constructionId}/cancel`,
        {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    return await response.json();
};

// Similar endpoints for ships, defences, and research:
// DELETE /planets/{planetId}/ships/{id}/cancel
// DELETE /planets/{planetId}/defences/{id}/cancel
// DELETE /planets/{planetId}/research/{id}/cancel
```

**Frontend Usage:**

-   Show buildable items based on prerequisites
-   Display construction queue with progress bars
-   Implement build/cancel buttons for each item type
-   Show resource costs and build times
-   Update UI after successful construction

---

## 4. Fleet Management

### Get All Fleets

```javascript
// GET /fleets
const getAllFleets = async () => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch("/api/v1/fleets", {
        headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
    // Returns: { fleets: [...] }
};
```

### Create Fleet Order

```javascript
// POST /fleets
const createFleetOrder = async (fleetData) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch("/api/v1/fleets", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            origin_planet_id: 1009,
            destination_coordinate: {
                quadrant: 1,
                sector: 2,
                galaxy: 3,
                planet: 5,
            },
            ships: {
                assault_fighter: 30,
                fighter: 15,
            },
            order_type: "attack", // 'attack', 'defend', 'station', 'return'
            auto_return_on_failure: false,
        }),
    });

    return await response.json();
};
```

### Get Fleet Details

```javascript
// GET /fleets/{id}
const getFleetDetails = async (fleetId) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`/api/v1/fleets/${fleetId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
};
```

### Cancel Fleet

```javascript
// DELETE /fleets/{id}
const cancelFleet = async (fleetId) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`/api/v1/fleets/${fleetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.status === 204;
};
```

**Frontend Usage:**

-   Display fleet list with status and ETA
-   Show fleet composition and destination
-   Implement fleet creation form with ship selection
-   Display fleet movement on universe map
-   Handle fleet status updates via WebSocket

---

## 5. Resource Management

### Buy Mines

```javascript
// POST /planets/{id}/buy-mines
const buyMines = async (planetId, quantity) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`/api/v1/planets/${planetId}/buy-mines`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
    });

    return await response.json();
};
```

**Frontend Usage:**

-   Show mine/probe counts on planet details
-   Implement mine purchase interface
-   Display resource production rates
-   Show resource balances with real-time updates

---

## 6. Intelligence & Scanning

### Launch Tachyon Signal

```javascript
// POST /signals
const launchSignal = async (targetCoordinate, signalType) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch("/api/v1/signals", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            target_coordinate: targetCoordinate,
            type: signalType, // 'fleet', 'orbital_defence', 'planetary', 'all_frequency', 'events'
        }),
    });

    return await response.json();
};
```

### Get Signal History

```javascript
// GET /signals
const getSignalHistory = async () => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch("/api/v1/signals", {
        headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
};
```

**Frontend Usage:**

-   Implement scanning interface on universe map
-   Display scan results in popup/modal
-   Show signal history with timestamps
-   Handle different signal types and their results

---

## 7. Combat System

### Get Combat Log

```javascript
// GET /combat/logs/{id}
const getCombatLog = async (combatLogId) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`/api/v1/combat/logs/${combatLogId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
};
```

**Frontend Usage:**

-   Display combat reports with detailed results
-   Show ship losses and battle outcomes
-   Implement combat log viewer
-   Handle combat notifications via WebSocket

---

## 8. Alliances

### Get All Alliances

```javascript
// GET /alliances
const getAllAlliances = async () => {
    const response = await fetch("/api/v1/alliances");
    return await response.json();
};
```

### Create Alliance

```javascript
// POST /alliances
const createAlliance = async (name, tag) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch("/api/v1/alliances", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, tag }),
    });

    return await response.json();
};
```

### Get Alliance Details

```javascript
// GET /alliances/{id}
const getAllianceDetails = async (allianceId) => {
    const response = await fetch(`/api/v1/alliances/${allianceId}`);
    return await response.json();
};
```

### Donate to Alliance

```javascript
// POST /alliances/{id}
const donateToAlliance = async (allianceId, tellerium, krypton) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`/api/v1/alliances/${allianceId}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ tellerium, krypton }),
    });

    return await response.json();
};
```

**Frontend Usage:**

-   Display alliance list and rankings
-   Show alliance details and member list
-   Implement alliance creation form
-   Handle alliance fund donations
-   Display alliance chat (via WebSocket)

---

## 9. Communication

### Get Mail

```javascript
// GET /mail
const getMail = async () => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch("/api/v1/mail", {
        headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
    // Returns: { inbox: [...], sent: [...] }
};
```

### Send Mail

```javascript
// POST /mail
const sendMail = async (toEmpireId, subject, body) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch("/api/v1/mail", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ to_empire_id: toEmpireId, subject, body }),
    });

    return await response.json();
};
```

### Get News

```javascript
// GET /news
const getNews = async (type = null, since = null) => {
    const token = localStorage.getItem("auth_token");
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (since) params.append("since", since);

    const response = await fetch(`/api/v1/news?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
};
```

**Frontend Usage:**

-   Implement mail system with inbox/sent folders
-   Show news feed with different categories
-   Handle mail composition and sending
-   Display news notifications

---

## 10. Universe & Map

### Get Universe Map

```javascript
// GET /universe/map
const getUniverseMap = async (quadrant, sector, galaxy) => {
    const params = new URLSearchParams();
    if (quadrant) params.append("quadrant", quadrant);
    if (sector) params.append("sector", sector);
    if (galaxy) params.append("galaxy", galaxy);

    const response = await fetch(`/api/v1/universe/map?${params}`);
    return await response.json();
};
```

### Get Top Rankings

```javascript
// GET /universe/top
const getTopRankings = async () => {
    const response = await fetch("/api/v1/universe/top");
    return await response.json();
    // Returns: { top_empires: [...], top_galaxies: [...] }
};
```

**Frontend Usage:**

-   Implement universe map with coordinate system
-   Show planet states and ownership
-   Display empire and galaxy rankings
-   Handle map navigation and zoom levels

---

## 11. WebSocket Integration

### Setup WebSocket Connection

```javascript
import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: "pusher",
    key: "your-pusher-key",
    wsHost: "your-websocket-host",
    wsPort: 6001,
    wssPort: 6001,
    forceTLS: false,
    enabledTransports: ["ws", "wss"],
    auth: {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
    },
});
```

### Listen to Empire Notifications

```javascript
// Listen to private empire channel
echo.private(`empire.${empireId}`).listen("EmpireNotification", (e) => {
    console.log("Empire notification:", e);
    // Handle incoming fleet, combat, etc.
});
```

### Listen to Alliance Chat

```javascript
// Listen to alliance chat
echo.private(`alliance.${allianceId}`).listen("AllianceChatMessage", (e) => {
    console.log("Alliance message:", e);
    // Update chat UI
});
```

### Listen to Galaxy Events

```javascript
// Listen to galaxy broadcasts
echo.channel(`galaxy.${quadrant}.${sector}.${galaxy}`).listen(
    "GalaxyBroadcast",
    (e) => {
        console.log("Galaxy event:", e);
        // Update galaxy map
    }
);
```

### Listen to Tick Updates

```javascript
// Listen to tick updates
echo.channel("public.tick").listen("TickProcessed", (e) => {
    console.log("Tick processed:", e);
    // Refresh game state
    refreshGameState();
});
```

**Frontend Usage:**

-   Real-time updates for fleet movements
-   Live combat notifications
-   Alliance chat functionality
-   Galaxy-wide events and broadcasts
-   Automatic game state refresh on ticks

---

## 12. Error Handling

### Standard Error Response Format

```javascript
const handleApiError = (response) => {
    if (!response.ok) {
        return response.json().then((error) => {
            throw new Error(`${error.code}: ${error.message}`);
        });
    }
    return response.json();
};

// Usage
try {
    const data = await fetch("/api/v1/planets", {
        headers: { Authorization: `Bearer ${token}` },
    }).then(handleApiError);
} catch (error) {
    console.error("API Error:", error.message);
    // Show user-friendly error message
}
```

### Common Error Codes

-   `VALIDATION_ERROR`: Form validation failed
-   `INSUFFICIENT_RESOURCES`: Not enough resources
-   `PREREQUISITES_NOT_MET`: Missing required facilities/research
-   `RATE_LIMIT_EXCEEDED`: Too many requests
-   `FORBIDDEN`: Access denied
-   `NOT_FOUND`: Resource not found

---

## 13. Best Practices

### 1. Token Management

```javascript
// Store token securely
localStorage.setItem("auth_token", token);

// Add token to all requests
const apiCall = async (url, options = {}) => {
    const token = localStorage.getItem("auth_token");
    return fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
};
```

### 2. Rate Limiting

-   Implement exponential backoff for rate-limited requests
-   Show user-friendly messages for rate limit errors
-   Cache frequently accessed data

### 3. Real-time Updates

-   Use WebSocket for live updates
-   Implement optimistic UI updates
-   Handle connection drops gracefully

### 4. Data Caching

-   Cache static data (definitions, rankings)
-   Implement smart refresh strategies
-   Use local storage for offline capabilities

### 5. User Experience

-   Show loading states for all async operations
-   Implement progress bars for construction
-   Display countdown timers for ticks and arrivals
-   Provide clear error messages

---

## 14. Development Tools

### API Testing

-   Use the Swagger documentation at `/api/documentation`
-   Test endpoints with Postman or similar tools
-   Use browser dev tools for debugging

### Local Development

-   Use Lando for local development: `https://empirequest.lndo.site/api/v1`
-   Enable debug mode for detailed error messages
-   Use browser console for API debugging

---

## 15. Security Considerations

### Authentication

-   Never expose tokens in client-side code
-   Implement token refresh mechanism
-   Handle token expiration gracefully

### Data Validation

-   Always validate user input on frontend
-   Trust server-side validation as source of truth
-   Sanitize user-generated content

### CORS

-   Configure CORS properly for production
-   Use HTTPS in production
-   Validate origin headers

---

This guide provides a comprehensive foundation for frontend development with the AGOS API. Each section includes practical code examples and frontend usage patterns to help developers implement the game's features effectively.
