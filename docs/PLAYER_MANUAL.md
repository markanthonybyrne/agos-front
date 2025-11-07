# Astralus Player Manual

Complete guide to gameplay, strategy, and tactics for Astralus.

## Table of Contents

1. [Welcome, Commander](#welcome-commander)
2. [Getting Started](#getting-started)
3. [Core Gameplay](#core-gameplay)
4. [Resources & Production](#resources--production)
5. [Ships & Combat](#ships--combat)
6. [Defences & Facilities](#defences--facilities)
7. [Research & Technology](#research--technology)
8. [Fleet Movement & Travel](#fleet-movement--travel)
9. [Colonization & Exploration](#colonization--exploration)
10. [Visibility & Fog of War](#visibility--fog-of-war)
11. [Alliances](#alliances)
12. [Galaxy Incidents](#galaxy-incidents)
13. [NPC Empires](#npc-empires)
14. [Market System](#market-system)
15. [Quantum Credits & Boosters](#quantum-credits--boosters)
16. [Strategy Guide](#strategy-guide)
17. [Advanced Tactics](#advanced-tactics)
18. [Reference Tables](#reference-tables)
19. [Tips & Best Practices](#tips--best-practices)

---

## Welcome, Commander

### Prologue: The Fractured Stars

The Great Silence came without warning. For millennia, the Galactic Consortium maintained peace across the known universe. The **Tellerium-Krypton Accord** bound a thousand worlds together, sharing resources and protecting the weak. But greed knows no bounds, and when the Consortium's central authority collapsed under the weight of corruption and ambition, the accord shattered like glass.

Now, you are alone in the void. The remnants of the Consortium scattered across twenty regions, each containing countless star systems teeming with planets—some barren, some rich with resources, all waiting to be claimed. The old rules are gone. The strong prey upon the weak. Alliances form and break like tides.

You are a **Commander**, awakened from cryogenic stasis to find your homeworld isolated and vulnerable. Your people look to you for salvation, for conquest, for survival. But you are not the only one who has awakened.

This is your moment, Commander. The stars await your command.

### What is Astralus?

Astralus is a tick-based grand strategy browser game where you:

-   Build and command fleets of starships
-   Colonize planets across a vast galaxy
-   Research advanced technologies
-   Construct facilities and defences
-   Form alliances or fight alone
-   Compete for dominance in a living universe

The game runs on **server-driven ticks** (default: 30 minutes). Every tick, resource production, construction, fleet movement, and combat are processed automatically.

### Key Concepts

**Empire**: Your player-controlled entity with a homeworld and colonies.

**Tick System**: The game progresses in discrete time steps called "ticks". Every action takes time measured in ticks.

**Universe Structure**: The galaxy is organized into 20 Regions, each containing 125 Systems, with ~8,000 planets total distributed in a spiral galaxy pattern.

**Resources**: Three main resources - Tellerium (manufacturing), Krypton (fuel), and Dark Matter (advanced/exotic).

**Combat**: Deterministic, turn-based fleet combat with detailed ship statistics and abilities.

**Visibility**: Fog of war system - you only see what you've discovered or unlocked via research.

---

## Getting Started

### Registration & First Login

1. **Register**: Create an account with username, email, password, and empire name
2. **Homeworld Assignment**: Your empire starts with one homeworld planet in Region 1-3
3. **Initial Resources**: Start with minimal resources - must build infrastructure
4. **Initial Visibility**: Small square area around homeworld is visible (fog of war)

### First Hour Checklist

1. **Explore Your Homeworld**:

    - View planet coordinates and type
    - Check initial resource balances
    - Review available construction options

2. **Build Infrastructure**:

    - Purchase Mines (for Tellerium production)
    - Purchase Probes (for Krypton production)
    - Build Research Lab (enables research)

3. **Start Research**:

    - Research `Military Doctrine` (unlocks Basic Shipyard)
    - Research `Basic Combat` (unlocks Assault Fighter)

4. **Build Facilities**:

    - Build Basic Shipyard (enables ship production)

5. **Build Your First Fleet**:

    - Build Scout Fighters (for exploration)
    - Build Assault Fighters (for basic combat)

6. **Explore Nearby Systems**:

    - Use Signal Scanning to discover nearby systems
    - Find colonizable planets within 2 regions distance

7. **Colonize Your First Planet**:
    - Research `Colony Management` (required for colonization)
    - Build Colony Ship
    - Send fleet to colonize nearby habitable planet

### Holopad Interface

The Holopad is your command center. Key sections:

-   **Message of the Day**: Developer announcements
-   **Foreign Fleets**: Incoming/outgoing fleets near your planets
-   **Planets**: List of your planets with resources and status
-   **Research**: Active and available research projects
-   **Facilities**: Construction queue and built facilities
-   **Fleets**: Stationed and in-transit fleets
-   **Fleet Construction**: Queued ship orders
-   **Orbital Defence**: Defences protecting your planets
-   **Orbital Construction**: Queued defence orders
-   **Resources**: Mine/probe counts and production rates

---

## Core Gameplay

### Tick System

**Tick Interval**: Default 30 minutes (configurable by server)

**What Happens Each Tick**:

1. Resource production (mines, probes, facilities)
2. Construction progress (facilities, ships, defences, research)
3. Fleet movement (fleets advance toward destinations)
4. Fleet arrivals (fleets reach destinations, combat occurs)
5. Colonization processing (fleet colonization completes)
6. Incident processing (galaxy incidents update)
7. Market processing (order matching, price updates)
8. Score recalculation (empire scores updated)

**Idempotency**: All operations are idempotent - same inputs always produce same results. This ensures fair gameplay and prevents exploits.

### Empire Management

**Empire Score**: Calculated from:

-   Ship value (total worth / 10)
-   Defence value (total worth / 10)
-   Probes (quantity × 500)
-   Mines (quantity × 500)
-   Planets (quantity × 100,000)
-   Facility value (total worth)

**Empire Limits**:

-   Maximum 5 planets (1 homeworld + 4 colonies)
-   No limit on fleets, ships, or defences
-   No limit on facilities per planet

**Empire Visibility**:

-   Starts with small square area around homeworld visible
-   Expand visibility through research and signal scanning
-   Fog of war hides unexplored areas

### Planet Management

**Planet Types**: 25 distinct types from Terran (ideal) to Quantum (exotic)

**Planet States**:

-   `unsettled`: Uncolonized, available for colonization
-   `colony`: Colonized by an empire
-   `homeworld`: Empire's starting planet (cannot be captured)

**Planet Ownership**:

-   Planets can be captured through combat
-   Owner changes when planet is successfully attacked
-   Homeworlds cannot be captured

**Planet Resources**:

-   Resources stored per-planet
-   Can be transferred between your planets
-   Production calculated per-planet

---

## Resources & Production

### Resource Types

**Tellerium (T)**:

-   Manufacturing resource
-   Used for building ships, facilities, defences
-   Produced by mines and production facilities

**Krypton (K)**:

-   Fuel resource
-   Used for fleet movement, research, signals
-   Produced by probes and extraction facilities

**Dark Matter (DM)**:

-   Exotic resource (Era 5+)
-   Used for advanced facilities and ships
-   Produced by Singularity Reactor Core

### Base Production

**Tellerium**: `(Mines × 1,000) + (Planets × 250)` + facility production

**Krypton**: `(Probes × 750) + (Planets × 250)` + facility production

**Example**:

-   10 Mines + 2 Planets = (10 × 1,000) + (2 × 250) = 10,500 T/tick
-   8 Probes + 2 Planets = (8 × 750) + (2 × 250) = 6,500 K/tick

### Facility Production

Many facilities produce resources per tick:

**Early Game**:

-   Reclaimed Surface Mines: +10 T/tick
-   Atmospheric Probe Nets: +8 K/tick
-   Crude Extractor: +6 T + 6 K/tick

**Mid Game**:

-   Deep-Core Extraction Facility: +35 T + 20 K/tick
-   Molecular Extraction Facility: +100 T/tick

**Late Game**:

-   Automated Production Complex: +250 T/tick
-   Singularity Reactor Core: +1,000 T + 50 DM/tick

### Production Multipliers

**Research Bonuses**:

-   Resource Optimization: +10% Tellerium production
-   Industrial Automation: +20% per-tick production (global)

**Booster Multipliers**:

-   Production Booster: +25% production for 24 hours (purchased with Quantum Credits)

**Multipliers are multiplicative** - stack multiple bonuses for significant increases.

### Upkeep Costs

Many facilities consume resources per tick as upkeep:

**Examples**:

-   Research Lab: 50 T + 50 K/tick
-   Advanced Shipyard: 200 T + 150 K/tick
-   Quantum Research Facility: 500 T + 500 K/tick

**Important**: Ensure production exceeds upkeep or facilities will shut down.

### Resource Transfer

Transfer resources between your planets:

-   Instant transfer (no travel time)
-   No transfer cost
-   Useful for consolidating resources for large purchases

---

## Ships & Combat

### Ship Classes

Ships are organized into 7 classes:

1. **Fighter**: Fast, light ships (Era 2)
2. **Corvette**: Mid-sized patrol vessels (Era 3)
3. **Frigate**: Heavy combat ships (Era 3)
4. **Cruiser**: Large capital ships (Era 4)
5. **Carrier**: Ship deployment platforms (Era 4)
6. **Mothership**: Massive command vessels (Era 5)
7. **Fortress**: Immobile defensive platforms (Era 5)

### Ship Statistics

**Armour**: Hit points (damage capacity)

**Gun Power**: Damage per shot

**Accuracy**: Hit chance (0.00 to 1.00)

**Agility**: Evasion chance (0.00 to 1.00)

**Init (Initiative)**: Lower numbers fire first in combat

**Travel Ticks**: Base travel time between planets

**Build Time**: Ticks required to construct

### Ship Abilities

Ships can have special abilities:

-   **scout**: Enhanced reconnaissance
-   **assault**: Bonus damage vs specific targets
-   **patrol**: Defensive patrol patterns
-   **defensive**: Enhanced defensive capabilities
-   **strike**: High-damage precision strikes
-   **escort**: Protects other ships
-   **battle**: Bonus in fleet combat
-   **heavy_weapons**: Devastating firepower
-   **carrier**: Can deploy fighters
-   **fighter_deployment**: Launches fighter squadrons
-   **command**: Fleet coordination bonuses
-   **fortress**: Immobile defensive platform
-   **quantum_weapons**: Advanced energy weapons
-   **planetary_capture**: Enables planet capture

### Combat System

**Deterministic Resolution**:

-   Combat outcomes are deterministic (same inputs = same results)
-   Uses seeded RNG for reproducibility
-   Ensures fair gameplay

**Combat Phases**:

1. **Initiative Calculation**: Ships ordered by initiative
2. **Target Selection**: Priority by class, then random
3. **Damage Calculation**: gun_power vs armour
4. **Special Abilities**: Ion disable, mines instant kill, stinger boarding
5. **Board Mechanics**: Stingers can capture ships
6. **Victory Determination**: Last side standing wins

**Combat Example**:

```
Fleet: 10 Assault Fighters (Armour: 8, Gun Power: 15)
Defence: 5 Ion Cannons (Armour: 50, Gun Power: 30)

Round 1: Fighters fire first (Init 18 vs 12)
- Fighters deal 150 total damage (10 × 15)
- Ion Cannons: 50 armour - 150 damage = destroyed

Result: Fleet wins, 0 losses
```

### Ship Production

**Build Time**:

-   Ships built in parallel (up to 10 at normal speed)
-   Large quantities use diminishing returns
-   Faster ships build faster

**Costs**:

-   Vary by ship class and era
-   Early ships: 1,000-5,000 T + K
-   Late ships: 100,000+ T + K

**Shipyard Requirements**:

-   Basic Shipyard: Fighters only
-   Advanced Shipyard: Corvettes, Frigates
-   Capital Shipyard: Cruisers, Carriers
-   Quantum Shipyard: Motherships, Fortresses

### Fleet Composition

**Optimal Compositions**:

**Early Game** (Scout/Exploration):

-   5 Scout Fighters
-   10 Assault Fighters

**Mid Game** (Balanced):

-   20 Assault Fighters
-   10 Strike Corvettes
-   5 Battle Frigates

**Late Game** (Power):

-   50+ Assault Fighters
-   20+ Strike Corvettes
-   10+ Battle Frigates
-   5+ Battle Cruisers
-   1 Carrier (deploy fighters)

**Specialized**:

-   **Defence Fleet**: Mix of defensive ships (Patrol Corvettes, Defence Frigates)
-   **Strike Fleet**: High-damage ships (Strike Corvettes, Strike Frigates)
-   **Carrier Fleet**: Carriers with fighter deployments

---

## Defences & Facilities

### Defence Types

**Orbital Defences**:

-   Fixed defences protecting planets
-   Built per-planet
-   Cannot move
-   Destroyed in combat

**Defence Classes**:

-   **Basic**: Ion Cannons, Plasma Turrets
-   **Advanced**: Quantum Disruptors, Particle Beams
-   **Exotic**: Dark Matter Shields, Singularity Generators

### Defence Statistics

**Armour**: Hit points

**Gun Power**: Damage per shot

**Accuracy**: Hit chance

**Init**: Initiative (firing order)

**Special Abilities**:

-   **ion_disable**: Disables enemy ships (prevent firing)
-   **instant_kill**: Mines - instant kill on hit
-   **shielding**: Reduces incoming damage

### Facility Types

**Production Facilities**:

-   Mines, Probes (resource production)
-   Extractors (bonus production)
-   Production Complexes (massive production)

**Military Facilities**:

-   Shipyards (ship production)
-   Defence Grids (defence production)
-   Command Centers (fleet coordination)

**Research Facilities**:

-   Research Labs (enables research)
-   Advanced Labs (faster research)
-   Quantum Labs (Era 5+ research)

**Special Facilities**:

-   Tachyon Broadcast Centers (signal scanning bonuses)
-   Storage Facilities (resource storage)
-   Dark Matter Reactors (Dark Matter production)

### Facility Levels

Facilities can be upgraded:

-   Level 1: Base capabilities
-   Level 2-5: Improved production/effects
-   Higher levels: Exponential cost increases

**Upgrade Benefits**:

-   Increased production (mines, probes)
-   Reduced build times (shipyards)
-   Enhanced effects (research labs)

### Construction System

**Build Time**:

-   Facilities: Linear time (level × base_time)
-   Ships: Parallel construction (up to 10 normal speed)
-   Defences: Parallel construction (up to 10 normal speed)
-   Research: Linear time (cannot be parallelized)

**Costs**:

-   Increase with level/quantity
-   Early facilities: 1,000-10,000 T + K
-   Late facilities: 100,000+ T + K

**Prerequisites**:

-   Must have required facilities
-   Must have completed research
-   Must have sufficient resources

---

## Research & Technology

### Research System

**Requirements**:

-   Research Lab (Level 1) on planet
-   Prerequisites completed (previous research)
-   Sufficient resources (Tellerium + Krypton)

**Research Effects**:

-   Unlock new facilities, ships, defences
-   Production multipliers
-   Visibility unlocks
-   Special abilities

### Research Tree

**Era 1: Foundation** (Days 1-7):

-   Military Doctrine (unlocks Basic Shipyard)
-   Basic Combat (unlocks Assault Fighter)
-   Colony Management (enables colonization)

**Era 2: Expansion** (Days 8-20):

-   Advanced Shipyard (unlocks Corvettes)
-   Advanced Combat (unlocks Strike Corvettes)
-   Sensor Technology (unlocks current region visibility)

**Era 3: Consolidation** (Days 21-35):

-   Capital Shipyard (unlocks Cruisers)
-   Fleet Tactics (unlocks Carriers)
-   Deep Space Scanning (unlocks adjacent regions)

**Era 4: Domination** (Days 36-50):

-   Quantum Research (unlocks Quantum facilities)
-   Galactic Mapping (unlocks spiral arm visibility)
-   Advanced Defences (unlocks Quantum defences)

**Era 5: Mastery** (Days 51+):

-   Singularity Research (unlocks Dark Matter)
-   Quantum Sensors (reveals hidden systems)
-   Relic Technology (unlocks Relic facilities)

### Research Bonuses

**Production Bonuses**:

-   Resource Optimization: +10% Tellerium
-   Industrial Automation: +20% global production
-   Advanced Extraction: +15% Krypton

**Combat Bonuses**:

-   Advanced Targeting: +5% accuracy
-   Improved Shields: +10% armour
-   Fleet Coordination: +5% damage

**Visibility Bonuses**:

-   Sensor Technology: Unlocks current region
-   Deep Space Scanning: Unlocks adjacent regions
-   Galactic Mapping: Unlocks spiral arm
-   Quantum Sensors: Reveals hidden systems

### Research Strategy

**Early Game**:

1. Military Doctrine → Basic Shipyard
2. Basic Combat → Assault Fighter
3. Colony Management → Colonization

**Mid Game**:

1. Advanced Shipyard → Corvettes
2. Sensor Technology → Region visibility
3. Resource Optimization → Production boost

**Late Game**:

1. Quantum Research → Advanced facilities
2. Galactic Mapping → Full visibility
3. Relic Technology → Dark Matter

---

## Fleet Movement & Travel

### Fleet Orders

**Order Types**:

-   `attack`: Attack planet (combat on arrival)
-   `defend`: Defend planet (join defence)
-   `station`: Station at planet (no combat)
-   `colonize`: Colonize planet (requires colony ship)
-   `return`: Return to origin (retreat)

### Travel Time Calculation

**Formula**:

```
distance = sqrt((destinationX - originX)² + (destinationY - originY)²)
distanceMultiplier = min(5.0, 1 + (distance / 100.0))
travelTicks = ceil(slowestShipTravelTicks × distanceMultiplier)
```

**Factors**:

-   Distance (Euclidean)
-   Slowest ship in fleet (determines speed)
-   Distance multiplier (caps at 5x)

**Example**:

-   Fleet: 10 Assault Fighters (Travel: 2 ticks)
-   Distance: 300 units
-   Multiplier: 1 + (300/100) = 4.0
-   Travel Time: 2 × 4.0 = 8 ticks

### Fleet Status

**stationed**: At a planet (ready to move)

**in_transit**: Traveling to destination

**arrived**: Reached destination (combat/colonization occurs)

### Fleet Range

**Colonization Range**: ~2,100 units (2 regions distance)

**Attack Range**: No limit (but travel time increases)

**Validation**: Fleet range validated before order creation

### Fleet Strategies

**Speed**:

-   Use fast ships for quick responses (Scout Fighters)
-   Slow ships for long-range attacks (Battle Cruisers)

**Composition**:

-   Balanced fleets for versatility
-   Specialized fleets for specific roles

**Timing**:

-   Coordinate arrivals with allies
-   Time attacks with tick processing

---

## Colonization & Exploration

### Colonization Requirements

**Planet Requirements**:

-   Must be `unsettled` state
-   Must be `is_habitable: true`
-   Must be within galaxy boundaries

**Player Requirements**:

-   Must have `colony_management` research
-   Must have at least one planet (homeworld)
-   Must have discovered planet OR within 2 regions distance

**Fleet Requirements**:

-   Fleet must contain at least one Colony Ship
-   Fleet order type: `colonize`

### Discovery Methods

**1. Signal Scanning**:

-   Discovery Signal: 1,000 Krypton, 70% success
-   System Signal: 500 Krypton, 15% success
-   On success: All planets in system marked as discovered

**2. Manual Exploration**:

-   Endpoint: `/planets/discover/{region}/{system}`
-   Cost: 1,000 Krypton
-   Effect: Discovers all planets in system + unlocks system visibility

**3. Proximity Discovery**:

-   Automatic discovery within ~2,100 units (2 regions)
-   No signal required
-   Based on X/Y distance from owned planets

### Colonization Process

1. **Find Planet**: Discover via signal or proximity
2. **Build Colony Ship**: Requires Advanced Shipyard
3. **Send Fleet**: Create fleet with colony ship
4. **Fleet Travels**: Fleet moves to destination
5. **Arrival**: Colonization completes automatically
6. **Planet Claimed**: Ownership transfers, state changes to `colony`

### Colonization Strategy

**Early Game**:

-   Colonize nearby planets (within 2 regions)
-   Focus on habitable planets (Terran, Temperate)
-   Build infrastructure on colonies

**Mid Game**:

-   Expand to adjacent regions
-   Use discovery signals for distant systems
-   Strategic colonization (resource-rich areas)

**Late Game**:

-   Control key systems
-   Deny enemies strategic positions
-   Maximize planet value

### Planet Selection

**Best Planet Types**:

-   Terran (ideal conditions)
-   Temperate (balanced)
-   Oceanic (resource-rich)

**Strategic Positions**:

-   Near homeworld (defence)
-   Resource-rich systems
-   Chokepoints (system control)

---

## Visibility & Fog of War

### Visibility System

**Visibility Levels**:

1. **Region Visible**: All systems in region visible (unlocked via research)
2. **System Visible**: Specific system visible (discovered via signal)
3. **Planet Discovered**: Planet can be colonized (in `discovered_by` array)

### Discovery Status

**visible**: Fully visible (region unlocked via research)

**fogged**: Partially visible (system discovered, region not unlocked)

**hidden**: Not visible (requires discovery)

### Initial Visibility

**New Players**:

-   Small square area around homeworld visible
-   Approximately 15-25 systems visible
-   Creates noticeable visible area on map

**Visibility Expansion**:

-   Research unlocks regions
-   Signal scanning discovers systems
-   Exploration reveals planets

### Research Unlocks

**Sensor Technology**: Unlocks current region (all systems visible)

**Deep Space Scanning**: Unlocks adjacent regions (±1 region)

**Galactic Mapping**: Unlocks entire spiral arm (7 regions)

**Quantum Sensors**: Reveals hidden systems in visible regions

### Signal Discovery

**Discovery Signal**:

-   Cost: 1,000 Krypton
-   Success: 70%
-   Effect: Discovers all planets in system + unlocks system visibility

**System Signal**:

-   Cost: 500 Krypton
-   Success: 15%
-   Effect: Discovers all planets in system

### Visibility Strategy

**Early Game**:

-   Use initial visibility for first colonization
-   Research Sensor Technology for region visibility
-   Signal scan key systems for expansion

**Mid Game**:

-   Research Deep Space Scanning for adjacent regions
-   Strategic signal scanning for target systems
-   Plan expansion based on visibility

**Late Game**:

-   Research Galactic Mapping for full visibility
-   Quantum Sensors for hidden system discovery
-   Complete map awareness

---

## Alliances

### Alliance Basics

**Purpose**: Coordinate with other players for mutual benefit

**Benefits**:

-   Shared defence (alliance members can defend each other)
-   Coordinated attacks (timed fleet arrivals)
-   Alliance funds (resource pooling)
-   Alliance chat (private communication)
-   Alliance homepage (shared information)

### Alliance Creation

**Requirements**:

-   Must not be in an alliance
-   Must have sufficient resources (varies by server)

**Process**:

1. Create alliance creation request
2. Gather support from other players (3-5 supporters)
3. Alliance created upon approval
4. Creator becomes leader

### Alliance Membership

**Roles**:

-   **Leader**: Full control (manage members, funds, settings)
-   **Member**: Standard access (chat, fund access, defence)

**Join Process**:

1. Submit join request
2. Leader/leader-approved members vote
3. Accepted: Membership granted
4. Rejected: Can reapply later

### Alliance Funds

**Purpose**: Pool resources for alliance operations

**Operations**:

-   **Donate**: Contribute resources to fund
-   **Withdraw**: Withdraw resources (requires permission)
-   **Transfer**: Transfer between alliance planets

**Uses**:

-   Large purchases (facilities, ships)
-   Emergency defence funding
-   Coordinated expansion

### Alliance Chat

**Features**:

-   Private channel (alliance members only)
-   Real-time messaging
-   Message history
-   Typing indicators

**Uses**:

-   Strategy coordination
-   Attack planning
-   Defence coordination
-   Social interaction

### Alliance Strategy

**Defence**:

-   Coordinate fleet movements
-   Share intelligence
-   Pool resources for defences

**Offence**:

-   Coordinated attacks
-   Timed fleet arrivals
-   Target selection

**Expansion**:

-   Colonization coordination
-   Territory planning
-   Resource sharing

---

## Galaxy Incidents

### Incident System

**Overview**: Random dynamic events appear across the galaxy

**Generation**:

-   2% chance per tick
-   Max 10 active incidents
-   Min 200 units between incidents

### Incident Types

**1. Wormhole** (8 ticks):

-   **Effect**: Teleportation to distant regions
-   **Radius**: 50 units
-   **Success Chance**: 70%
-   **Max Uses**: 10
-   **Strategy**: Use for rapid expansion or escape

**2. Asteroid Storm** (10 ticks):

-   **Effect**: Planet damage (10 damage/tick)
-   **Radius**: 100 units
-   **Affected**: Barren, Rocky planets
-   **Strategy**: Avoid or defend affected planets

**3. Resource Rush** (15 ticks):

-   **Effect**: Production bonus (1.5x multiplier)
-   **Radius**: 150 units
-   **Resource**: Both Tellerium and Krypton
-   **Strategy**: Maximize production during rush

**4. Pirate Raid** (12 ticks):

-   **Effect**: NPC attacks on nearby planets
-   **Radius**: 75 units
-   **Fleet Strength**: 100
-   **Strategy**: Defend or counter-attack

**5. Anomaly** (Permanent):

-   **Effect**: Research bonus (+20%) and discovery chance (30%)
-   **Radius**: 30 units
-   **Strategy**: Investigate for bonuses

### Incident Interaction

**Requirements**:

-   Must have planet within incident radius
-   Must have discovered planet in system (for wormhole/anomaly)

**Interactions**:

-   **enter_wormhole**: Teleport to distant region
-   **attack_pirates**: Engage pirate raid
-   **investigate_anomaly**: Gain research bonus/discoveries
-   **collect_resources**: Collect from resource rush

### Incident Strategy

**Early Game**:

-   Avoid dangerous incidents (asteroid storms, pirate raids)
-   Use resource rushes for production boost

**Mid Game**:

-   Use wormholes for expansion
-   Investigate anomalies for research bonuses

**Late Game**:

-   Coordinate incident usage with allies
-   Maximize resource rush benefits

---

## NPC Empires

### NPC Overview

**Purpose**: Provide PVE combat opportunities and dynamic universe

**Behavior**: NPCs follow same rules as players (tech tree, research, construction)

**Scaling**: NPCs scale with server age (stronger on older servers)

### NPC Types

**Basic NPCs**:

-   Balanced approach
-   General exploration
-   Moderate aggression

**Boss NPCs**:

-   Powerful defensive empires
-   Vast resources
-   High-level facilities

**Pirates**:

-   Aggressive raiding
-   Frequent attacks
-   Hit-and-run tactics

**Marauders**:

-   Highly aggressive
-   Specialize in attacks
-   Fast expansion

**Trading Guilds**:

-   Friendly empires
-   Economic focus
-   Rarely attack

**Isolationists**:

-   Defensive focus
-   Avoid conflict
-   Protection priority

**Expansionists**:

-   Aggressive colonizers
-   Constant expansion
-   Territory-focused

**Scavengers**:

-   Raid inactive players
-   Target abandoned planets
-   Opportunistic

### NPC Strategy

**Early Game**:

-   Avoid powerful NPCs
-   Focus on weak targets
-   Build defences

**Mid Game**:

-   Engage moderate NPCs
-   Coordinate attacks with allies
-   Capture NPC planets

**Late Game**:

-   Challenge boss NPCs
-   Control NPC territories
-   Eliminate threats

---

## Market System

### Market Overview

**Purpose**: Trade resources between players (if enabled)

**Pricing**: Dynamic supply/demand

**Base Price**: 1.0 for both Tellerium and Krypton

### Market Orders

**Order Types**:

-   **Buy**: Purchase resources (set price limit)
-   **Sell**: Sell resources (set price limit)

**Order Parameters**:

-   Resource type (Tellerium or Krypton)
-   Quantity (min: 1,000, max: 100,000,000)
-   Price limit (optional)

**Order Expiry**: 50 ticks (configurable)

### Market Matching

**Algorithm**:

-   Matches buy/sell orders
-   Price within limits
-   First-come-first-served

**Fees**: None (server-dependent)

### Market Strategy

**Selling**:

-   Sell excess resources
-   Price above base for profit
-   Time sales with demand

**Buying**:

-   Purchase needed resources
-   Price below base for savings
-   Bulk purchases for discounts

**Market Timing**:

-   Monitor price trends
-   Buy low, sell high
-   Coordinate with allies

---

## Quantum Credits & Boosters

### Quantum Credits

**Purpose**: Premium currency for optional enhancements

**Earning**:

-   Daily login: 1-2 QC per day (streak bonus after 7 days)
-   Achievements: 5-100 QC per achievement
-   Future: Real money purchases

**Uses**:

-   Purchase boosters (temporary bonuses)
-   Future: Cosmetic items, convenience features

### Boosters

**Types**:

-   **Production Booster**: +25% production for 24 hours
-   **Research Booster**: +25% research speed for 24 hours
-   **Construction Booster**: +25% construction speed for 24 hours

**Cost**: Varies by duration (24h, 48h, 72h)

**Strategy**:

-   Use during critical periods (expansion, research)
-   Stack with research bonuses
-   Coordinate with allies

### Achievements

**Purpose**: Unlock achievements for Quantum Credits

**Types**:

-   **Milestone**: Reach specific goals (planets, ships, score)
-   **Combat**: Win battles, capture planets
-   **Exploration**: Discover systems, regions
-   **Social**: Join alliances, send messages

**Rewards**: 5-100 Quantum Credits per achievement

---

## Strategy Guide

### Early Game (Days 1-7)

**Goals**:

1. Build infrastructure (mines, probes, research lab)
2. Research basic technologies
3. Build first fleet
4. Colonize first planet

**Priorities**:

-   Resource production (mines/probes)
-   Research (Military Doctrine, Basic Combat, Colony Management)
-   Fleet building (Scout Fighters, Assault Fighters)
-   Colonization (nearby planets)

**Avoid**:

-   Large fleet battles (too expensive)
-   Distant colonization (too slow)
-   Advanced research (prerequisites not met)

### Mid Game (Days 8-35)

**Goals**:

1. Expand to 3-4 planets
2. Research advanced technologies
3. Build powerful fleets
4. Join or form alliance

**Priorities**:

-   Advanced shipyard (Corvettes, Frigates)
-   Sensor Technology (region visibility)
-   Resource Optimization (production boost)
-   Alliance formation

**Expansion**:

-   Colonize adjacent regions
-   Use discovery signals for distant systems
-   Strategic planet selection

### Late Game (Days 36+)

**Goals**:

1. Maximize planet value
2. Research Era 4-5 technologies
3. Build capital ships
4. Dominate regions

**Priorities**:

-   Quantum Research (advanced facilities)
-   Galactic Mapping (full visibility)
-   Capital Shipyard (Cruisers, Carriers)
-   Dark Matter production

**Domination**:

-   Control key systems
-   Eliminate threats
-   Alliance coordination

---

## Advanced Tactics

### Fleet Composition

**Balanced Fleet**:

-   Mix of ship classes
-   Versatile for all situations
-   Example: 20 Fighters + 10 Corvettes + 5 Frigates

**Strike Fleet**:

-   High-damage ships
-   Fast travel time
-   Example: 30 Strike Corvettes + 10 Strike Frigates

**Carrier Fleet**:

-   Carriers with fighter deployments
-   Overwhelming numbers
-   Example: 5 Carriers (deploy 50 fighters each)

**Defence Fleet**:

-   Defensive ships
-   High armour
-   Example: 20 Patrol Corvettes + 10 Defence Frigates

### Combat Tactics

**Initiative Stacking**:

-   Use ships with low initiative (fire first)
-   Eliminate enemies before they fire
-   Example: Scout Fighters (Init 20) fire before Assault Fighters (Init 18)

**Target Priority**:

-   Focus fire on high-value targets
-   Eliminate threats first
-   Example: Target Carriers before Fighters

**Special Abilities**:

-   Use ion disable to prevent enemy firing
-   Use mines for instant kills
-   Use stingers for ship capture

### Resource Management

**Production Optimization**:

-   Maximize mines/probes early
-   Build production facilities mid-game
-   Upgrade facilities for bonuses

**Resource Allocation**:

-   Balance Tellerium and Krypton
-   Transfer resources between planets
-   Plan large purchases in advance

**Upkeep Management**:

-   Ensure production exceeds upkeep
-   Shut down unused facilities
-   Upgrade facilities for efficiency

### Colonization Strategy

**Expansion Patterns**:

-   **Linear**: Expand in one direction (easy defence)
-   **Cluster**: Colonize nearby systems (strong defence)
-   **Strategic**: Control key systems (chokepoints)

**Planet Selection**:

-   Prioritize habitable planets (Terran, Temperate)
-   Consider strategic positions (chokepoints)
-   Balance resources (production vs defence)

**Colonization Timing**:

-   Colonize during low activity (fewer attacks)
-   Coordinate with allies (mutual defence)
-   Time with research completion (Colony Management)

### Alliance Coordination

**Defence Coordination**:

-   Share intelligence (enemy fleets)
-   Pool resources (alliance funds)
-   Coordinate fleet movements

**Attack Coordination**:

-   Timed fleet arrivals (simultaneous attacks)
-   Target selection (weakest first)
-   Resource sharing (fund transfers)

**Expansion Coordination**:

-   Colonization planning (territory division)
-   Resource pooling (alliance funds)
-   Mutual defence (shared protection)

---

## Reference Tables

### Ship Reference

**Era 2: Fighters**

-   Scout Fighter: 5 Armour, 10 Gun Power, Init 20
-   Assault Fighter: 8 Armour, 15 Gun Power, Init 18
-   Defence Drone: 3 Armour, 5 Gun Power, Init 22 (defence only)

**Era 3: Corvettes**

-   Patrol Corvette: 15 Armour, 25 Gun Power, Init 15
-   Strike Corvette: 12 Armour, 30 Gun Power, Init 16

**Era 3: Frigates**

-   Battle Frigate: 30 Armour, 50 Gun Power, Init 12
-   Defence Frigate: 40 Armour, 35 Gun Power, Init 14

**Era 4: Cruisers**

-   Battle Cruiser: 60 Armour, 100 Gun Power, Init 10
-   Strike Cruiser: 50 Armour, 120 Gun Power, Init 11

**Era 4: Carriers**

-   Carrier: 80 Armour, 60 Gun Power, Init 8 (deploys fighters)

**Era 5: Motherships**

-   Mothership: 150 Armour, 200 Gun Power, Init 5

**Era 5: Fortresses**

-   Fortress: 300 Armour, 250 Gun Power, Init 3 (immobile)

### Defence Reference

**Basic Defences**:

-   Ion Cannon: 50 Armour, 30 Gun Power, Init 12 (ion disable)
-   Plasma Turret: 40 Armour, 25 Gun Power, Init 14

**Advanced Defences**:

-   Quantum Disruptor: 100 Armour, 60 Gun Power, Init 10
-   Particle Beam: 80 Armour, 50 Gun Power, Init 11

**Exotic Defences**:

-   Dark Matter Shield: 200 Armour, 100 Gun Power, Init 8 (shielding)

### Facility Reference

**Production Facilities**:

-   Reclaimed Surface Mines: +10 T/tick
-   Atmospheric Probe Nets: +8 K/tick
-   Crude Extractor: +6 T + 6 K/tick
-   Deep-Core Extraction Facility: +35 T + 20 K/tick
-   Molecular Extraction Facility: +100 T/tick
-   Automated Production Complex: +250 T/tick
-   Singularity Reactor Core: +1,000 T + 50 DM/tick

**Military Facilities**:

-   Basic Shipyard: Enables Fighters
-   Advanced Shipyard: Enables Corvettes, Frigates
-   Capital Shipyard: Enables Cruisers, Carriers
-   Quantum Shipyard: Enables Motherships, Fortresses

**Research Facilities**:

-   Research Lab: Enables research
-   Advanced Research Lab: +25% research speed
-   Quantum Research Facility: +50% research speed

### Research Reference

**Era 1**:

-   Military Doctrine: Unlocks Basic Shipyard
-   Basic Combat: Unlocks Assault Fighter
-   Colony Management: Enables colonization

**Era 2**:

-   Advanced Shipyard: Unlocks Corvettes
-   Sensor Technology: Unlocks current region visibility
-   Resource Optimization: +10% Tellerium production

**Era 3**:

-   Capital Shipyard: Unlocks Cruisers
-   Deep Space Scanning: Unlocks adjacent regions
-   Advanced Combat: Unlocks Strike Corvettes

**Era 4**:

-   Quantum Research: Unlocks Quantum facilities
-   Galactic Mapping: Unlocks spiral arm visibility
-   Advanced Defences: Unlocks Quantum defences

**Era 5**:

-   Singularity Research: Unlocks Dark Matter
-   Quantum Sensors: Reveals hidden systems
-   Relic Technology: Unlocks Relic facilities

---

## Tips & Best Practices

### General Tips

1. **Plan Ahead**: Research and construction take time - plan your strategy in advance
2. **Balance Resources**: Maintain balance between Tellerium and Krypton
3. **Defend Your Planets**: Build defences on all planets (especially colonies)
4. **Join an Alliance**: Alliances provide defence, coordination, and resources
5. **Monitor Enemy Fleets**: Watch for incoming attacks and prepare defences
6. **Use Signals Wisely**: Signal scanning is expensive - use strategically
7. **Colonize Strategically**: Choose planets based on position and resources
8. **Research Continuously**: Research unlocks new capabilities - don't stop
9. **Build Facilities**: Facilities provide production bonuses - prioritize
10. **Coordinate with Allies**: Communication is key for alliance success

### Combat Tips

1. **Fleet Composition**: Balance different ship classes for versatility
2. **Initiative Matters**: Low initiative ships fire first - use this advantage
3. **Target Priority**: Focus fire on high-value targets (Carriers, Motherships)
4. **Special Abilities**: Use ion disable, mines, and stingers effectively
5. **Defence Stacking**: Multiple defences provide better protection
6. **Fleet Size**: Larger fleets generally win - build up before attacking
7. **Timing**: Coordinate attacks with tick processing for maximum effect
8. **Retreat**: Don't be afraid to retreat if outmatched

### Resource Management Tips

1. **Early Production**: Build mines/probes early for steady income
2. **Facility Upgrades**: Upgrade facilities for production bonuses
3. **Upkeep Awareness**: Ensure production exceeds facility upkeep
4. **Resource Transfer**: Transfer resources between planets as needed
5. **Large Purchases**: Plan large purchases in advance (save resources)
6. **Production Boosters**: Use boosters during critical periods
7. **Market Trading**: Use market for resource balance (if enabled)

### Colonization Tips

1. **Discovery First**: Discover systems before colonizing
2. **Proximity**: Colonize nearby planets first (easier defence)
3. **Habitable Priority**: Prioritize habitable planets (Terran, Temperate)
4. **Strategic Positions**: Consider chokepoints and resource-rich areas
5. **Defence**: Build defences on new colonies immediately
6. **Infrastructure**: Build mines/probes on colonies for production
7. **Expansion Rate**: Don't expand too fast (defence becomes difficult)

### Alliance Tips

1. **Communication**: Active communication is essential
2. **Coordination**: Coordinate attacks and defence with allies
3. **Resource Sharing**: Use alliance funds for large purchases
4. **Mutual Defence**: Defend allies' planets as they defend yours
5. **Strategy Planning**: Plan expansion and attacks together
6. **Trust**: Build trust through reliable actions
7. **Leadership**: Good leadership makes strong alliances

### Advanced Tips

1. **Tick Timing**: Understand tick processing for optimal timing
2. **Fleet Range**: Know your fleet range limitations
3. **Visibility**: Expand visibility through research and signals
4. **Incidents**: Use incidents strategically (wormholes, resource rushes)
5. **NPC Management**: Engage NPCs for resources and experience
6. **Market Timing**: Monitor market prices for optimal trading
7. **Achievement Hunting**: Complete achievements for Quantum Credits
8. **Specialization**: Specialize in specific ship classes or strategies

---

## Conclusion

Astralus is a complex game with many layers of strategy. Master the basics, experiment with different approaches, and most importantly - have fun!

Remember: In Astralus, there are no second chances. Every tick counts. Every decision echoes. Every alliance is a gamble.

**What kind of legacy will you leave among the fractured stars?**

---

_For technical API documentation, see `BACKEND_DEVELOPER_REFERENCE.md`._

_For questions or support, contact the development team or visit the community forums._
