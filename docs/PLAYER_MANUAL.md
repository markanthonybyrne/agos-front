# EmpireQuest Player Manual

## Prologue: The Fractured Stars

**The Great Silence came without warning.**

For millennia, the Galactic Consortium maintained peace across the known universe. The **Tellerium-Krypton Accord** bound a thousand worlds together, sharing resources and protecting the weak. But greed knows no bounds, and when the Consortium's central authority collapsed under the weight of corruption and ambition, the accord shattered like glass.

Now, you are alone in the void.

The remnants of the Consortium scattered across four quadrants, each sector containing countless galaxies teeming with planets—some barren, some rich with resources, all waiting to be claimed. The old rules are gone. The strong prey upon the weak. Alliances form and break like tides. And in this chaos, opportunity burns like a supernova.

You are a **Commander**, awakened from cryogenic stasis to find your homeworld isolated and vulnerable. The resources you once took for granted are gone. The fleets that protected your borders have scattered to the void. Your people look to you for salvation, for conquest, for survival.

But you are not the only one who has awakened.

Across the stars, other Commanders stir from their long sleep. Some seek to rebuild what was lost. Others seek to dominate what remains. A few—the wisest—seek to forge new alliances, knowing that unity is the only path to lasting power.

The **Holopad** before you flickers to life, its ancient systems still functional despite centuries of neglect. Through its interface, you will command your empire, build your fleets, and shape the destiny of worlds. The signals you send will echo across light-years. The fleets you command will reshape the galaxy. The alliances you forge will determine whether the universe descends into darkness or rises into a new golden age.

**This is your moment, Commander.**

The stars await your command. The void whispers your name. Will you be a conqueror, a protector, or a builder? Will you stand alone against the darkness, or forge bonds that will last a thousand years?

The choice is yours.

But remember: in EmpireQuest, there are no second chances. Every tick counts. Every decision echoes. Every alliance is a gamble. And in the end, only one question matters:

**What kind of legacy will you leave among the fractured stars?**

---

# Welcome, Commander

EmpireQuest is a grand strategy browser game where you build fleets, raise defences, colonize planets, research advanced technologies, and compete (or cooperate) with other empires—all in a living, tick-based universe.

## Goal

Rule the known universe — capture planets, build powerful fleets, and lead or join alliances to extend your reach. Or choose to be a hero and protect the weak.

---

## Key Concepts

### Tick System

The game progresses in discrete time steps called **"ticks"** (default every 30 minutes). Every tick, resource production, construction progress, fleet movements, and combat are processed.

### Empire

Your player-controlled entity with a **homeworld** and up to **five colonies**. Your empire has:

-   **Score**: Calculated from ships, defences, probes/mines, planets, and facilities
-   **Description**: Add a custom description to tell others about your empire
-   **Avatar**: Upload an image to represent your empire
-   **Rank**: Your position on the global leaderboard

### Planet Coordinates

Planets are addressed as **Quadrant:Sector:Galaxy:Planet**, e.g., `1:2:32:14`.

### Planet Types

Each planet has a unique type that affects its appearance:

-   **Arid**: Desert worlds with harsh conditions
-   **Oceanic**: Water-covered planets rich in resources
-   **Volcanic**: Active worlds with unstable surfaces
-   **Ice**: Frozen planets with unique challenges

Planet types are assigned deterministically based on coordinates, ensuring consistency across the universe.

### Resources

-   **Tellerium**: Manufacturing resource, produced by mines
-   **Krypton**: Fuel resource, produced by probes

Production formula:

-   **Tellerium**: `(Mines × 1000) + (Planets × 250)` + Molecular Extraction facility bonus (20%)
-   **Krypton**: `(Probes × 750) + (Planets × 250)` + Molecular Extraction facility bonus (20%)

Resources are stored per-planet and can be transferred between your planets.

---

## Getting Started (First Hour)

### 1. Open Holopad

The default screen on login. This is your HQ — it shows resources, fleets, construction, research, and incoming threats.

### 2. Build Infrastructure

-   **Mines & Probes**: Start collecting resources on your homeworld
-   **Research Lab**: Enables research projects
-   **Basic Shipyard**: Unlocks fighter production

### 3. Research & Build Facilities

-   Research unlocks facilities
-   Facilities enable ships/defences
-   Example: Research `Fleet Command` → Build `Fighter Factory` → Build Fighters

### 4. Build Your First Fleet

Start with:

-   **Scout Fighters**: Fast reconnaissance
-   **Assault Fighters**: Basic combat ships
-   **Resource Freighter**: Can steal resources during attacks

### 5. Explore & Colonize

-   Send a **Planetary Signal** on nearby unsettled planets
-   Build a **Colony Ship** (or use invasion ships)
-   Colonize by sending ships to an unsettled planet

### 6. Join an Alliance

-   Browse available alliances
-   Join an open alliance or submit a join request
-   Benefit from shared defence, coordinated attacks, and alliance funds

---

## Holopad Sections (Quick Reference)

### Message of the Day

Developer notes and announcements.

### Foreign Fleets

Fleets near your planets (incoming/outgoing):

-   **Incoming**: Enemy or friendly fleets approaching your planets
-   **Outgoing**: Your fleets traveling to destinations
-   Shows ETA, fleet composition, and order type

### Planets

List & coordinates of your planets:

-   Homeworld (cannot be captured)
-   Colonies (up to 5 total)
-   Each shows planet type, resources, defences, and facilities

### Research

-   **Active Research**: Currently being researched on a planet
-   **Available Research**: View all research options with prerequisites
-   **Build Time**: Shown in ticks remaining

### Facilities

-   **Active Builds**: Facility construction in progress
-   **Built Facilities**: Current facilities on each planet
-   **Upgrade**: Improve facility levels (increases production/capabilities)

### Fleets

-   **Stationed Fleets**: Ships at your planets
-   **In Transit**: Fleets traveling between locations
-   **Fleet Composition**: View ships in each fleet

### Fleet Construction

Queued ship orders:

-   Ships are built in parallel (up to 10 ships build at normal speed)
-   Large quantities use diminishing returns scaling
-   Ships are automatically added to fleets when complete

### Orbital Defence

Fixed defences protecting your planets:

-   Built per-planet
-   Multiple defence types available
-   Can be destroyed in combat

### Orbital Construction

Queued orbital defence orders:

-   Defences are built in parallel
-   Protect planets from attacks

### Resources

Mine/probe counts and per-tick production:

-   Total empire resources across all planets
-   Per-planet breakdown
-   Production rates

---

## Account Management

### Profile Settings

-   **Change Password**: Update your password while logged in
-   **Delete Account**: Permanently delete your account and empire
-   **Avatar**: Upload or remove your player avatar
-   **Email Notifications**: Toggle email notifications for game events
-   **Push Notifications**: Enable push notifications for real-time updates

### Game Event Preferences

Customize which events trigger notifications:

-   Construction Completed
-   Research Completed
-   Fleet Arrived
-   Fleet Attacked
-   Planet Colonized
-   Alliance Messages
-   Empire Attacked

### Empire Description

Add a custom description to your empire to tell others about your goals, playstyle, or history.

---

## Fleets & Missions

### Available Missions

#### Attack

Take over enemy colonies (cannot attack homeworlds):

-   Requires sufficient combat power
-   Planet capture requires **Invasion Ships** (see Planet Capture section)
-   Winning combat may capture ships, resources, or the planet itself

#### Defend

Send fleets to bolster a planet's defences:

-   Station fleets at allied planets
-   Provide additional firepower during attacks
-   Coordinate with alliance members

#### Station

Permanently move a fleet to one of your planets:

-   Fleets stationed at planets can be used for defence
-   Automatically participate in combat if planet is attacked

#### Return

Recall fleets back to their origin:

-   Returns fleet to original planet
-   Useful for repositioning or avoiding danger

### Fleet Travel Time

Calculated from:

-   **Slowest ship** in the fleet
-   **Distance**: Base travel time + penalties for:
    -   Out-of-galaxy travel
    -   Out-of-sector travel
-   Research & facilities can reduce travel time

### Fleet Movement

-   **Create Fleet**: Build ships and assign destination
-   **Move Fleet**: Update existing fleet's destination without canceling
-   **Cancel Fleet**: Return ships to origin planet

---

## Combat System

### Combat Basics

Combat resolves during ticks. Ships fire in **Init order** (lower numbers fire earlier).

### Special Ships

#### Stinger

Disables targets (useful for enabling boarders):

-   Prevents enemy ships from firing
-   Makes ships vulnerable to boarding

#### Ship Boarder

Captures disabled ships:

-   Must target disabled ships
-   Converts enemy ships to your fleet
-   Powerful economic advantage

#### Invasion Ship

Enables planet capture:

-   Low combat power but special ability
-   Requires **Planetary Assault** research
-   Must survive combat to capture planet

#### Troop Carrier/Transport

Can destroy facilities and take over planets:

-   Reduces facility levels during combat
-   Can capture planets if invasion ships survive

#### Resource Freighter

Steals resources produced that tick:

-   Extracts resources during combat
-   Increases your resources while weakening enemy

### Combat Resolution

-   **Deterministic**: Uses seeded RNG for consistency
-   **Multiple Rounds**: Combat continues until one side is defeated
-   **Damage Calculation**: Based on gun power, accuracy, and armour
-   **Ship Losses**: Calculated per round based on remaining ships

### When You Attack

You may:

-   **Weaken** your opponent
-   **Strengthen** yourself (capture ships, steal resources)
-   **Capture** colonies (with invasion ships)
-   **Destroy** facilities and defences

### Planet Capture

To capture a planet:

1. **Research**: Complete `Planetary Assault` research (requires `Advanced Combat`)
2. **Facility**: Build `Planetary Intelligence Headquarters` (requires `Planetary Assault`)
3. **Ships**: Build `Invasion Ships` (requires `Planetary Intelligence Headquarters`)
4. **Attack**: Win combat with invasion ships surviving
5. **Capture**: Planet ownership transfers to you

**Capture Conditions**:

-   Planet must be a **colony** (cannot capture homeworlds)
-   Attacker must **win** the combat
-   At least **1 invasion ship** must survive
-   Planet ownership transfers, including:
    -   Resources
    -   Mines and probes
    -   Facilities (some may be destroyed)
    -   Defences (some may be destroyed)
    -   Construction queues are cancelled

---

## Facilities & Research

### Facilities

Facilities unlock ship classes and abilities:

-   **Basic Shipyard**: Enables Fighter class ships
-   **Advanced Shipyard**: Enables Corvette class ships
-   **Fleet Command**: Unlocks advanced fighter types
-   **Assault Factory**: Unlocks Assault Cruiser
-   **Planetary Intelligence Headquarters**: Enables invasion ships

Facilities can be upgraded to increase production or unlock new capabilities.

### Research

Research unlocks facilities and improves mechanics:

-   **Warp Technology**: Reduces travel time
-   **Advanced Combat**: Unlocks advanced ships and weapons
-   **Planetary Assault**: Enables planet capture
-   **Advanced Mining**: Increases resource production

### Prerequisites

Research items have two types of prerequisites:

#### Facility Prerequisites

Must be built on the **planet** where research occurs:

-   Example: `Advanced Research Lab` required for advanced research
-   Check planet facilities before starting research

#### Research Prerequisites

Must be completed **empire-wide**:

-   Example: `Advanced Combat` required before `Planetary Assault`
-   Completed research applies to entire empire

### Research Restrictions

-   Only **one facility** or **research** may be active per planet at a time
-   Check available research before starting new projects
-   Prerequisites must be met before research can begin

---

## Signals (Tachyon)

Tachyon signals allow you to scan other planets/fleets:

### Planetary Signal

Basic planet information:

-   Owner
-   Resources
-   Defences
-   Facilities

### Fleet Signal

Reveals fleet composition:

-   Ship types and quantities
-   Cloaked ships **not** readable unless you have All-Frequency Module

### All Frequency Fleet Signal

Full reveal, includes cloaked ships:

-   Requires **All-Frequency Module**
-   Shows all ships, including cloaked
-   Most powerful intelligence gathering tool

### Signal Success

Success depends on:

-   Your **Tachyon Broadcast Centers**
-   Target's **Tachyon Broadcast Centers**
-   Signal type and target type

Failed signals are recorded in **Signal Archive** for two weeks.

---

## Alliances

### Alliance Overview

Alliances offer:

-   **Shared Defence**: Coordinate fleet movements
-   **Fund Management**: Pool resources for members
-   **Coordination**: Plan attacks and defences
-   **Chat**: Real-time communication
-   **Status Tracking**: Monitor alliance fleet movements

### Creating an Alliance

1. **Create Request**: Submit alliance name, tag, and mission statement
2. **Gather Supporters**: Need **5 supporters** (including yourself = 6 total)
3. **Get Approvals**: Each supporter must approve the request
4. **Alliance Formed**: Once 5 supporters approve, alliance is created

**Requirements**:

-   Unique name and tag (3-10 characters)
-   Mission statement (optional)
-   5 supporting empires
-   Each supporter can only support one request at a time

### Joining an Alliance

#### Open Alliances

-   Join immediately if membership is open
-   No approval required

#### Closed Alliances

-   Submit a **join request** with:
    -   Reason for joining
    -   Experience/background
-   Wait for leader/officer approval
-   **24-hour cooldown** between join requests to same alliance

### Alliance Roles & Permissions

#### Leader

-   Full control over alliance
-   All permissions automatically granted
-   Can transfer leadership

#### Officers (Custom Groups)

Alliances can create custom groups with specific permissions:

-   **Recruitment Minister**: Can approve/deny join requests
-   **Fund Manager**: Can manage alliance funds
-   **Fleet Coordinator**: Can view alliance status
-   **Custom Roles**: Define responsibilities and permissions

**Permissions**:

-   `manage_fund`: Withdraw and transfer alliance funds
-   `recruit_members`: Approve/deny join requests
-   `kick_members`: Remove members from alliance
-   `manage_groups`: Create/edit/delete groups
-   `edit_global_options`: Change alliance settings
-   `view_join_requests`: See pending applications
-   `view_status`: View alliance fleet status

### Alliance Features

#### Homepage

-   Mission statement
-   Homepage URL
-   Member list
-   Leader information

#### Member List

View all alliance members with:

-   Online status
-   Empire size (score)
-   Number of planets
-   Homeworld coordinates
-   Percentile rank within alliance

#### Alliance Status

Monitor fleet movements:

-   **Outgoing Fleets**: Alliance members' fleets in transit
-   **Incoming Fleets**: Fleets approaching alliance planets
-   Shows destination, ETA, and fleet composition

#### Alliance Chat

Real-time communication:

-   WebSocket-based instant messaging
-   Message history available
-   Notifications for new messages

#### Global Options

Leaders can configure:

-   **Open/Closed Membership**: Control who can join
-   **Mission Statement**: Alliance goals and values
-   **Homepage URL**: External website link
-   **MOTD**: Message of the Day for members

### Alliance Fund Management

#### View Fund Balance

-   Any member can view current fund balance
-   Shows tellerium and krypton totals

#### Donate to Alliance

-   Any member can donate resources
-   Resources deducted from your planets
-   Added to alliance treasury

#### Withdraw Funds

-   Requires `manage_fund` permission
-   Withdraw funds to your empire
-   Resources distributed across your planets

#### Transfer Funds

-   Requires `manage_fund` permission
-   Transfer directly to specific planet
-   Planet must be owned by alliance member
-   Useful for supporting members in need

### Leaving an Alliance

-   Leave anytime (unless you're the leader)
-   Leader must transfer leadership first
-   Resources remain in alliance fund
-   Can join another alliance after leaving

---

## Mail, News & Chat

### Mail

Send direct messages via **Pulse Transmitter**:

-   **Send**: Direct messages to other players
-   **Inbox**: Receive messages from others
-   **Save/Forward/Reply**: Manage your messages
-   **Archive**: Keep important conversations

### News

In-game events from the last week:

-   Major attacks
-   Planet captures
-   Resource changes
-   Alliance activities
-   Game announcements

### Chat

Real-time communication:

-   **Galaxy Chat**: Public chat for entire galaxy
-   **Alliance Chat**: Private chat for alliance members
-   **WebSocket**: Instant message delivery
-   **Notifications**: Get alerted for new messages

---

## Scoring & Leaderboards

### Score Calculation

Your empire's score is computed from:

-   **Ships**: Value based on ship type and quantity
-   **Defences**: Value of orbital defences
-   **Probes/Mines**: Infrastructure value
-   **Planets**: Base planet value
-   **Facilities**: Value of built facilities

### Leaderboards

-   **Top 100 Empires**: Global rankings
-   **Top 100 Galaxies**: Best performing galaxies
-   **Rank**: Your position on the leaderboard
-   **Percentile**: Your rank as percentage of total empires

---

## Real-Time Updates (WebSockets)

EmpireQuest uses WebSocket technology for instant updates:

### Available Channels

-   **Private Empire**: Your empire's private channel
-   **Private Alliance**: Your alliance's private channel
-   **Public Galaxy**: Public channel for your galaxy
-   **Public Tick**: Global tick notifications

### Events Broadcast

-   **Fleet Arrived**: Fleet reaches destination
-   **Combat Resolved**: Battle results
-   **Planet Captured**: Ownership changes
-   **Construction Complete**: Builds finished
-   **Research Complete**: Research finished
-   **Alliance Chat**: New messages
-   **Tick Processed**: Game tick completed

### Connection

Connect to WebSocket server at:

-   **Development**: `ws://localhost:8080`
-   **Production**: `wss://api.agameof.space/reverb`

Subscribe to channels based on your empire and alliance membership.

---

## Tips & Strategies

### Early Game

1. **Micro Early**: Invest in mines & probes early for compounding resource gains
2. **Balance Resources**: Don't neglect either tellerium or krypton
3. **Research First**: Unlock facilities before building ships
4. **Scout**: Use signals to avoid walking into traps

### Mid Game

1. **Balance Offense & Defence**: Orbital defences are cheap and effective
2. **Colonize**: Expand to increase resource production
3. **Join Alliance**: Early alliance membership increases survival
4. **Specialize**: Focus on research or fleet building based on playstyle

### Late Game

1. **Stinger + Boarder Combo**: Disable with Stinger then capture ships
2. **Planet Capture**: Use invasion ships to expand territory
3. **Alliance Coordination**: Plan coordinated attacks with allies
4. **Resource Management**: Use alliance funds to support operations

### Advanced Strategies

#### Ship Capture

-   Use Stinger ships to disable enemies
-   Follow with Ship Boarders to capture
-   Grow fleet without building costs

#### Planet Capture

-   Research Planetary Assault first
-   Build Planetary Intelligence Headquarters
-   Produce invasion ships
-   Attack colonies (not homeworlds)
-   Ensure invasion ships survive combat

#### Alliance Fund Strategy

-   Pool resources for emergency defence
-   Support members under attack
-   Finance large construction projects
-   Coordinate resource distribution

#### Signal Intelligence

-   Scout before attacking
-   Identify weaknesses
-   Avoid traps
-   Plan fleet compositions

---

## Troubleshooting / FAQ

### Construction Issues

**Q: Why did my ship construction disappear?**
A: Construction is queued globally; check ship construction queue. Ships are built in parallel, so large quantities may take longer. If canceled, resources should be returned; contact support if not.

**Q: Why are my ships taking longer to build than expected?**
A: Ships are built in parallel (up to 10 at normal speed). Larger quantities use diminishing returns scaling to prevent instant massive fleets.

**Q: Why wasn't a facility destroyed as expected?**
A: Facility destruction is deterministic based on combat damage. Some facilities may survive if damage is insufficient. Check combat logs for details.

### Research Issues

**Q: Why can't I start this research?**
A: Check prerequisites:

-   **Facility prerequisites** must be built on the planet
-   **Research prerequisites** must be completed empire-wide
-   Use `/planets/{planetId}/research/available` to see requirements

**Q: Can I research multiple things at once?**
A: No, only one research or facility can be active per planet at a time.

### Fleet Issues

**Q: Why isn't my fleet moving?**
A: Check:

-   Fleet status (in_transit, arrived, stationed)
-   Arrival tick (when fleet will arrive)
-   Fleet hasn't been destroyed in combat

**Q: How do I move an existing fleet?**
A: Use `/fleets/{id}/move` endpoint to update destination without canceling the fleet.

**Q: Why can't I capture this planet?**
A: Requirements:

-   Planet must be a **colony** (not homeworld)
-   You must have **invasion ships** in your fleet
-   You must **win** the combat
-   At least **1 invasion ship** must survive

### Signal Issues

**Q: My scan failed — did I waste resources?**
A: Signals can fail; the chance formula depends on broadcast centers. Failed signals are recorded in Signal Archive for two weeks. Upgrade your Tachyon Broadcast Centers to improve success rate.

**Q: Why can't I see cloaked ships?**
A: You need the **All-Frequency Module** facility to detect cloaked ships. Use "All Frequency Fleet Signal" instead of regular fleet signal.

### Alliance Issues

**Q: Why can't I join this alliance?**
A: Possible reasons:

-   Membership is closed (submit join request)
-   You're in 24-hour cooldown period
-   Alliance is full
-   You're already in an alliance

**Q: Why can't I manage alliance funds?**
A: You need the `manage_fund` permission. Only leaders and officers with this permission can withdraw or transfer funds.

**Q: How do I leave an alliance?**
A: Use the leave endpoint. Leaders must transfer leadership first.

### Resource Issues

**Q: Why are my resource balances negative?**
A: This shouldn't happen. If you see negative balances:

-   Check recent colonization (costs may have been deducted)
-   Check combat results (resources may have been stolen)
-   Contact support if issue persists

**Q: How do I transfer resources between planets?**
A: Use `/planets/{planetId}/resources/transfer` endpoint to move resources between your planets.

### WebSocket Issues

**Q: Why aren't I receiving real-time updates?**
A: Check:

-   WebSocket connection is established
-   Subscribed to correct channels
-   Your empire/alliance membership
-   Server connectivity

**Q: What channels should I subscribe to?**
A: Subscribe to:

-   `private-empire.{yourEmpireId}` - Your empire updates
-   `private-alliance.{yourAllianceId}` - Alliance updates (if in alliance)
-   `public-galaxy.{quadrant}.{sector}.{galaxy}` - Galaxy events
-   `public.tick` - Global tick notifications

---

## Glossary

### Core Terms

-   **Tick**: Discrete server step (~30 minutes)
-   **Homeworld**: Your starting planet, cannot be taken by another empire
-   **Colony**: Additional planets you've colonized, can be captured
-   **Empire**: Your player-controlled entity
-   **Alliance**: Group of empires working together

### Ships

-   **Stinger**: Disables ships for boarding
-   **Ship Boarder**: Captures disabled ships
-   **Invasion Ship**: Enables planet capture
-   **Resource Freighter**: Steals resources during combat
-   **Troop Carrier**: Destroys facilities and captures planets

### Facilities

-   **Mines**: Produce Tellerium
-   **Probes**: Produce Krypton
-   **Shipyard**: Enables ship construction
-   **Research Lab**: Enables research projects
-   **Tachyon Broadcast Center**: Improves signal success
-   **All-Frequency Module**: Detects cloaked ships
-   **Planetary Intelligence Headquarters**: Enables invasion ships

### Research

-   **Planetary Assault**: Unlocks planet capture capability
-   **Advanced Combat**: Unlocks advanced ships and weapons
-   **Warp Technology**: Reduces fleet travel time

### Resources

-   **Tellerium**: Manufacturing resource
-   **Krypton**: Fuel resource

### Alliance Terms

-   **Leader**: Alliance founder with full permissions
-   **Officer**: Member with assigned permissions
-   **Fund**: Alliance treasury (tellerium/krypton)
-   **Join Request**: Application to join closed alliance
-   **MOTD**: Message of the Day

### Combat Terms

-   **Init**: Initiative order (lower = fires first)
-   **Armour**: Ship defensive value
-   **Gun Power**: Ship offensive value
-   **Accuracy**: Hit chance
-   **Agility**: Evasion chance

---

## Advanced Mechanics

### Parallel Construction

-   Ships and defences are built in parallel
-   Up to 10 units build at normal speed
-   Larger quantities use diminishing returns scaling
-   Formula: `build_time = base_time × (1 + log10(quantity / 10))`

### Resource Production

-   Calculated per tick
-   Includes base planet yield
-   Molecular Extraction facility provides 20% bonus
-   Distributed across all planets

### Score Calculation

Detailed breakdown:

-   **Planets**: Base value per planet
-   **Mines**: Value per mine
-   **Probes**: Value per probe
-   **Facilities**: Value based on facility type and level
-   **Defences**: Value based on defence type and quantity
-   **Fleets**: Value based on ship type and quantity

### Combat Resolution

-   Deterministic using seeded RNG
-   Multiple rounds until one side is defeated
-   Ships fire in initiative order
-   Damage calculated per round
-   Losses tracked accurately
-   Planet capture checked after combat

### Planet Capture Mechanics

When a planet is captured:

1. Ownership transfers to attacker
2. Resources transfer to new owner
3. Mines and probes transfer
4. Facilities transfer (some may be destroyed)
5. Defences transfer (some may be destroyed)
6. Construction queues are cancelled
7. Defending fleets are destroyed
8. Capturing fleet is stationed at planet

---

## Support & Community

### Getting Help

-   Check this manual first
-   Review FAQ section
-   Check in-game News for announcements
-   Contact support for bugs or issues

### Reporting Bugs

When reporting bugs, include:

-   What you were trying to do
-   What happened instead
-   Relevant planet/fleet IDs
-   Screenshots if available
-   Combat logs if relevant

### Community

-   Join alliance chat for tips
-   Participate in galaxy discussions
-   Share strategies and experiences
-   Help new players learn the game

---

**Good luck, Commander. May your empire prosper and your fleets conquer the stars.**

---

_Last Updated: Version 1.0_
_Game: EmpireQuest_
_Platform: Browser-based Strategy Game_
