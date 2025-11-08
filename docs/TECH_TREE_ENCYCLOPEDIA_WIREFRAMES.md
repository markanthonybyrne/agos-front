# Tech Tree Encyclopaedia — UX Blueprint

This document captures the interaction model, screen structure, and content choreography for the redesigned Astralus tech tree. It is meant to guide visual design and subsequent implementation work. All layouts assume the updated glassmorphism aesthetic and slug-driven imagery for tech items.

---

## 1. Screen-Level Information Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  A. Global Header (existing desktop HUD)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  B. Encyclopaedia Shell                                                      │
│  ┌───────────────┬───────────────────────────────────────────────┬────────┐ │
│  │ B1. Strategy  │ B2. Tech Canvas (5-8 columns, scroll+pan)     │ B3.     │ │
│  │     Sidebar   │   • Era columns with expandable branches       │ Advisor│ │
│  │   • Filters   │   • Node cards w/ imagery                      │ Drawer │ │
│  │   • Saved     │   • Connection layer (curved links)            │ toggle │ │
│  │     Plans     │   • Quick summary strip (era progression)      │ button │ │
│  │   • Toggles   │                                               │        │ │
│  └───────────────┴───────────────────────────────────────────────┴────────┘ │
│  └─ Sticky Footer: Planet selector • Compare • Queue • Legend / minimap ───┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Persistent Regions

- **Strategy Sidebar (B1)**
  - Tiered filter chips (Era, Specialization, Node Type, Locked state).
  - Advisor prompts (contextual tips + CTA).
  - Saved research plans (user-defined sequences).
  - Toggle buttons for overlays (Dependency Heatmap, Planet Comparison, Empire Progress).

- **Tech Canvas (B2)**
  - Scroll/pan canvas with inertia.
  - Era columns anchored top-to-bottom; each branch collapsible.
  - Column header badges (Era name, era reward, completion %).
  - Minimap overlay (bottom-right) for quick navigation.

- **Advisor/Insights Drawer (B3)**
  - Slide-in glass panel with advisor portrait, voice lines, recommended next picks, risk alerts.
  - Triggered via nodes or strategy sidebar prompts.

### Footer Controls

- Planet selector (dropdown) for “queue on planet” context.
- Comparison mode toggle (multi-select planets).
- Queue/Build actions (continuous call-to-action bar).
- Legend button to explain colors/link types.

---

## 2. Tech Canvas Layout (Column Grid)

```
Era Column (example)
┌───────────────────────────────┐
│ ERA II — INDUSTRIAL ASCENT    │  <- header pill (progress ring, effect summary)
├───────────────────────────────┤
│   Node Card                  ▲│  <- branch label toggle (collapse)
│  ┌─────────────────────────┐ ││
│  │  IMAGE (16:9 clipped)   │ ││
│  │  Holo frame & rarity    │ ││
│  └─────────────────────────┘ ││
│  • Name & status chips       ││
│  • Key stats (cost, time)    ││
│  • Unlocks icons             ││
│  • CTA: Queue / Details      ││
│  • Hover: dependency lines   ││
│                               ││
│  (child nodes indented)       ││
│    └─ Branch Node (compact)   ││
│       …                       ││
└───────────────────────────────┘
```

### Node Card States

- **Primary view**: large card with slug-based art, status ribbon, action buttons.
- **Compact view**: when column is collapsed, show icon + name chip (hover reveals mini card).
- **Locked nodes**: grayscale art with prerequisites chips; clicking opens dependency stack popover.
- **Queued/Active**: show progress ring overlay, queue position, planet badge.

### Connection Layer

- Bezier curves routed under cards; color-coded by dependency type (research vs facility vs cross-era).
- Hovering a node highlights upstream prerequisites and downstream unlocks with glow animation.
- Optional heatmap overlay shades nodes/links based on empire readiness.

---

## 3. Node Detail Drawer (Encyclopaedia Entry)

```
┌──────────────────────────────────────────────────────────────────┐
│ [Hero Image Carousel]                                            │
│  - Primary art (slug image)                                      │
│  - Secondary visuals (concept art / hologram)                    │
├──────────────────────────────────────────────────────────────────┤
│ Title + status chips + specialization tags                       │
│ Key metrics grid (cost, time, upkeep, unlocks)                   │
│ Dependency stack (interactive path)                              │
│ Builds / unlocks listing (cards with drill-down)                 │
│ Empire impact (graphs: production change, modifiers)             │
│ Recommended planets & advisors comments                          │
│ Action buttons (Queue, Compare, Mark in plan)                    │
└──────────────────────────────────────────────────────────────────┘
```

- Uses glass panel styling, full-height with scroll.
- Supports image fallbacks (placeholder hologram, slug-labeled).
- Advisor tab with quote, recommended combos, synergy tags.
- Comparison tab when multiple nodes selected.

---

## 4. Overlay Modes

### 4.1 Dependency Heatmap

- Toggles gradient overlay based on path distance or empire readiness.
- Legend clarifies color scale.
- Updates in real time when empire state changes (WebSocket-subscription requirement).

### 4.2 Planet Comparison

- Select up to 3 planets; overlay node badges showing planet eligibility (badges atop cards).
- Sidebar section converts to comparison matrix (columns per planet, rows per selected node).
- Queue CTA adjusts to chosen planet; advisor drawer surfaces warnings (e.g., missing labs).

### 4.3 Empire Progress

- Shows major goals (era unlocks, specialization milestones) as a horizontal timeline above the canvas.
- Highlights nodes currently in research/build queue.
- Advisor prompts highlight next recommended steps.

---

## 5. Interaction Flow Highlights

1. **Browse Era**: user scrolls vertically through columns; column headers remain sticky at top when in view.
2. **Node Focus**: clicking highlights dependencies, opens detail drawer; double-click zooms to branch.
3. **Queue Action**: CTAs adapt: if planet context selected, queue directly; otherwise, open planet picker (floating modal).
4. **Plan Creation**: user drags nodes into Sidebar “Saved Plan”; reorder via drag; plan persists in local storage.
5. **Advisor Assist**: when overlays detect conflicting prerequisites, advisor drawer auto-opens with resolution tips.
6. **Realtime Updates**: empire socket events update node statuses, overlays, and queue indicators without page refresh.

---

## 6. Asset & Styling Notes

- **Images**: Load via helper `getTechImage(node)` resolving to `/assets/images/{type}/{slug}.webp` (fallback to `/assets/images/sections/tech-placeholder.webp`).
- **Glass Treatment**: consistent rounded corners (`rounded-3xl`), layered glows, particle shaders behind hero images.
- **Typography**:
  - Headings: `font-heading`, uppercase with tracking.
  - Body: `font-sans`, subtle text-shadow for legibility over imagery.
- **Iconography**: Use existing lucide icons for status; add custom svg overlays for era badges.

---

## 7. Implementation Checklist (for subsequent todos)

- Build `techImageRegistry` utility (slug → import).
- Introduce `EraColumn`, `BranchGroup`, `NodeCard` components with props for overlays.
- Add `useEmpireSocketSync` hook to merge WebSocket events into tech tree state.
- Prototype overlays with stub data before wiring to live metrics.
- Validate layout with sample data set (rich branch vs sparse).

---

_End of wireframe/IA document._
