## Astralus UI Field Guide

This expanded guide documents every major interface surface in Astralus. Pair it with the Player Manual for gameplay rules and strategy. Each section includes navigation hints, interaction notes, and best practices.

---

### 0. Command Briefing

- A cinematic briefing now plays after registration, pairing the `assets/video/intro_tutorial.mp4` starfield reel with a voiced narrative (`assets/audio/tutorial_intro.mp3`) that frames the stakes and introduces core verbs.
- While the briefing runs, the client streams initial universe data in the background; if you skip the sequence the loader continues unobtrusively until the galaxy map is ready.
- Once briefing + data load complete, a guided orientation highlights the Galaxy Map, Command HUD, Quick Access Dock, and Holopad workspace with low-profile spotlights so you can tour without losing control.
- Onboarding progress is stored server-side (`PATCH /api/v1/me/onboarding`), so you will only see the full experience the first time per account unless reset by support.

### 1. Command Shell

#### 1.1 Persistent HUD

- Top glass panel showing empire name, resource snapshots, tick countdown (visible during final 2 minutes), active incidents.
- Auto-hides after 5 seconds of inactivity. Reopen via “Open HUD” chip in the top banner.
- Draggable desktop-style window; remembers last position.
- Quick toggles for overlays (advisor hints, comparison heatmap, planet overlays) appear when relevant contexts are active.

#### 1.2 Top Banner

- Left: static Astralus logo, aligned with sidebar width.
- Center: tick timer when in final 120 seconds; otherwise ambient status indicators.
- Right: minimised HUD opener, audio toggle (if enabled), user notifications badge.

#### 1.3 Quick Access Dock (Mini Sidebar)

- Thin vertical dock on the far left, always present.
- Avatar header shows empire crest; click to open profile and empire summary.
- Icon stack (top → bottom):
  - Notifications Feed
  - Mailbox
  - Construction Queue
  - Galaxy Map
  - Planets Roster
  - Fleet Command
  - Tech Encyclopaedia (Research)
  - Market Board
  - Signals Console
  - Holopad Desktop
  - Achievements
  - Settings & Preferences
  - Exit / Log out
- Tooltips and keyboard focus states reveal labels. Icons highlight when corresponding panel is open.

#### 1.4 Hub Sidebar (Primary Menu)

- Toggle via dock icon or `Hub` label.
- Categories:
  - **Command Center**: Notifications, Mail, Diplomatic Channels, Settings.
  - **Stellar Operations**: Galaxy Map, System View, Signals, Fleet Command, Holopad.
  - **Colonies & Industry**: Planets, Construction, Planetary Politics, Population tools.
  - **Research & Engineering**: Tech Encyclopaedia, Boosters, Achievements.
  - **Economy & Diplomacy**: Galactic Market, Quantum Credits, Alliances, Rankings.
  - **Fleet & Combat**: Fleet Overview, Combat Logs, Incident Response.
  - **Guides & Help**: UI Field Guide, Player Manual, Tutorials.
- Submenus expand inline; dynamic entries (e.g., “Your Planets”) update in real time.
- Right-click categories for context actions (e.g., “Open all colony panels”).

---

### 2. Navigation Surfaces

#### 2.1 Galaxy Map

- Core strategic canvas with fog of war, region outlines, system markers.
- Mouse wheel or buttons to zoom; drag to pan.
- Right-click context menu:
  - View system details
  - Queue scouting missions
  - Set fleet destination
  - Launch tachyon signal
  - Drop bookmarks (if unlocked)
- Incident icons overlay with severity glow.
- Filter toggles (left toolbar) for fleets, incidents, alliances, resource hotspots.

#### 2.2 System View

- Animated solar system layout with randomized star art per system.
- Owned planets display cyan halos and your avatar crest. Tooltips show colony summary.
- Unowned planets glow on hover; clicking opens recon dossier.
- Orbit layout ensures spacing; labels use compact typography.
- Bottom-right legend card displays region and system; includes “Back to Galaxy” button.
- Context buttons (top-right) for scanning, bookmarking, or opening system intel panels.

#### 2.3 Holopad Desktop

- Floating widget workspace.
- Widgets include Resources, Construction, Orbital Projects, Fleet Ops, Market Trends, Announcements, Achievements, Quantum Credits, custom analytics.
- Drag to reposition; resize via handle; close via widget header.
- Layout persists in local storage; reset via context menu.
- Holopad header shows layout presets and “Add Widget” catalog.

---

### 3. Colony & Planet Interfaces

#### 3.1 Planet Roster (`/planets`)

- Horizontal scroll carousel of owned worlds.
- Dots navigation indicates position; prompt text reminds users to scroll.
- Clicking planet opens Planet Hex Grid overlay with planet context.

#### 3.2 Planet Hex Grid Console (Owned Colonies)

- Split interface:
  - **Left**: Geodesic grid showing facility/defence placements, hex tooltips, construction statuses.
  - **Right**: Planet Build Console panel (collapsible).
- Build Console sections (accordion style, vertically scrollable):
  1. **Population**: Demographics, growth, edicts, specialization actions.
  2. **Fleet Command**: Quick missions (defend, attack, reinforce, colonize, transport) with inline forms.
  3. **Active Projects**: Construction queue filtered by type; cancel with refund summary.
  4. **Buildable Items**: Vertical list of facilities, ships, defences, research unlocked for this planet. Shows prerequisites, can_build status, missing requirements.
- Header provides planet name, coordinate, resource snapshot, open tech tree button.
- Minimize button docks console; reopen control stays accessible with icon.
- WebSocket events refresh grid and console when construction completes or population changes.

#### 3.3 Planet Detail Sheet

- Access from queue lists or context menus.
- Tabs for Overview, Production, Population, Projects, Fleets, Defences, Research.
- Supports direct build/research actions and queue drilling.

#### 3.4 Unowned Planet Recon Dossier

- Opens when selecting non-owned world in system view.
- Sections:
  - Status & ownership
  - Strategic value summary
  - Resource profile and potential yields
  - Known infrastructure or defences
  - Story/lore snippet (if available)
  - Action strip: launch signal, send fleet, open intel sheet, colonize (if prerequisites met).
- Scrollable content with glass styling.

---

### 4. Empire & Economy Management

#### 4.1 Construction Queue Panel

- Global list of all active facilities, ships, defences, research.
- Filters and tags for item type; progress bars with tick projections.
- Cancel action triggers refund toast showing returned resources.

#### 4.2 Build Detail Panel

- Used when queuing from tech tree or build console.
- Displays cost breakdown, build time, prerequisites (with badges and tooltips), quantity selector.
- Defences display missing prerequisites with caution badges; queue disabled until met.
- Sends POST to relevant endpoint; optimistically adds to construction store on success.

#### 4.3 Research Encyclopaedia & Tech Plans

- Main research screen with glass shell:
  - **Strategy Sidebar**: Filters, saved plans, overlays, comparison selection.
  - **Top Status Bar**: Era progress, empire metrics, plan management.
  - **Main Canvas**: Node network with column/row spacing, images, statuses.
  - **Advisor Drawer**: Recommendations, pinned/dismissed suggestions.
- Node actions:
  - Queue build/research
  - View dependencies and dependents
  - Add/remove from plan
  - Focus advisor on node
- Plans persist via backend (list/create/update/delete). WebSocket events sync across clients.
- Overlays: dependency heatmap, empire progress shading, planet comparison highlights.

#### 4.4 Market & Economy Panels

- **Market Orders**: Buy/sell interface with price charts, order book, order history.
- **Deals**: Player-to-player trades with filters and status badges.
- **Quantum Credits**: Currency status, booster activation, purchasing (if available).
- Glass dialogs for creating deals and moving resources.

#### 4.5 Alliance Management

- Alliance list with metadata; join requests open panel with forms.
- Donation dialog displays live empire and alliance balances; max buttons auto-fill.
- Alliance management panels include fund allocations, roles, announcements (if leader).

---

### 5. Fleet & Combat Operations

#### 5.1 Fleet Command Center

- Multi-step panel accessible via dock or planet console.
- Form supports coordinate input (`Region:System:Planet`), inline validation, destination preview.
- Ship manifest uses visual selectors; enforces required ships (e.g., colony ship for colonization).
- Supports resource payload, auto-return toggle, mission timing estimates.

#### 5.2 Fleet Overview & Missions

- List of active fleets with status badges (Traveling, Stationed, Combat, Colonizing).
- Tabs for stationed vs. in-flight.
- Action buttons: redirect (if allowable), recall, copy location.
- Travel time estimator tools accessible via context actions.

#### 5.3 Combat Log & Incident Boards

- Scrollable log of fleet engagements with filters (attacker, defender, location, outcome).
- Each entry links to system or planet context.
- Incident board covers wormholes, raids, anomalies; clicking opens incident detail panel.

#### 5.4 Signals Console

- Panel that tracks tachyon signals, response times, outcomes.
- Launch form supports legacy and new coordinate formats, auto-converts to X/Y.
- Integration with system view, planet dossier, fleet actions for prefilled targets.

---

### 6. Reconnaissance, Intel & Population

#### 6.1 Intel Panels

- System Intel: aggregated data for the current system (planets, defences, fleets, incidents).
- Planet Intel: deep dive into owned/unowned world data (facilities, population, history).

#### 6.2 Population Management Console

- Embedded in Planet Build Console:
  - Population profile (strata, morale, unrest, growth rate).
  - Draft metrics (militia, readiness).
  - Edicts list with activation forms and cooldown/status indicators.
  - Specialization selection with prerequisites and effect summaries.
- WebSocket events update data instantly (edict applied, specialization changed, unrest warnings).

#### 6.3 Notifications System

- Panel listing categorized events; click to open relevant context.
- Toasts appear for immediate alerts (construction complete, prerequisite missing, edict errors).
- HUD status chips blinking for severe incidents (attacks, overdrafts).

---

### 7. Holopad Widgets (Desktop Apps)

- **Resources Widget**: Tellerium, Krypton, Dark Matter balances, production rates, storage.
- **Market Trends**: Commodity price charts, volume, recent trades.
- **Fleet Operations**: Missions summary, jumps pending, alerts.
- **Quantum Credits**: Premium currency status, booster timers.
- **Announcements**: Patch notes, developer messages.
- **Achievements**: Progress towards milestones.
- **Orbital Construction**: Defence queue progress, cancel options.
- Widgets respect glass styling (`glass-section`).
- Layout manager prevents overlap; snapping ensures tidy arrangement.

---

### 8. Window & Panel System

- Common controls: close (X), minimize (chevron), expand.
- Panels stack with proper z-index; pointer events only when active.
- Minimized panels dock to bottom tray with icons.
- `panel-glass`, `surface-gradient`, and `card-glow` applied universally for aesthetics.
- Dialogs (`DialogContent`) use rounded corners, blurred backgrounds, and auto-centered alignment.
- Sliding panels (side drawers) share glass styling and obey pointer-event gating.

---

### 9. Coordinate & Navigation Utilities

- Standard format: `Region:System:Planet`. Inputs accept legacy `Quadrant:Sector:Galaxy:System:Planet`; auto-convert to X/Y.
- Tooltips show converted coordinates.
- Coordinate search bar resolves both hierarchical and cartesian forms.
- Fleet and signal forms validate coordinates before submission, with descriptive errors.

---

### 10. Notifications & Overlays

- Notification panel accessible via dock and HUD chip.
- Filters by category: Construction, Combat, Diplomacy, Economy, Population, Incidents.
- Clicking entries deep-links to panels or map contexts.
- Overlays (advisor hints, comparison, progress) toggled via HUD and tech tree sidebar.

---

### 11. Guides & Help

- Hub Sidebar → Guides & Help includes:
  - **UI Field Guide** (this document rendered in panel).
  - **Player Manual** (full gameplay manual in-app).
  - Future tutorials/FAQ entries (placeholder for onboarding).
- Panels open in glass dialogs with scrollable content and quick links.

---

### 12. Quick Reference Tables

| Surface            | Access                        | Purpose              | Key Actions                               |
| ------------------ | ----------------------------- | -------------------- | ----------------------------------------- |
| Galaxy Map         | Quick Dock, Hub → Stellar Ops | Strategic navigation | Warp, scouting, set fleet routes          |
| System View        | From Galaxy Map               | Planet interaction   | Open colony console, recon dossiers       |
| Holopad            | Quick Dock                    | Custom dashboards    | Arrange widgets, monitor empire           |
| Planet Console     | Planet click                  | Colony management    | Build, queue research, manage population  |
| Recon Dossier      | Unowned planet click          | Intel & interactions | Launch signals, colonize                  |
| Tech Encyclopaedia | Quick Dock, Hub → Research    | Research planning    | Queue tech, manage plans, toggle overlays |
| Construction Queue | Quick Dock, Hub → Colonies    | Build oversight      | Track progress, cancel builds             |
| Fleet Command      | Quick Dock, Planet Console    | Launch missions      | Configure fleets, orders, payloads        |
| Market Board       | Quick Dock, Hub → Economy     | Trading              | Place orders, manage deals                |
| Signals Console    | Quick Dock, Hub → Stellar Ops | Communications       | Launch signals, review history            |
| Notifications      | HUD, Quick Dock               | Event triage         | Filter alerts, deep link to context       |

---

Keep this field guide open while exploring the interface. For mechanics, strategy tips, and lore, refer to `docs/PLAYER_MANUAL.md`. Both documents are accessible in-game via the “Guides & Help” menu. Command the stars with confidence, Commander.
