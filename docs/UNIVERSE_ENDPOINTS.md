# Universe Endpoints Summary

A comprehensive guide to all API endpoints available for mapping and displaying the universe in the front-end.

## Overview

The universe is organized hierarchically: **Regions → Systems → Planets**. All coordinates can be filtered by this hierarchy, and planets also have X/Y coordinates for precise positioning.

---

## Primary Map Endpoints

### 1. `/api/v1/universe/map` (GET)

**Main endpoint for displaying universe map data**

**Authentication:** Optional (enhanced features when authenticated)

**Query Parameters:**

-   `region` (integer, 1-20) - Filter by region
-   `system` (integer, 1-125) - Filter by specific system (requires region)
-   `show_discovered_only` (boolean, default: false) - Show only planets you've discovered (requires auth)
-   `include_uninhabitable` (boolean, default: false) - Include uninhabitable planets
-   `limit` (integer, 1-5000, default: 1000) - Max planets to return (pagination)

**Response:**

```json
{
    "region": 1,
    "system": 7,
    "planets": [
        {
            "id": 123,
            "x": 250,
            "y": 375,
            "coordinate": {
                "x": 250,
                "y": 375,
                "region": 1,
                "system": 7,
                "planet": 12
            },
            "region_name": "Outer Rim",
            "system_name": "Alpha Prime",
            "state": "unsettled",
            "is_habitable": true,
            "owner_name": null,
            "type": {
                "slug": "terran",
                "name": "Terran",
                "description": "..."
            }
        }
    ],
    "exploration_status": {
        "total_planets": 150,
        "discovered": 45,
        "unsettled": 140,
        "colonized": 10
    },
    "region_names": {},
    "system_names": {},
    "pagination": {
        "limit": 1000,
        "returned": 150
    }
}
```

**Use Cases:**

-   Displaying region/system view
-   Showing exploration progress
-   Filtering by discovered planets
-   Loading planet clusters for zoomed-in views

---

### 2. `/api/v1/planets/search` (GET)

**Optimized endpoint for searching and paginating planets**

**Authentication:** Not required (rate limited: 300 requests/minute)

**Query Parameters:**

-   `state` (string) - Filter by state: `unsettled`, `colony`, `homeworld`
-   `region` (integer) - Filter by region
-   `system` (integer) - Filter by system (requires region)
-   `is_habitable` (boolean) - Filter by habitable status
-   `limit` (integer, 1-500, default: 100) - Results per page
-   `offset` (integer, default: 0) - Pagination offset
-   `include_total` (boolean, default: false) - Include total count (expensive, only on first page by default)

**Response:**

```json
{
    "planets": [
        {
            "id": 123,
            "name": "Planet 1:7:12",
            "coordinate": {
                "x": 31,
                "y": 70,
                "region": 1,
                "system": 7,
                "planet": 12
            },
            "state": "unsettled",
            "is_habitable": true,
            "owner_name": null,
            "type": {
                "slug": "toxic",
                "name": "Toxic",
                "description": "..."
            }
        }
    ],
    "total": 5468,
    "limit": 100,
    "offset": 0
}
```

**Use Cases:**

-   **Primary endpoint for map rendering** (most commonly used)
-   Paginated planet loading
-   Filtering planets by various criteria
-   Efficient large-scale planet queries

**Performance Tips:**

-   Use `limit=500` for map rendering to reduce requests
-   Skip `include_total=true` on subsequent pages to improve performance
-   Use hierarchical filters (region/system) to limit results

---

## Universe Structure & Metadata

### 3. `/api/v1/universe/structure` (GET)

**Get hierarchical universe structure with names**

**Authentication:** Not required

**Query Parameters:**

-   `region` (integer) - Filter by region
-   `system` (integer) - Filter by system (requires region)

**Response:**

```json
{
    "quadrant": 1,
    "sector": 1,
    "galaxy": 1,
    "galaxy_name": "Andromeda",
    "systems": [
        {
            "system": 1,
            "name": "Alpha Centauri",
            "planets_count": 15
        }
    ]
}
```

**Use Cases:**

-   Displaying galaxy/system names
-   Building navigation menus
-   Showing system-level statistics

---

### 4. `/api/v1/universe/config` (GET)

**Get universe configuration and dimensions**

**Authentication:** Not required

**Response:**

```json
{
    "grid_width": 2000,
    "grid_height": 1000,
    "quadrant_count": 4,
    "sectors_per_quadrant": 4,
    "galaxies_per_sector": 10,
    "systems_per_galaxy": 10,
    "planets_per_system": 15
}
```

**Use Cases:**

-   Setting up map canvas dimensions
-   Calculating coordinate ranges
-   Understanding universe structure

---

### 5. `/api/v1/universe/top` (GET)

**Get top empires by score**

**Authentication:** Not required

**Response:**

```json
{
    "top_empires": [
        {
            "id": 1,
            "name": "Galactic Empire",
            "score": 150000,
            "planets_owned": 12,
            "is_ai": false
        }
    ]
}
```

**Use Cases:**

-   Leaderboards
-   Displaying top players
-   Empire rankings

---

## Visibility & Discovery

### 6. `/api/v1/universe/visibility` (GET)

**Check what areas of the universe are visible to the player**

**Authentication:** Optional (enhanced features when authenticated)

**Query Parameters:**

-   `quadrant` (integer) - Filter by quadrant
-   `sector` (integer) - Filter by sector

**Response:**

```json
{
    "visible_quadrants": [1, 2],
    "visible_sectors": [1, 2, 3],
    "visible_galaxies": [1, 2, 3, 4, 5],
    "discovered_planets_count": 245
}
```

**Use Cases:**

-   Showing which areas are accessible
-   Displaying discovery progress
-   Filtering map view by visibility

---

### 7. `/api/v1/universe/discoverable` (GET)

**Get list of discoverable galaxies**

**Authentication:** Optional

**Query Parameters:**

-   `quadrant` (integer) - Filter by quadrant
-   `sector` (integer) - Filter by sector

**Response:**

```json
{
    "discoverable_galaxies": [
        {
            "quadrant": 1,
            "sector": 1,
            "galaxy": 4,
            "name": "Nebula Prime",
            "can_discover": true
        }
    ]
}
```

**Use Cases:**

-   Showing which galaxies can be discovered
-   Discovery quests/tracking
-   Exploration planning

---

### 8. `/api/v1/universe/can-reach` (POST)

**Check if a destination is reachable from origin**

**Authentication:** Optional

**Request Body:**

```json
{
    "origin_x": 250,
    "origin_y": 375,
    "destination_x": 500,
    "destination_y": 600
}
```

**Response:**

```json
{
    "can_reach": true,
    "distance": 350.5,
    "estimated_travel_ticks": 15
}
```

**Use Cases:**

-   Validating fleet movements
-   Showing reachable areas
-   Distance calculations

---

## Planet-Specific Endpoints

### 9. `/api/v1/planets/nearby` (GET)

**Find nearby colonizable planets**

**Authentication:** Required

**Query Parameters:**

-   None (uses player's planets as origin)

**Response:**

```json
{
    "nearby_planets": [
        {
            "id": 123,
            "name": "Planet 1:1:2:5:9",
            "coordinate": {
                "x": 17,
                "y": 5,
                "quadrant": 1,
                "sector": 1,
                "galaxy": 2,
                "system": 5,
                "planet": 9
            },
            "state": "unsettled",
            "is_habitable": true,
            "distance": 25.3
        }
    ]
}
```

**Use Cases:**

-   Colonization suggestions
-   Finding nearby targets
-   Exploration hints

---

### 10. `/api/v1/planets/{id}` (GET)

**Get detailed information about a specific planet**

**Authentication:** Required

**Response:**

```json
{
    "id": 123,
    "name": "Homeworld",
    "coordinate": {
        "x": 250,
        "y": 375,
        "quadrant": 1,
        "sector": 1,
        "galaxy": 1,
        "system": 5,
        "planet": 3
    },
    "state": "homeworld",
    "is_habitable": true,
    "owner_name": "My Empire",
    "type": {
        "slug": "terran",
        "name": "Terran",
        "description": "..."
    },
    "tellerium_balance": 50000,
    "krypton_balance": 40000,
    "facilities": [],
    "defence_grid": []
}
```

**Use Cases:**

-   Planet detail view
-   Planet management interface
-   Detailed planet information

---

## Recommended Usage Patterns

### For Map Rendering

1. **Initial Load:** Use `/planets/search` with `limit=500&offset=0&include_total=true`
2. **Pagination:** Use `/planets/search` with `limit=500&offset=500` (skip `include_total` for performance)
3. **Filtered Views:** Add `quadrant`, `sector`, `galaxy` parameters to narrow results
4. **Discovery Status:** Use `/universe/map` with `show_discovered_only=true` when authenticated

### For Galaxy/System Navigation

1. **Structure:** Use `/universe/structure` to get galaxy/system names
2. **Config:** Use `/universe/config` to understand universe dimensions
3. **Visibility:** Use `/universe/visibility` to show accessible areas

### For Planet Details

1. **List Own Planets:** Use `/planets` (authenticated)
2. **Search All Planets:** Use `/planets/search`
3. **Single Planet:** Use `/planets/{id}`

---

## Performance Considerations

1. **Use `/planets/search` for map rendering** - It's optimized with pagination and selective column loading
2. **Limit requests** - Use `limit=500` to reduce number of API calls
3. **Skip total count** - Only use `include_total=true` on first page
4. **Use hierarchical filters** - Filter by quadrant/sector/galaxy to reduce data transfer
5. **Cache galaxy/system names** - These change infrequently
6. **Lazy load details** - Only fetch planet details when user clicks/interacts

---

## Rate Limits

-   `/planets/search`: **300 requests/minute**
-   Other universe endpoints: **No rate limiting** (optimized for performance)

---

## Coordinate System

All planets have:

-   **X/Y coordinates** (absolute position on 2000×1000 grid)
-   **Hierarchical coordinates** (computed from X/Y):
    -   Quadrant (1-4)
    -   Sector (1-4)
    -   Galaxy (1-10)
    -   System (1-10)
    -   Planet (1-15)

The hierarchical coordinates are computed from X/Y, so filtering by hierarchy converts to X/Y ranges for efficient database queries.
