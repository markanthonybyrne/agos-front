# Frontend Architecture - A Game Of Space (AGOS)

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYERS                          │
├─────────────────────────────────────────────────────────────────┤
│  Presentation Layer (UI Components)                            │
│  ├── Planet Management UI                                      │
│  ├── Fleet Control Interface                                   │
│  ├── Construction Queue Display                                │
│  ├── Universe Map                                             │
│  ├── Alliance Chat                                            │
│  └── News & Mail System                                       │
├─────────────────────────────────────────────────────────────────┤
│  State Management Layer                                        │
│  ├── User State (Auth, Empire, Planets)                       │
│  ├── Game State (Ticks, Resources, Construction)              │
│  ├── UI State (Modals, Navigation, Filters)                   │
│  └── Cache Layer (Definitions, Rankings, Static Data)         │
├─────────────────────────────────────────────────────────────────┤
│  API Integration Layer                                         │
│  ├── HTTP Client (Axios/Fetch)                                │
│  ├── WebSocket Client (Laravel Echo)                          │
│  ├── Request Interceptors (Auth, Error Handling)              │
│  └── Response Transformers                                     │
├─────────────────────────────────────────────────────────────────┤
│  Backend API (Laravel)                                         │
│  ├── REST Endpoints (CRUD Operations)                         │
│  ├── WebSocket Server (Real-time Updates)                     │
│  ├── Tick Processor (Game Logic)                              │
│  └── Database (MySQL/Redis)                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Authentication Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Login     │───▶│   API Call  │───▶│  Store Token│
│  Component  │    │ /auth/login │    │  & Redirect │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Register   │    │  Error      │    │  Main App   │
│ Component   │    │  Handling   │    │  Dashboard  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 2. Planet Management Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Planet List │───▶│ Planet      │───▶│ Planet      │
│ Component   │    │ Details     │    │ Actions     │
│             │    │ Modal       │    │ (Build,     │
│             │    │             │    │  Scan, etc) │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Universe   │    │ Construction│    │ Resource    │
│  Map View   │    │ Queue       │    │ Management  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 3. Real-time Updates Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ WebSocket   │───▶│ Event       │───▶│ State       │
│ Connection  │    │ Handlers    │    │ Updates     │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Empire      │    │ Alliance    │    │ Galaxy      │
│ Notifications│   │ Chat        │    │ Broadcasts  │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Data Flow Patterns

### 1. User Authentication

```javascript
// 1. User submits login form
const handleLogin = async (credentials) => {
    // 2. API call to /auth/login
    const response = await apiClient.post("/auth/login", credentials);

    // 3. Store token and user data
    localStorage.setItem("auth_token", response.token);
    userStore.setUser(response.user);
    empireStore.setEmpire(response.empire);

    // 4. Redirect to dashboard
    router.push("/dashboard");
};
```

### 2. Planet Data Loading

```javascript
// 1. Component mounts
const PlanetList = () => {
    const [planets, setPlanets] = useState([]);

    useEffect(() => {
        // 2. Load planets on mount
        loadPlanets();
    }, []);

    const loadPlanets = async () => {
        // 3. API call to /planets
        const response = await apiClient.get("/planets");

        // 4. Update component state
        setPlanets(response.planets);
    };

    // 5. Render planet list
    return <PlanetGrid planets={planets} />;
};
```

### 3. Construction Queue Management

```javascript
// 1. User clicks build button
const handleBuildFacility = async (planetId, facilitySlug) => {
    // 2. API call to build facility
    const response = await apiClient.post(`/planets/${planetId}/facilities`, {
        facility_slug: facilitySlug,
        level: 1,
    });

    // 3. Update local state optimistically
    constructionStore.addConstruction(response.construction);

    // 4. Show success message
    notificationStore.showSuccess("Facility construction started");

    // 5. WebSocket will update progress in real-time
};
```

### 4. Real-time Updates

```javascript
// 1. Setup WebSocket connection
const setupWebSocket = () => {
    // 2. Listen to empire notifications
    echo.private(`empire.${empireId}`).listen("EmpireNotification", (event) => {
        // 3. Handle different notification types
        switch (event.type) {
            case "INCOMING_FLEET":
                fleetStore.addIncomingFleet(event.data);
                notificationStore.showAlert("Incoming fleet detected!");
                break;
            case "CONSTRUCTION_COMPLETED":
                constructionStore.completeConstruction(event.data);
                notificationStore.showSuccess("Construction completed!");
                break;
        }
    });

    // 4. Listen to tick updates
    echo.channel("public.tick").listen("TickProcessed", (event) => {
        // 5. Refresh all game data
        gameStore.refreshAllData();
    });
};
```

## State Management Structure

### 1. User State

```javascript
const userStore = {
    // State
    isAuthenticated: false,
    user: null,
    empire: null,
    token: null,

    // Actions
    login: (credentials) => {
        /* ... */
    },
    logout: () => {
        /* ... */
    },
    updateProfile: (data) => {
        /* ... */
    },
};
```

### 2. Game State

```javascript
const gameStore = {
    // State
    currentTick: 0,
    nextTickETA: 0,
    planets: [],
    fleets: [],
    constructionQueue: [],
    resources: { tellerium: 0, krypton: 0 },

    // Actions
    loadGameData: () => {
        /* ... */
    },
    updateResources: (planetId, resources) => {
        /* ... */
    },
    addConstruction: (construction) => {
        /* ... */
    },
    completeConstruction: (constructionId) => {
        /* ... */
    },
};
```

### 3. UI State

```javascript
const uiStore = {
    // State
    activeModal: null,
    selectedPlanet: null,
    navigationTab: "planets",
    filters: { planetType: "all", sortBy: "name" },

    // Actions
    openModal: (modalType, data) => {
        /* ... */
    },
    closeModal: () => {
        /* ... */
    },
    selectPlanet: (planetId) => {
        /* ... */
    },
    setFilter: (key, value) => {
        /* ... */
    },
};
```

## API Integration Patterns

### 1. HTTP Client Setup

```javascript
// API client with interceptors
const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 10000,
});

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized
            userStore.logout();
            router.push("/login");
        }
        return Promise.reject(error);
    }
);
```

### 2. WebSocket Setup

```javascript
// WebSocket client setup
const echo = new Echo({
    broadcaster: "pusher",
    key: process.env.REACT_APP_PUSHER_KEY,
    wsHost: process.env.REACT_APP_WS_HOST,
    wsPort: process.env.REACT_APP_WS_PORT,
    auth: {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
    },
});
```

### 3. Error Handling

```javascript
// Centralized error handling
const handleApiError = (error) => {
    const errorCode = error.response?.data?.code;
    const errorMessage = error.response?.data?.message;

    switch (errorCode) {
        case "INSUFFICIENT_RESOURCES":
            notificationStore.showError("Not enough resources");
            break;
        case "PREREQUISITES_NOT_MET":
            notificationStore.showError("Prerequisites not met");
            break;
        case "RATE_LIMIT_EXCEEDED":
            notificationStore.showError("Too many requests, please wait");
            break;
        default:
            notificationStore.showError(errorMessage || "An error occurred");
    }
};
```

## Component Structure

### 1. Layout Components

```
App
├── Header
│   ├── UserMenu
│   ├── EmpireInfo
│   └── TickCounter
├── Navigation
│   ├── NavItem (Planets)
│   ├── NavItem (Fleets)
│   ├── NavItem (Alliances)
│   └── NavItem (Mail)
├── MainContent
│   └── Router
│       ├── Dashboard
│       ├── PlanetList
│       ├── PlanetDetails
│       ├── FleetList
│       ├── AllianceList
│       └── MailBox
└── Modals
    ├── ConstructionModal
    ├── FleetOrderModal
    ├── AllianceModal
    └── NotificationModal
```

### 2. Planet Components

```
PlanetList
├── PlanetCard
│   ├── PlanetInfo
│   ├── ResourceDisplay
│   ├── FacilityList
│   └── ActionButtons
├── PlanetDetails
│   ├── PlanetHeader
│   ├── ConstructionQueue
│   ├── BuildableItems
│   └── FleetList
└── UniverseMap
    ├── GalaxyView
    ├── PlanetMarker
    └── FleetMarker
```

### 3. Construction Components

```
ConstructionQueue
├── ConstructionItem
│   ├── ProgressBar
│   ├── ItemInfo
│   └── CancelButton
├── BuildableItems
│   ├── FacilityList
│   ├── ShipList
│   ├── DefenceList
│   └── ResearchList
└── BuildModal
    ├── ItemSelector
    ├── QuantityInput
    └── CostDisplay
```

## Performance Optimizations

### 1. Data Caching

```javascript
// Cache static data
const definitionsCache = {
    facilities: null,
    ships: null,
    defences: null,
    research: null,

    async load() {
        if (!this.facilities) {
            this.facilities = await apiClient.get("/facilities/definitions");
        }
        return this.facilities;
    },
};
```

### 2. Optimistic Updates

```javascript
// Update UI immediately, rollback on error
const buildFacility = async (planetId, facilitySlug) => {
    // 1. Optimistic update
    const tempConstruction = {
        id: "temp-" + Date.now(),
        type: "facility",
        item_slug: facilitySlug,
        status: "building",
    };
    constructionStore.addConstruction(tempConstruction);

    try {
        // 2. API call
        const response = await apiClient.post(
            `/planets/${planetId}/facilities`,
            {
                facility_slug: facilitySlug,
            }
        );

        // 3. Replace temp with real data
        constructionStore.replaceConstruction(
            tempConstruction.id,
            response.construction
        );
    } catch (error) {
        // 4. Rollback on error
        constructionStore.removeConstruction(tempConstruction.id);
        handleApiError(error);
    }
};
```

### 3. Lazy Loading

```javascript
// Lazy load heavy components
const UniverseMap = lazy(() => import("./UniverseMap"));
const AllianceChat = lazy(() => import("./AllianceChat"));

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
    <UniverseMap />
</Suspense>;
```

## Testing Strategy

### 1. Unit Tests

-   Component rendering
-   State management logic
-   API integration functions
-   Utility functions

### 2. Integration Tests

-   User authentication flow
-   Planet management workflows
-   Construction queue operations
-   Real-time updates

### 3. E2E Tests

-   Complete user journeys
-   Cross-browser compatibility
-   Performance testing
-   Error handling scenarios

This architecture provides a solid foundation for building a responsive, real-time space strategy game frontend that integrates seamlessly with the AGOS API.
