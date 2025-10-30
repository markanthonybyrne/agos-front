# EmpireQuest Code Documentation

This document provides detailed information about the EmpireQuest codebase architecture, design patterns, and implementation details.

## 🏗 Architecture Overview

EmpireQuest follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│                Frontend                 │
│         (WebSocket Client)              │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│              API Layer                  │
│         (Controllers/Routes)            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│            Service Layer                │
│        (Business Logic)                 │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│            Data Layer                   │
│        (Models/Repositories)            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           Database Layer                │
│        (PostgreSQL/Redis)               │
└─────────────────────────────────────────┘
```

## 📁 Directory Structure

```
app/
├── Console/
│   ├── Commands/
│   │   ├── ProcessTickCommand.php       # Manual tick processing
│   │   └── StartReverbCommand.php       # WebSocket server
│   └── Kernel.php
├── Events/
│   ├── TickProcessed.php                # Tick completion event
│   ├── FleetArrived.php                 # Fleet arrival event
│   ├── CombatResolved.php               # Combat resolution event
│   ├── EmpireUpdated.php                # Empire data change event
│   ├── PlanetUpdated.php                # Planet resource update event
│   ├── NewsCreated.php                  # News creation event
│   └── MailReceived.php                 # Mail received event
├── Http/
│   ├── Controllers/
│   │   ├── Controller.php               # Base controller with OpenAPI docs
│   │   └── Api/
│   │       ├── AuthController.php       # Authentication endpoints
│   │       ├── EmpireController.php     # Empire management
│   │       ├── PlanetController.php     # Planet operations
│   │       ├── FleetController.php      # Fleet management
│   │       ├── SignalController.php     # Signal scanning
│   │       ├── MailController.php       # Messaging system
│   │       ├── AllianceController.php   # Alliance management
│   │       └── AdminController.php      # Administrative functions
│   ├── Middleware/
│   │   └── GameAuthMiddleware.php       # Custom auth & rate limiting
│   └── Resources/                        # API response transformers
├── Models/
│   ├── User.php                         # User model with Sanctum
│   ├── Empire.php                       # Empire model
│   ├── Planet.php                       # Planet model
│   ├── Fleet.php                        # Fleet model
│   ├── Alliance.php                     # Alliance model
│   ├── Mail.php                         # Mail model
│   ├── News.php                         # News model
│   ├── Signal.php                       # Signal model
│   ├── CombatLog.php                    # Combat log model
│   ├── TickLog.php                      # Tick log model
│   ├── AuditLog.php                     # Audit log model
│   └── Definitions/                     # Game definition models
│       ├── ShipDefinition.php
│       ├── FacilityDefinition.php
│       ├── ResearchDefinition.php
│       └── DefenceDefinition.php
├── Services/
│   ├── TickProcessor.php                # Core tick processing
│   ├── ResourceProductionService.php    # Resource calculations
│   ├── MineProbeCostService.php         # Cost calculations
│   ├── FleetTravelService.php           # Travel time calculations
│   ├── ScoreService.php                 # Empire scoring
│   ├── CombatResolver.php               # Combat simulation
│   └── SignalScannerService.php         # Signal scanning
└── Providers/
    ├── AppServiceProvider.php
    ├── AuthServiceProvider.php
    ├── BroadcastServiceProvider.php
    └── EventServiceProvider.php
```

## 🔧 Core Services

### TickProcessor

The heart of the game engine, responsible for processing game ticks.

**Key Features:**

-   Redis-based distributed locking
-   Idempotent processing
-   Chunked processing for performance
-   Event broadcasting

**Main Methods:**

```php
public function processTick(): bool
public function getCurrentTick(): int
public function getNextTickETA(): Carbon
private function isTickProcessed(int $tickNumber): bool
private function acquireProcessingLock(): bool
private function releaseProcessingLock(): bool
```

**Processing Flow:**

1. Acquire Redis lock
2. Check if tick already processed
3. Process resource production
4. Handle fleet arrivals
5. Resolve combat encounters
6. Recalculate empire scores
7. Log tick completion
8. Broadcast events
9. Release lock

### CombatResolver

Deterministic combat resolution using seeded RNG.

**Key Features:**

-   Seeded random number generation
-   Init-phase based combat rounds
-   Special ability handling
-   Detailed combat logging

**Combat Formula:**

```php
$seed = hash('sha256', $tickNumber . $battleId . $serverSalt);
$rng = new SeededRandom($seed);
```

**Combat Rounds:**

1. Calculate initiative order
2. Select targets (class priority → random)
3. Calculate damage (armour vs gun_power)
4. Apply special abilities
5. Handle boarding mechanics
6. Log results

### ResourceProductionService

Handles resource production calculations and updates.

**Production Formulas:**

```php
// Tellerium production
$tellerium = ($mines * 1000) + ($planets * 250);

// Krypton production
$krypton = ($probes * 750) + ($planets * 250);

// Molecular extraction bonus (20%)
$bonus = 1 + (0.20 * $molecularExtractionLevel);
```

### ScoreService

Calculates and updates empire scores based on assets.

**Score Formula:**

```php
$score =
    ($shipWorth / 10) +           // Ship value
    ($defenceWorth / 10) +        // Defence value
    ($probes * 500) +             // Probe value
    ($mines * 500) +              // Mine value
    ($planets * 100000) +         // Planet value
    $facilityWorth;               // Facility value
```

## 🗄 Database Design

### Core Tables

#### users

```sql
- id (primary key)
- username (unique)
- email (unique)
- password (hashed)
- last_login (timestamp)
- created_at, updated_at
```

#### empires

```sql
- id (primary key)
- user_id (foreign key)
- name (unique)
- homeworld_planet_id (foreign key)
- score (integer)
- planets_owned (integer)
- alliance_id (foreign key, nullable)
- created_at, updated_at
```

#### planets

```sql
- id (primary key)
- name (string)
- quadrant, sector, galaxy, planet (coordinates)
- owner_empire_id (foreign key, nullable)
- state (enum: unsettled, colony, homeworld)
- mines, probes (integer)
- tellerium_balance, krypton_balance (bigint)
- facilities (jsonb)
- defence_grid (jsonb)
- created_at, updated_at
```

#### fleets

```sql
- id (primary key)
- owner_empire_id (foreign key)
- ships (jsonb)
- origin_planet_id (foreign key)
- destination_quadrant, destination_sector, destination_galaxy, destination_planet
- departure_tick, arrival_tick (integer)
- status (enum: stationed, in_transit, arrived)
- order_type (enum: attack, defend, station, return)
- auto_return_on_failure (boolean)
- created_at, updated_at
```

### JSONB Fields

Several tables use PostgreSQL's JSONB for flexible data storage:

#### facilities (planets table)

```json
{
    "mines": 10,
    "probes": 5,
    "broadcast_centers": 2,
    "molecular_extraction": 1
}
```

#### ships (fleets table)

```json
{
    "fighters": 10,
    "corvettes": 2,
    "frigates": 1
}
```

#### members (alliances table)

```json
{
    "1": { "role": "leader", "joined_at": "2024-01-01T00:00:00Z" },
    "2": { "role": "member", "joined_at": "2024-01-01T01:00:00Z" }
}
```

## 🔌 WebSocket Architecture

### Laravel Reverb Integration

EmpireQuest uses Laravel Reverb for WebSocket functionality:

**Configuration:**

```php
// config/reverb.php
'servers' => [
    'reverb' => [
        'host' => '0.0.0.0',
        'port' => 8080,
        'path' => '',
        'options' => ['tls' => []],
    ],
],
```

### Broadcasting Channels

#### Private Channels

-   `private-empire.{empireId}` - Empire-specific notifications
-   `private-alliance.{allianceId}` - Alliance communications

#### Public Channels

-   `public-galaxy.{quadrant}.{sector}.{galaxy}` - Galaxy-wide events
-   `public.tick` - Global tick updates

### Event Broadcasting

Events are automatically broadcast when models are created/updated:

```php
// In Mail model
protected static function booted(): void
{
    static::created(function (Mail $mail) {
        event(new MailReceived($mail));
    });
}
```

## 🧪 Testing Architecture

### Test Structure

```
tests/
├── Unit/                    # Service class tests
│   ├── TickProcessorTest.php
│   ├── CombatResolverTest.php
│   └── ResourceProductionServiceTest.php
├── Feature/                 # API endpoint tests
│   ├── AuthControllerTest.php
│   ├── EmpireControllerTest.php
│   └── PlanetControllerTest.php
└── Integration/             # End-to-end tests
    └── TickProcessingIntegrationTest.php
```

### Factory Pattern

Laravel factories generate test data:

```php
// UserFactory
public function definition(): array
{
    return [
        'username' => fake()->unique()->userName(),
        'email' => fake()->unique()->safeEmail(),
        'password' => Hash::make('password'),
        'last_login' => fake()->optional(0.8)->dateTimeBetween('-30 days', 'now'),
    ];
}
```

### Database Testing

Tests use SQLite in-memory database for speed:

```php
// phpunit.xml
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
```

## 🔒 Security Implementation

### Authentication

Laravel Sanctum provides API token authentication:

```php
// Middleware protection
Route::middleware('auth:sanctum')->group(function () {
    // Protected routes
});
```

### Rate Limiting

Custom middleware implements game-specific rate limits:

```php
// GameAuthMiddleware
public function handle($request, Closure $next, $action = null)
{
    $user = $request->user();
    $empire = $user->empire;

    // Rate limiting logic
    $this->checkRateLimit($user, $action);

    return $next($request);
}
```

### Anti-cheat Measures

Server-side validation prevents cheating:

```php
// Cost validation
public function validateMineCost(Planet $planet, int $quantity): array
{
    $expectedCost = $this->calculateMineCost($planet->mines, $quantity);
    $actualCost = $request->input('cost');

    if ($expectedCost !== $actualCost) {
        throw new ValidationException('Cost mismatch detected');
    }
}
```

## 📊 Performance Optimizations

### Database Indexing

Strategic indexes for common queries:

```sql
-- Coordinate lookups
CREATE INDEX idx_planets_coordinates ON planets(quadrant, sector, galaxy, planet);

-- Empire lookups
CREATE INDEX idx_planets_owner ON planets(owner_empire_id);
CREATE INDEX idx_fleets_owner ON fleets(owner_empire_id);

-- Score rankings
CREATE INDEX idx_empires_score ON empires(score DESC);
```

### Redis Caching

Frequently accessed data cached in Redis:

```php
// Score caching
Redis::setex("empire:{$empireId}:score", 300, $score);

// Tick data
Redis::set("game:current_tick", $tickNumber);
```

### Queue Processing

Heavy operations queued for background processing:

```php
// Tick processing job
ProcessTickJob::dispatch()->onQueue('tick');

// Combat resolution job
ResolveCombatJob::dispatch($combatId)->onQueue('combat');
```

## 🔄 Deployment Architecture

### Lando Development

Local development environment:

```yaml
# .lando.yml
services:
    appserver:
        type: php:8.3
        webroot: public
        xdebug: true
    database:
        type: postgresql:15
    cache:
        type: redis:6
    reverb:
        type: node:18
        command: reverb start --host=0.0.0.0 --port=8080
```

### Deployer Production

Automated deployment with Deployer:

```php
// deploy.php
host('production')
    ->set('hostname', 'api.empirequest.com')
    ->set('deploy_path', '/var/www/agos')
    ->set('branch', 'main');
```

### Supervisor Workers

Queue workers managed by Supervisor:

```ini
[program:empirequest-worker]
command=php /var/www/agos/current/artisan queue:work redis
numprocs=4
autostart=true
autorestart=true
```

## 📈 Monitoring & Logging

### Application Logs

Structured logging for debugging:

```php
Log::info('Tick processed', [
    'tick_number' => $tickNumber,
    'duration' => $duration,
    'planets_processed' => $planetCount,
    'fleets_processed' => $fleetCount,
]);
```

### Audit Logging

Sensitive actions logged for security:

```php
AuditLog::create([
    'user_id' => $user->id,
    'empire_id' => $empire->id,
    'action' => 'fleet_created',
    'details' => $fleetData,
    'ip_address' => $request->ip(),
]);
```

### Performance Metrics

Key metrics tracked:

-   Tick processing duration
-   Database query performance
-   Queue processing times
-   WebSocket connection count
-   API response times

## 🚀 Future Enhancements

### Planned Features

1. **Advanced Analytics**

    - Real-time dashboards
    - Performance metrics
    - Player behavior analysis

2. **Mobile API**

    - Optimized endpoints
    - Push notifications
    - Offline support

3. **Advanced Combat**

    - 3D combat visualization
    - Tactical positioning
    - Fleet formations

4. **Economic System**

    - Trade routes
    - Market dynamics
    - Resource trading

5. **Diplomatic System**
    - Treaties and alliances
    - Trade agreements
    - War declarations

### Technical Improvements

1. **Microservices Architecture**

    - Service decomposition
    - API gateway
    - Service mesh

2. **Event Sourcing**

    - Event store
    - CQRS pattern
    - Audit trail

3. **Machine Learning**

    - AI opponents
    - Behavior prediction
    - Balance optimization

4. **Blockchain Integration**
    - NFT assets
    - Decentralized governance
    - Cryptocurrency rewards

---

This documentation provides a comprehensive overview of the EmpireQuest codebase. For specific implementation details, refer to the source code and inline comments.
