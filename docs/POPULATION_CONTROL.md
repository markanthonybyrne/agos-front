Gameplay Experience Concept
Foundation: Homeworld Population Layer
Every empire homeworld now tracks full population strata (engineers, cultivators, pioneers) with unique baseline ratios influenced by founding lore.
Homeworld strata drive empire-wide modifiers: engineers boost fleet shipyards, cultivators enhance secondary resource refinement efficiency, pioneers uplift exploration morale.
Player unlocks a “Homeworld Command” panel day one, showing dynamic population bars, morale, and special homeworld perks.
Population Management & Control
Players set edicts each cycle via preset packages (Balanced, Industrial Surge, Cultural Revival, Defense Stand) or custom sliders.
Enacting edicts applies direct homeworld bonuses but causes unrest if used excessively; unrest manifests as sabotage, production slowdowns, or loyalty drift.
“Population Control” actions (rationing, propaganda, celebrations) consume secondary resources to mitigate unrest or temporarily boost compliance.
Planetary Draft Limits in Practice
Homeworld and colonies each display a draft capacity meter; moving troops or queuing fleet builds draws from the homeworld first.
Overdraft triggers narrative events (protests, council confrontations) and reduces loyalty; staying within limits grants “Prepared Defenders” buffs in battle.
Veterans returning from front lines become a new population subtype—Veterans—that provide tactical buffs but desire amenities.
New Facilities & Defenses
Civil Cohesion Hub: boosts morale recovery, reduces edict cooldowns.
Conscription Nexus: raises draft capacity and adds veteran training slots.
Cultural Forum: converts secondary resource rituals into empire-wide loyalty buffs.
Orbital Bastion: defense platform scaling with population goodwill; ties draft ratio to defensive firepower.
Facilities have tiers, each unlocking via new research nodes and requiring specific biocycle resources.
Research Threads
Adaptive Governance: unlocks advanced edicts, reduces unrest penalties.
Population Logistics: enhances draft capacity calculations, shortens troop training times.
Veteran Integration: allows veterans to inspire colonies, creating special missions or building discount.
Gameplay Flow
Player opens homeworld panel, reviews strata distribution, draft capacity, unrest level.
Chooses an edict for immediate strategic focus (e.g., Defense Stand before a war).
Checks facilities queue; invests in Civil Cohesion Hub to handle upcoming edict stress.
Uses population control action (Cultural Ceremony) consuming secondary resources to calm unrest triggered by conscription.
During incoming invasion, monitors draft meter; decides to push beyond capacity, accepts risk, then handles resulting unrest through events.
Research progression unlocks better management tools—improved edicts, more efficient draft formulas, new facility upgrades.
Loop continues as player balances fleet needs, economic output, and loyalty, creating constant tension and narrative depth.
Backend Implementation Plan
Models & Data
Extend Empire and Colony models to include population_strata array, draft_capacity, current_draft, unrest_level, and veteran_population.
Add new Facility types with upgrade tiers in configuration, linking to resource costs and required research.
Business Logic
Update population tick to recalculate strata percentages based on edicts, facilities, and events.
Implement edict effect handlers (multipliers on production, research, morale) with cooldown tracking.
Draft capacity formula: Population * InfrastructureModifier * LoyaltyModifier * FacilityBonus.
Overdraft logic triggers event queue entries (unrest incidents, sabotage) and applies penalties.
Veteran integration: track returning troop counts, adjust colony morale and add optional missions.
Events & Narrative Hooks
Create event templates for edict fatigue, overdraft protests, veteran celebrations.
Link events to existing morale/rebellion system, ensuring thresholds align with current logic.
Research Tree Updates
Add new nodes to tech tree data, tying prerequisites to existing structures and secondary resources.
Update research processing to apply new modifiers (edict cooldown reduction, draft capacity scaling).
APIs / Services
Enhance population service to manage edict applications, cooldowns, and history.
Extend battle preparation service to query draft capacity and surface warnings.
Modify resources service to accommodate new facility costs and ritual actions.
Persistence & Migration
Database migration to store new fields for colonies/empires (JSON columns for strata, integers for draft metrics).
Backfill script sets default strata distribution and draft capacity for existing saves based on current population and infrastructure.
Testing & Telemetry
Unit tests for strata calculation, edict effects, draft capacity thresholds.
Integration tests covering facility upgrades, research unlocks, overdraft event triggers.
Telemetry events measuring edict usage, overdraft frequency, veteran outcomes for balance tuning.
Front-End Gameplay Scoping Doc
Views & Components
HomeworldCommandPanel (new):
Tabs: Strata, Draft, Facilities, Research.
Strata tab: stacked bar chart, edict selector, unrest indicator.
Draft tab: gauge meter, readiness breakdown, veteran stats.
Facilities tab: build/upgrade queue, resource cost display.
Research tab: context overlay linking to existing tech tree UI.
ColonyManagementPanel updates:
Add mini widget summarizing draft capacity and edict effects per colony.
Alert badges when unrest events trigger.
BattlePrepScreen enhancements:
Conscription warning modal when queuing fleets that overdraft.
Display positive effects when within safe draft limits.
UX Flows
Edict Selection: drop-down or presets with tooltip trade-offs, confirmation modal showing cooldown and predicted unrest change.
Facility Build Flow: uses existing build queue UI with new icons and animated cards.
Ritual Actions: button on Strata tab; triggers resource requirement check and plays short narrative pop-up on success/failure.
Event Handling: integrate new event types into existing notification panel with themed art.
Visual & Audio Design
Asset set for new facilities, edict icons, strata portraits.
Color-coded gauges (green/yellow/red) for draft meter and unrest state.
Audio stingers for edict activation, unrest escalation, veteran returns.
Technical Notes
Reuse existing state management; add new slices for strata data, draft stats, facility queue.
API endpoints:
GET /colonies/{id}/population (strata, draft, unrest).
POST /colonies/{id}/edicts (apply edict).
POST /colonies/{id}/rituals.
POST /facilities/build & /upgrade.
Ensure optimistic UI updates with rollback if backend rejects action (e.g., insufficient resources).
Accessibility & Usability
Tooltips explaining each metric; color contrast safe for gauges.
Quick access keyboard shortcuts for switching between Homeworld tabs.
Tutorial overlay introducing population management on first use.
Milestones
Wireframes for Homeworld panel + updated colony view.
API contract review with backend.
Implement Strata tab with live data and edict actions.
Add draft meter integration and battle prep warnings.
Ship facilities UI with build interactions.
Final polish: event notifications, audio cues, localization.
Let me know if you want deeper breakdowns per feature or dev estimates.