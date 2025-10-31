# Admin Panel API Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Permissions & Roles](#permissions--roles)
4. [Endpoint Categories](#endpoint-categories)
5. [Request/Response Examples](#requestresponse-examples)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Quick Reference](#quick-reference)

## Overview

This guide covers the Admin Panel API endpoints for managing the EmpireQuest game. All admin endpoints are prefixed with `/api/v1/admin/` and require authentication via Bearer token.

**Base URL:** `https://api.empirequest.com/api/v1` (production) or `http://localhost:8080/api/v1` (development)

All endpoints require:

-   Authentication header: `Authorization: Bearer {token}`
-   Admin role or appropriate permissions
-   JSON request bodies (where applicable)
-   JSON responses

---

## Authentication

### Getting Admin Access

1. **Login** using the standard auth endpoint:

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your-password"
}
```

Response:

```json
{
  "status": "ok",
  "data": {
    "user": { ... },
    "empire": { ... },
    "token": "1|abcdef1234567890"
  }
}
```

2. **Use the token** in all subsequent requests:

```
Authorization: Bearer 1|abcdef1234567890
```

### Checking Permissions

Before making admin requests, check if the user has admin access:

```javascript
// After login, check user roles
const userRoles = response.data.user.roles; // Array of role objects
const isAdmin = userRoles.some((role) => role.slug === "admin");

// Or check specific permissions
const hasPermission = await checkPermission("view_users");
```

---

## Permissions & Roles

### Available Roles

The system supports multiple admin roles with different permission levels:

-   **admin**: Full access to all endpoints
-   **moderator**: View and moderation capabilities
-   **support**: Limited view-only access

### Permission Enum

Each endpoint requires specific permissions. Common permissions include:

-   `view_users`, `edit_users`, `delete_users`
-   `view_empires`, `edit_empires`, `delete_empires`
-   `view_planets`, `edit_planets`, `delete_planets`
-   `view_fleets`, `delete_fleets`, `teleport_fleets`
-   `view_alliances`, `edit_alliances`, `delete_alliances`
-   `view_mail`, `delete_mail`
-   `view_ticks`, `process_ticks`, `rollback_ticks`
-   `modify_planet_resources`, `bulk_adjust_resources`
-   `view_statistics`
-   `view_combats`, `delete_combats`
-   `moderate_alliance_chat`

### Getting Available Permissions

```javascript
GET /api/v1/admin/roles

Response:
{
  "roles": [
    {
      "id": 1,
      "name": "Admin",
      "slug": "admin",
      "description": "Full system access",
      "permissions": ["view_users", "edit_users", ...],
      "user_count": 5
    }
  ]
}
```

---

## Endpoint Categories

### 1. User Management

#### List Users

```http
GET /admin/users?page=1&per_page=25&search=john&suspended=false
```

**Query Parameters:**

-   `page` (optional): Page number (default: 1)
-   `per_page` (optional): Items per page (default: 25, max: 100)
-   `search` (optional): Search by username or email
-   `suspended` (optional): Filter by suspended status (true/false)

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "last_login": "2025-10-31T10:00:00Z",
      "suspended_at": null,
      "empire": { ... },
      "roles": [ ... ]
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 150,
    "pages": 6
  }
}
```

#### Get User Details

```http
GET /admin/users/{id}
```

#### Update User

```http
PATCH /admin/users/{id}
Content-Type: application/json

{
  "email": "newemail@example.com",
  "username": "new_username",
  "suspended": false,
  "suspended_reason": "Account restored"
}
```

#### Delete User

```http
DELETE /admin/users/{id}
```

#### Reset User Password

```http
POST /admin/users/{id}/reset-password
Content-Type: application/json

{
  "new_password": "NewSecurePassword123!"
}
```

#### Assign Role to User

```http
POST /admin/users/{id}/roles
Content-Type: application/json

{
  "role_id": 2
}
```

#### Remove Role from User

```http
DELETE /admin/users/{id}/roles/{roleId}
```

#### Get User Activity Logs

```http
GET /admin/users/{id}/activity?page=1&per_page=25
```

---

### 2. Empire Management

#### List Empires

```http
GET /admin/empires?page=1&per_page=25&search=galactic
```

#### Get Empire Details

```http
GET /admin/empires/{id}
```

#### Update Empire

```http
PATCH /admin/empires/{id}
Content-Type: application/json

{
  "name": "Updated Empire Name",
  "description": "New description",
  "score": 150000
}
```

#### Delete Empire

```http
DELETE /admin/empires/{id}
```

#### Transfer Empire Ownership

```http
POST /admin/empires/{id}/transfer
Content-Type: application/json

{
  "user_id": 5
}
```

#### Reset Empire Score

```http
POST /admin/empires/{id}/reset-score
```

#### Get Empire History

```http
GET /admin/empires/{id}/history?page=1&per_page=25
```

---

### 3. Planet Management

#### List Planets

```http
GET /admin/planets?page=1&per_page=25&state=colony&empire_id=5
```

**Query Parameters:**

-   `state` (optional): Filter by state (`unsettled`, `colony`, `homeworld`)
-   `empire_id` (optional): Filter by empire

#### Get Planet Details

```http
GET /admin/planets/{id}
```

#### Update Planet

```http
PATCH /admin/planets/{id}
Content-Type: application/json

{
  "name": "New Planet Name",
  "state": "colony",
  "tellerium_balance": 50000,
  "krypton_balance": 30000,
  "mines": 15,
  "probes": 10
}
```

#### Delete Planet

```http
DELETE /admin/planets/{id}
```

#### Transfer Planet Ownership

```http
POST /admin/planets/{id}/transfer
Content-Type: application/json

{
  "empire_id": 3
}
```

#### Reset Planet

```http
POST /admin/planets/{id}/reset
```

Resets planet to unsettled state, clearing all resources and ownership.

#### Modify Planet Resources

```http
POST /admin/planets/{id}/resources
Content-Type: application/json

{
  "tellerium": 100000,
  "krypton": 50000,
  "reason": "Balance correction due to bug"
}
```

---

### 4. Fleet Management

#### List Fleets

```http
GET /admin/fleets?page=1&per_page=25&empire_id=5&status=in_transit
```

#### Delete Fleet

```http
DELETE /admin/fleets/{id}
```

#### Teleport Fleet

```http
POST /admin/fleets/{id}/teleport
Content-Type: application/json

{
  "quadrant": 2,
  "sector": 3,
  "galaxy": 5,
  "planet": 7
}
```

---

### 5. Alliance Management

#### List Alliances

```http
GET /admin/alliances?page=1&per_page=25
```

#### Update Alliance

```http
PATCH /admin/alliances/{id}
Content-Type: application/json

{
  "name": "Updated Alliance Name",
  "tag": "UAN",
  "fund_tellerium": 1000000,
  "fund_krypton": 800000
}
```

#### Delete Alliance

```http
DELETE /admin/alliances/{id}
```

#### Transfer Alliance Leadership

```http
POST /admin/alliances/{id}/transfer-leadership
Content-Type: application/json

{
  "empire_id": 10
}
```

#### Get Alliance Chat (Moderation)

```http
GET /admin/alliances/{id}/chat?page=1&per_page=25
```

#### Delete Alliance Chat Message

```http
DELETE /admin/alliances/{id}/chat/{messageId}
```

---

### 6. Moderation

#### List Mail Messages

```http
GET /admin/mail?page=1&per_page=25&from_empire_id=5&to_empire_id=10
```

#### Delete Mail Message

```http
DELETE /admin/mail/{id}
```

#### Delete Signal

```http
DELETE /admin/signals/{id}
```

---

### 7. Tick Management

#### List Tick History

```http
GET /admin/ticks?page=1&per_page=25
```

#### Get Tick Details

```http
GET /admin/ticks/{number}
```

#### Rollback Tick

```http
POST /admin/ticks/rollback
Content-Type: application/json

{
  "tick_number": 1234,
  "reason": "Bug fix required"
}
```

**Note:** This endpoint returns a 501 (Not Implemented) status as the rollback functionality needs to be implemented in the TickProcessor service.

---

### 8. Resource Management

#### Bulk Adjust Resources

```http
POST /admin/resources/bulk-adjust
Content-Type: application/json

{
  "adjustments": [
    {
      "planet_id": 1,
      "tellerium": 50000,
      "krypton": 30000
    },
    {
      "planet_id": 2,
      "tellerium": -10000,
      "krypton": -5000
    }
  ],
  "reason": "Global balance correction"
}
```

---

### 9. Statistics

#### Get Detailed Statistics

```http
GET /admin/statistics/detailed
```

**Response:**

```json
{
    "users": {
        "total": 150,
        "active": 120,
        "suspended": 5,
        "with_empires": 145
    },
    "empires": {
        "total": 145,
        "active": 120,
        "in_alliances": 50
    },
    "planets": {
        "total": 1000,
        "colonized": 800,
        "unsettled": 200,
        "homeworlds": 145,
        "colonies": 655
    },
    "alliances": {
        "total": 15,
        "average_members": 3.3
    },
    "fleets": {
        "total": 500,
        "in_transit": 150,
        "stationed": 350
    },
    "resources": {
        "total_tellerium": 50000000,
        "total_krypton": 40000000,
        "total_mines": 5000,
        "total_probes": 4000
    },
    "tick": {
        "current": 1234,
        "next_eta": "2025-10-31T15:00:00Z"
    }
}
```

---

### 10. Combat Management

#### List Combat Logs

```http
GET /admin/combats?page=1&per_page=25&tick_number=1234
```

#### Delete Combat Log

```http
DELETE /admin/combats/{id}
```

---

## Request/Response Examples

### Example: Updating a User

```javascript
// Frontend implementation example
async function updateUser(userId, updates) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to update user");
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
}

// Usage
await updateUser(1, {
    email: "newemail@example.com",
    suspended: false,
});
```

### Example: Bulk Resource Adjustment

```javascript
async function bulkAdjustResources(adjustments, reason) {
    const response = await fetch(
        `${API_BASE_URL}/admin/resources/bulk-adjust`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                adjustments: adjustments,
                reason: reason,
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Bulk adjustment failed");
    }

    return await response.json();
}

// Usage
await bulkAdjustResources(
    [
        { planet_id: 1, tellerium: 50000, krypton: 30000 },
        { planet_id: 2, tellerium: 100000 },
    ],
    "Compensation for server downtime"
);
```

### Example: Paginated List with Filters

```javascript
async function listUsers(filters = {}) {
    const params = new URLSearchParams({
        page: filters.page || 1,
        per_page: filters.perPage || 25,
        ...(filters.search && { search: filters.search }),
        ...(filters.suspended !== undefined && {
            suspended: filters.suspended,
        }),
    });

    const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch users");
    }

    return await response.json();
}

// Usage
const users = await listUsers({
    page: 1,
    perPage: 50,
    search: "john",
    suspended: false,
});
```

---

## Error Handling

### Standard Error Response Format

All endpoints return errors in a consistent format:

```json
{
    "status": "error",
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
        // Validation errors or additional details
    }
}
```

### Common HTTP Status Codes

-   **200**: Success
-   **201**: Created (for POST endpoints)
-   **204**: No Content (for DELETE endpoints)
-   **400**: Bad Request (validation errors)
-   **401**: Unauthorized (missing or invalid token)
-   **403**: Forbidden (insufficient permissions)
-   **404**: Not Found (resource doesn't exist)
-   **422**: Unprocessable Entity (validation failed)
-   **500**: Internal Server Error
-   **501**: Not Implemented (e.g., tick rollback)

### Example Error Handling

```javascript
async function handleApiRequest(requestFn) {
    try {
        const response = await requestFn();

        if (!response.ok) {
            const error = await response.json();

            switch (response.status) {
                case 401:
                    // Redirect to login
                    window.location.href = "/login";
                    break;
                case 403:
                    // Show permission denied message
                    throw new Error(
                        "You do not have permission to perform this action"
                    );
                case 404:
                    throw new Error("Resource not found");
                case 422:
                    // Show validation errors
                    const validationErrors = error.details || {};
                    throw new Error(
                        Object.values(validationErrors).flat().join(", ")
                    );
                default:
                    throw new Error(error.message || "An error occurred");
            }
        }

        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}
```

---

## Best Practices

### 1. Permission Checking

Always check permissions before enabling admin features:

```javascript
async function checkPermission(permission) {
    // Check if user has required permission
    // This could be done client-side based on user roles
    // or by calling a permission endpoint
    const user = getCurrentUser();
    return user.roles.some((role) => role.permissions?.includes(permission));
}

// Usage
if (await checkPermission("view_users")) {
    // Show user management UI
}
```

### 2. Pagination

Always implement pagination for list endpoints:

```javascript
function usePaginatedList(endpoint, filters = {}) {
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${endpoint}?page=${page}&per_page=25&${new URLSearchParams(
                    filters
                )}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const result = await response.json();
            setData(result.data);
            setMeta(result.meta);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, filters]);

    return { data, meta, loading, setPage };
}
```

### 3. Audit Logging

All admin actions are automatically logged. Always provide a reason for significant actions:

```javascript
// Good: Includes reason
await updateUser(userId, {
    suspended: true,
    suspended_reason: "Violation of terms of service - reported by user #123",
});

// Better: Even for non-destructive actions
await updatePlanetResources(planetId, {
    tellerium: 100000,
    reason: "Compensation for server downtime on 2025-10-30",
});
```

### 4. Optimistic Updates

For better UX, implement optimistic updates where appropriate:

```javascript
async function updateUserOptimistic(userId, updates) {
    // Update UI immediately
    const previousState = userData;
    setUserData({ ...userData, ...updates });

    try {
        // Then sync with server
        await updateUser(userId, updates);
    } catch (error) {
        // Rollback on error
        setUserData(previousState);
        throw error;
    }
}
```

### 5. Request Debouncing

Debounce search inputs to avoid excessive API calls:

```javascript
import { debounce } from "lodash";

const debouncedSearch = debounce(async (searchTerm) => {
    await listUsers({ search: searchTerm });
}, 300);

// Usage in input handler
<input onChange={(e) => debouncedSearch(e.target.value)} />;
```

### 6. Error Boundaries

Implement error boundaries in React or similar error handling:

```javascript
// React example
class AdminErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log to error tracking service
        console.error("Admin panel error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <ErrorFallback />;
        }

        return this.props.children;
    }
}
```

---

## Quick Reference

### Endpoint Summary

| Method | Endpoint                                    | Description           | Permission Required            |
| ------ | ------------------------------------------- | --------------------- | ------------------------------ |
| GET    | `/admin/users`                              | List users            | `view_users`                   |
| GET    | `/admin/users/{id}`                         | Get user details      | `view_users`                   |
| PATCH  | `/admin/users/{id}`                         | Update user           | `edit_users`                   |
| DELETE | `/admin/users/{id}`                         | Delete user           | `delete_users`                 |
| POST   | `/admin/users/{id}/reset-password`          | Reset password        | `reset_passwords`              |
| POST   | `/admin/users/{id}/roles`                   | Assign role           | `manage_user_roles`            |
| DELETE | `/admin/users/{id}/roles/{roleId}`          | Remove role           | `manage_user_roles`            |
| GET    | `/admin/users/{id}/activity`                | User activity logs    | `view_users`                   |
| GET    | `/admin/empires`                            | List empires          | `view_empires`                 |
| GET    | `/admin/empires/{id}`                       | Get empire details    | `view_empires`                 |
| PATCH  | `/admin/empires/{id}`                       | Update empire         | `edit_empires`                 |
| DELETE | `/admin/empires/{id}`                       | Delete empire         | `delete_empires`               |
| POST   | `/admin/empires/{id}/transfer`              | Transfer empire       | `transfer_empires`             |
| POST   | `/admin/empires/{id}/reset-score`           | Reset score           | `reset_empire_scores`          |
| GET    | `/admin/empires/{id}/history`               | Empire history        | `view_empires`                 |
| GET    | `/admin/planets`                            | List planets          | `view_planets`                 |
| GET    | `/admin/planets/{id}`                       | Get planet details    | `view_planets`                 |
| PATCH  | `/admin/planets/{id}`                       | Update planet         | `edit_planets`                 |
| DELETE | `/admin/planets/{id}`                       | Delete planet         | `delete_planets`               |
| POST   | `/admin/planets/{id}/transfer`              | Transfer planet       | `transfer_planets`             |
| POST   | `/admin/planets/{id}/reset`                 | Reset planet          | `edit_planets`                 |
| POST   | `/admin/planets/{id}/resources`             | Modify resources      | `modify_planet_resources`      |
| GET    | `/admin/fleets`                             | List fleets           | `view_fleets`                  |
| DELETE | `/admin/fleets/{id}`                        | Delete fleet          | `delete_fleets`                |
| POST   | `/admin/fleets/{id}/teleport`               | Teleport fleet        | `teleport_fleets`              |
| GET    | `/admin/alliances`                          | List alliances        | `view_alliances`               |
| PATCH  | `/admin/alliances/{id}`                     | Update alliance       | `edit_alliances`               |
| DELETE | `/admin/alliances/{id}`                     | Delete alliance       | `delete_alliances`             |
| POST   | `/admin/alliances/{id}/transfer-leadership` | Transfer leadership   | `transfer_alliance_leadership` |
| GET    | `/admin/alliances/{id}/chat`                | Get alliance chat     | `moderate_alliance_chat`       |
| DELETE | `/admin/alliances/{id}/chat/{messageId}`    | Delete chat message   | `moderate_alliance_chat`       |
| GET    | `/admin/mail`                               | List mail messages    | `view_mail`                    |
| DELETE | `/admin/mail/{id}`                          | Delete mail           | `delete_mail`                  |
| DELETE | `/admin/signals/{id}`                       | Delete signal         | `delete_signals`               |
| GET    | `/admin/ticks`                              | List ticks            | `view_ticks`                   |
| GET    | `/admin/ticks/{number}`                     | Get tick details      | `view_ticks`                   |
| POST   | `/admin/ticks/rollback`                     | Rollback tick         | `rollback_ticks`               |
| POST   | `/admin/resources/bulk-adjust`              | Bulk adjust resources | `bulk_adjust_resources`        |
| GET    | `/admin/statistics/detailed`                | Get statistics        | `view_statistics`              |
| GET    | `/admin/combats`                            | List combat logs      | `view_combats`                 |
| DELETE | `/admin/combats/{id}`                       | Delete combat log     | `delete_combats`               |
| GET    | `/admin/roles`                              | List roles            | (Any admin)                    |

### Common Response Patterns

**Success with Data:**

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 100,
    "pages": 4
  }
}
```

**Success with Single Resource:**

```json
{
  "message": "Operation successful",
  "user": { ... }
}
```

**Error:**

```json
{
    "status": "error",
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}
}
```

---

## Support & Resources

-   **API Documentation**: See OpenAPI/Swagger docs at `/api/documentation`
-   **Base URL**: Configure based on environment (production/development)
-   **Rate Limiting**: Be aware of rate limits (check response headers)
-   **WebSocket Events**: Admin actions may trigger WebSocket events for real-time updates

---

## Version History

-   **v1.0.0** (2025-10-31): Initial admin panel API implementation

---

For questions or issues, contact the backend team or refer to the main API documentation.
