// API Response Types
import { Coordinate } from './game.types'

export interface ApiResponse<T> {
  status: 'ok' | 'error'
  data?: T
  message?: string
  code?: string
  details?: Record<string, string[]>
}

// Premium Currency Types
export interface QuantumCreditsTransaction {
  id?: number
  amount: number
  type: 'earned' | 'purchased' | 'spent' | 'granted' | 'adjusted'
  reason: string
  metadata?: Record<string, any>
  created_at: string
}

export interface QuantumCreditsBalance {
  balance: number
  last_daily_login_claim: string | null
  daily_login_streak: number
  can_claim_daily: boolean
  transactions: QuantumCreditsTransaction[]
}

export interface QuantumCreditPackage {
  key: string
  slug?: string
  id?: string | number
  name: string
  credits: number
  price: number
  currency: string
  description?: string
  badge?: string | null
  perks?: string[]
  icon?: string | null
  most_popular?: boolean
}

export interface QuantumCreditPackagesResponse {
  packages: QuantumCreditPackage[]
}

export interface QuantumCreditPurchaseIntentRequest {
  package: string
}

export interface QuantumCreditPurchaseIntentResponse {
  client_secret: string
  payment_intent: string
  purchase_id: string
  publishable_key: string
}

export interface ActiveBooster {
  id: number
  type: 'production' | 'construction' | 'signal' | 'secondary_extraction'
  multiplier: string
  started_at: string
  expires_at: string
  metadata?: Record<string, any>
}

export interface ActiveBoostersResponse {
  boosters: ActiveBooster[]
}

export interface ActivateBoosterRequest {
  type: 'production' | 'construction' | 'secondary_extraction'
}

export interface ActivateBoosterResponse {
  booster: {
    id: number
    empire_id: number
    booster_type: string
    multiplier: string
    started_at: string
    expires_at: string
  }
  cost: number
  new_balance: number
}

export interface Achievement {
  slug: string
  unlocked_at: string | null
  quantum_credits_awarded: number
  progress_percent?: number
  progress_current?: number
  progress_target?: number
}

export interface AchievementsResponse {
  achievements: Achievement[]
  available: Record<string, number>
  progress?: Record<
    string,
    {
      current: number
      target: number
      percent?: number
    }
  >
}

export type ResourceRarity = 'common' | 'rare' | 'exotic'

export interface SecondaryResourceLedgerEntry {
  slug: string
  name: string
  quantity: number
  capacity: number
  rarity: ResourceRarity
  icon?: string | null
  delta?: number
}

export interface SecondaryResourceLedger {
  total_capacity: number
  used_capacity: number
  capacity_bonus_percent?: number
  entries: SecondaryResourceLedgerEntry[]
}

export type SecondaryResourceDelta = Record<string, number>

export interface SecondaryReserve {
  slug: string
  name?: string
  rarity?: ResourceRarity
  remaining: number
  initial?: number
  richness?: number
  replenish_rate?: number
  depleted_at?: string | null
  last_extraction_at?: string | null
}

// Direct response types (for endpoints that don't wrap responses)
export interface DirectResponse<T> {
  [key: string]: T
}

export interface Role {
  id: number
  name: string
  slug: string
  permissions?: string[]
}

export interface User {
  id: number
  username: string
  email: string
  last_login?: string
  created_at: string
  onboarding_completed?: boolean
  // Optional fields used in settings UI
  api_token?: string
  role?: string // Legacy field, use roles array instead
  roles?: Role[] // Array of roles from /auth/me
  token_expires_at?: string
  avatar_path?: string // Deprecated - use avatar_url instead
  avatar_url?: string
  suspended_at?: string | null
  suspended_reason?: string | null
}

export interface TickTiming {
  current_tick: number
  next_tick_eta: string
}

export interface Empire {
  id: number
  name: string
  score: number
  rank?: number
  planets_owned: number
  alliance_id?: number
  homeworld_planet_id: number
  created_at: string
  description?: string
  // Optional fields for rankings UI
  planets?: any[]
  fleets?: any[]
  alliance?: { name?: string } | null
  // New tech tree fields
  active_era?: number // Current era (1-5)
  specializations_unlocked?: string[] // Array of specializations: 'industrial', 'military', 'relic'
  dark_matter_current?: number // Current dark matter amount
  dark_matter_capacity?: number // Maximum dark matter capacity
  active_research_effects?: Record<string, number | boolean> // Active research effects aggregated
  active_boosters?: ActiveBooster[]
  secondary_resources?: SecondaryResourceLedgerEntry[]
  secondary_capacity?: number
  secondary_capacity_used?: number
  secondary_capacity_bonus_percent?: number
  secondary_resource_delta?: SecondaryResourceDelta
  avatar_url?: string | null
  avatar_path?: string | null
}

// Fog of War Types
export type DiscoveryStatus = 'visible' | 'fogged' | 'hidden'
export type DiscoveryMethod = 'homeworld' | 'research' | 'signal' | 'unknown'

export interface FogOfWar {
  is_visible: boolean
  discovery_status: DiscoveryStatus
  discovery_method: DiscoveryMethod
  region_visible: boolean
  system_visible: boolean
  planet_discovered: boolean
}

// Region and System Types
export type RegionTheme = 'frozen' | 'molten' | 'desert' | 'oceanic' | 'forest' | 'urban' | 'void' | 'habitable' | 'industrial' | string

export interface GeometryCenter {
  x: number
  y: number
}

export interface GeometryBounds {
  min_x: number
  max_x: number
  min_y: number
  max_y: number
}

export interface GeometryDescriptor {
  center: GeometryCenter
  radius: number
  bounds?: GeometryBounds
}

export interface Announcement {
  id: number
  title: string
  summary?: string | null
  body?: string | null
  content?: string | null
  slug?: string | null
  priority?: 'info' | 'warning' | 'critical' | string | null
  is_pinned?: boolean
  published_at?: string
  updated_at?: string
  link_url?: string | null
  metadata?: Record<string, any>
}

export interface AnnouncementListResponse {
  announcements: Announcement[]
}

export interface AnnouncementResponse {
  announcement: Announcement
}

export interface Region {
  region: number
  name: string
  theme?: RegionTheme
  visibility?: {
    is_visible: boolean
    discovery_method?: DiscoveryMethod
  }
  discovery_status?: DiscoveryStatus
  x_range: { min: number; max: number }
  y_range: { min: number; max: number }
  geometry?: GeometryDescriptor
}

export interface System {
  region: number
  system: number
  name: string
  visibility?: {
    is_visible: boolean
  }
  discovery_method?: DiscoveryMethod
  discovery_status?: DiscoveryStatus
  x_range: { min: number; max: number }
  y_range: { min: number; max: number }
  geometry?: GeometryDescriptor
}

export interface Planet {
  id: number
  name: string
  coordinate: string | Coordinate
  state: 'homeworld' | 'colony' | 'unsettled'
  mines: number
  probes: number
  tellerium_balance: number
  krypton_balance: number
  facilities?: Record<string, number>
  defence_grid?: Record<string, number>
  // New: planet type for imagery
  type?: { 
    slug: 'arid' | 'oceanic' | 'volcanic' | 'ice' | 'asteroid' | 'barren' | 'temperate' | 'toxic' | 'crystalline' | 'gas_giant' | 'terran' | 'blue_planet' | 'blue-planet' | 'blue-planet-space' | 'dwarf' | 'exotic' | 'forest' | 'jungle' | 'metallic' | 'molten' | 'nebulous' | 'plasma' | 'quantum' | 'ringed' | 'rocky' | 'sol' | 'sol_angry' | 'sol-angry' | 'sol_massive' | 'sol-massive' | 'swamp' | 'tropical' | 'tundra' | 'yellow' | string; 
    name: string
    description?: string
  }
  production?: {
    tellerium_per_tick: number
    krypton_per_tick: number
  }
  owner_empire_id?: number
  visibility?: {
    is_visible: boolean
    discovery_method?: 'homeworld' | 'research' | 'signal' | 'scout'
  }
  fog_of_war?: FogOfWar // New fog of war data
  discovered?: boolean // Alternative field name
  // Stored region/system columns (preferred over computed values)
  region?: number
  system?: number
  // X/Y coordinates (0-999 grid) - source of truth for positioning
  x?: number
  y?: number
  // Galaxy and system names for map display
  galaxy_name?: string | null
  system_name?: string | null
  // Region name for new coordinate system
  region_name?: string | null
  is_habitable?: boolean // For colonization checks
  secondary_reserves?: SecondaryReserve[]
  geometry?: {
    system?: GeometryDescriptor
  }
}

export interface Fleet {
  id: number
  ships: Record<string, number>
  origin_coordinate: string
  destination_coordinate: string
  status: 'stationed' | 'travelling' | 'arrived' | 'in_combat' | 'returning' | 'in_transit'
  order_type: 'attack' | 'defend' | 'station' | 'return' | 'colonize' | 'transport'
  departure_tick: number
  arrival_tick: number
  travel_time_ticks?: number
  auto_return_on_failure?: boolean
  resources?: {
    tellerium: number
    krypton: number
  }
}

export interface Signal {
  id: number
  target_coordinate: string
  signal_type: 'fleet' | 'orbital_defence' | 'planetary' | 'all_frequency_fleet'
  success: boolean
  cost: {
    tellerium: number
    krypton: number
  }
  result?: Record<string, any>
  created_at: string
}

// Incident Types
export type IncidentType = 'wormhole' | 'asteroid_storm' | 'resource_rush' | 'pirate_raid' | 'anomaly'
export type IncidentStatus = 'active' | 'expired' | 'completed'

export interface IncidentLocation {
  x: number
  y: number
  region: number
  system: number
}

export interface WormholeIncident {
  destination_region: number
  success_chance: number
  uses: number
  max_uses: number
}

export interface AsteroidStormIncident {
  damage_per_tick: number
  threat_level: 'low' | 'medium' | 'high'
}

export interface ResourceRushIncident {
  resource_type: 'tellerium' | 'krypton' | 'both'
  bonus_multiplier: number
}

export interface PirateRaidIncident {
  threat_level: 'low' | 'medium' | 'high'
  target_planet_id?: number
}

export interface AnomalyIncident {
  discovered: boolean
  discovered_by_you: boolean
  research_bonus: number | null
}

export interface Incident {
  id: number
  type: IncidentType
  name: string
  description: string
  location: IncidentLocation
  radius: number
  started_at_tick: number
  expires_at_tick: number | null
  duration_ticks: number
  status: IncidentStatus
  wormhole?: WormholeIncident
  asteroid_storm?: AsteroidStormIncident
  resource_rush?: ResourceRushIncident
  pirate_raid?: PirateRaidIncident
  anomaly?: AnomalyIncident
  your_interactions?: number
}

export interface InteractIncidentRequest {
  fleet_id?: number // Required for wormhole interactions
}

export interface InteractIncidentResponse {
  status: 'success' | 'error'
  message: string
  data?: {
    success: boolean
    destination?: {
      x: number
      y: number
      region: number
    }
    research_bonus?: number
    revealed_systems?: string[]
  }
}

export interface IncidentInteraction {
  id: number
  incident_id: number
  interaction_type: string
  success: boolean
  result?: Record<string, any>
  created_at: string
}

export interface Alliance {
  id: number
  name: string
  tag: string
  description?: string
  avatar_path?: string
  avatar_url?: string
  leader: {
    id: number
    name: string
  }
  member_count: number
  total_score?: number
  average_score?: number
  fund_tellerium: number
  fund_krypton: number
  funds?: {
    tellerium: number
    krypton: number
  }
  // Optional totals for rankings cards
  tellerium_balance?: number
  krypton_balance?: number
  members?: Array<{
    empire_id: number
    empire_name: string
    role: string
    joined_at: string
  }>
  created_at: string
  // New alliance system fields
  mission_statement?: string
  homepage_url?: string | null
  motd?: string | null
  open_membership?: boolean
}

// Alliance Permission Types
export type AlliancePermission = 
  | 'manage_fund'
  | 'recruit_members'
  | 'kick_members'
  | 'manage_groups'
  | 'edit_global_options'
  | 'view_join_requests'
  | 'view_status'

export interface AlliancePermissions {
  manage_fund: boolean
  recruit_members: boolean
  kick_members: boolean
  manage_groups: boolean
  edit_global_options: boolean
  view_join_requests: boolean
  view_status: boolean
}

// Alliance Creation Request Types
export interface AllianceCreationRequestCoordinate {
  quadrant: number
  sector: number
  galaxy: number
  planet: number
}

export interface AllianceCreationRequest {
  id: number
  creator: {
    id: number
    name: string
  }
  name: string
  tag: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  approvals_required: number
  approvals_received: number
  my_status?: 'pending' | 'approved' | 'rejected'
  supporters?: Array<{
    empire_id: number
    empire_name: string
    status: 'pending' | 'approved' | 'rejected'
  }>
  created_at: string
}

export interface CreateAllianceCreationRequest {
  name: string
  tag: string
  coordinates: AllianceCreationRequestCoordinate[]
}

export interface SupportAllianceCreationRequest {
  action: 'approve' | 'reject'
}

// Alliance Join Request Types
export interface AllianceJoinRequest {
  id: number
  alliance_id: number
  applicant: {
    id: number
    name: string
    score: number
    planets_owned: number
  }
  alliance?: {
    id: number
    name: string
    tag: string
  }
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export interface CreateJoinRequest {
  message: string
}

export interface RespondToJoinRequest {
  action: 'accept' | 'reject'
}

// Alliance Group Types
export interface AllianceGroup {
  id: number
  name: string
  members: Array<{
    id: number
    name: string
  }>
  permissions: AlliancePermissions
}

export interface CreateAllianceGroup {
  name: string
  members: number[]
  permissions: AlliancePermissions
}

export interface UpdateAllianceGroup {
  name?: string
  members?: number[]
  permissions?: Partial<AlliancePermissions>
}

// Alliance Member Types
export interface AllianceMember {
  id: number
  name: string
  score: number
  planets_owned: number
  percentile: number
  online: boolean
  homeworld: {
    name: string
    quadrant: number
    sector: number
    galaxy: number
    planet: number
  }
  role: string
}

// Alliance Status Types
export interface AllianceStatusFleet {
  fleet_id: number
  owner: {
    id: number
    name: string
  }
  origin: {
    quadrant: number
    sector: number
    galaxy: number
    planet: number
  }
  destination: {
    quadrant: number
    sector: number
    galaxy: number
    planet: number
  }
  order_type: string
  arrival_tick: number
  current_tick: number
}

export interface AllianceStatus {
  outgoing: AllianceStatusFleet[]
  incoming: AllianceStatusFleet[]
}

// Alliance Homepage Types
export interface AllianceHomepage {
  alliance: {
    id: number
    name: string
    tag: string
    mission_statement?: string
    homepage_url?: string | null
    avatar_url?: string
    member_count: number
    total_score: number
    average_score: number
    leaders: Array<{
      id: number
      name: string
      score: number
    }>
    members: Array<{
      id: number
      name: string
      score: number
      role: string
    }>
  }
}

// Global Options Types
export interface AllianceGlobalOptions {
  open_membership?: boolean
  mission_statement?: string
  homepage_url?: string | null
  motd?: string | null
}

// Alliance Fund Types
export interface AllianceFundBalance {
  tellerium: number
  krypton: number
}

export interface WithdrawFundsRequest {
  tellerium: number
  krypton: number
}

export interface TransferFundsRequest {
  planet_id: number
  tellerium: number
  krypton: number
}

export interface FundTransferResponse {
  transfer: {
    planet_id: number
    tellerium: number
    krypton: number
  }
  fund_balance: AllianceFundBalance
}

// Combat Log Types
export interface CombatLog {
  id: number
  tick_number: number
  attacker_empire_id: number
  attacker_empire_name: string
  defender_empire_id: number
  defender_empire_name: string
  planet_id: number
  planet_coordinate: string
  attacker_ships: Record<string, number>
  defender_ships: Record<string, number>
  defender_defences: Record<string, number>
  attacker_losses: Record<string, number>
  defender_losses: Record<string, number>
  defender_defence_losses: Record<string, number>
  resources_stolen?: {
    tellerium: number
    krypton: number
  }
  planet_captured: boolean
  attacker_won: boolean
  rounds: number
  created_at: string
}

// Hierarchical visibility items from map endpoint
export interface VisibilityItem {
  visibility?: {
    is_visible: boolean
    discovery_method?: 'homeworld' | 'research' | 'signal' | 'scout'
  }
  discovered?: boolean // Alternative field name
}

export interface VisibleQuadrant extends VisibilityItem {
  quadrant: number
}

export interface VisibleSector extends VisibilityItem {
  quadrant: number
  sector: number
}

export interface VisibleGalaxy extends VisibilityItem {
  quadrant: number
  sector: number
  galaxy: number
  name?: string | null
}

export interface UniverseMap {
  // Hierarchical visibility arrays (NEW - from backend)
  quadrants?: Array<VisibleQuadrant>
  sectors?: Array<VisibleSector>
  galaxies?: Array<VisibleGalaxy>
  planets?: Array<Planet> // Flat array of planets
  // Region and system arrays (NEW - for fog of war)
  regions?: Array<Region>
  systems?: Array<System>
  // Region and system names (from API response)
  region_names?: Record<string, string> // Map of region number to name
  system_names?: Record<string, string> // Map of "region:system" to name
  
  // Nested structure (legacy - still supported)
  quadrants_nested?: Array<{
    id: number
    visibility?: {
      is_visible: boolean
      discovery_method?: 'homeworld' | 'research' | 'signal' | 'scout'
    }
    discovered?: boolean // Alternative field name
    sectors: Array<{
      id: number
      visibility?: {
        is_visible: boolean
        discovery_method?: 'homeworld' | 'research' | 'signal' | 'scout'
      }
      discovered?: boolean // Alternative field name
      galaxies: Array<{
        id: number
        visibility?: {
          is_visible: boolean
          discovery_method?: 'homeworld' | 'research' | 'signal' | 'scout'
        }
        discovered?: boolean // Alternative field name
        planets: Array<{
          coordinate: string | Coordinate
          name: string
          owner_empire_id?: number
          state: string
          visibility?: {
            is_visible: boolean
            discovery_method?: 'homeworld' | 'research' | 'signal' | 'scout'
          }
          discovered?: boolean // Alternative field name
        }>
      }>
    }>
  }>
}

export interface Ranking {
  rank: number
  empire_id: number
  empire_name: string
  score: number
  planets_owned: number
  // Optional fields used by UI widgets
  name?: string
  total_score?: number
  total_empires?: number
}

export interface ExplorationStatus {
  current_level: 'homeworld' | 'sector' | 'quadrant' | 'full'
  unlocks: {
    sensor_technology: boolean
    deep_space_scanning: boolean
    propulsion_tech: boolean
    warp_technology: boolean
  }
  homeworld_location: { quadrant: number; sector: number; galaxy: number }
  max_fleet_range: 'same_galaxy' | 'cross_galaxy' | 'cross_sector' | 'cross_quadrant'
}

export interface VisibilityResponse {
  visibility_level: 'region' | 'system' | 'planet' | string
  visible_regions?: Array<{
    region: number
    name: string
    discovery_method: DiscoveryMethod
    discovery_status: DiscoveryStatus
    x_range: { min: number; max: number }
    y_range: { min: number; max: number }
    geometry?: GeometryDescriptor
  }>
  visible_systems?: Array<{
    region: number
    system: number
    name: string
    discovery_method: DiscoveryMethod
    discovery_status: DiscoveryStatus
    x_range: { min: number; max: number }
    y_range: { min: number; max: number }
    geometry?: GeometryDescriptor
  }>
  visible_galaxies?: Array<{
    quadrant: number
    sector: number
    galaxy: number
    discovery_method: string
  }>
  visible_sectors?: Array<{
    quadrant: number
    sector: number
  }>
  visible_quadrants?: Array<{
    quadrant: number
  }>
  unlocked_by: {
    sensor_technology: boolean
    deep_space_scanning: boolean
    quantum_sensors?: boolean
    galactic_mapping?: boolean
  }
  fleet_range?: {
    level: string
    can_travel_to_sector: boolean
    can_travel_to_quadrant: boolean
    unlocked_by: {
      propulsion_tech: boolean
      warp_technology: boolean
    }
  }
}

export interface GeometryDefaultsConfig {
  system_radius_default: number
  region_radius_min: number
  region_adjacency_buffer: number
}

export interface UniverseConfigResponse {
  grid_size?: number | { width: number; height: number }
  grid_width?: number
  grid_height?: number
  universe_structure: {
    quadrant_count: number
    sectors_per_quadrant: number
    galaxies_per_sector: number
    systems_per_galaxy: number
    planets_per_system: number
  }
  capacities: {
    total_systems: number
    max_planets: number
  }
  geometry_defaults?: GeometryDefaultsConfig
}

export interface FleetRangeValidation {
  can_reach: boolean
  reason?: string
  required_research?: string[]
  max_range: 'same_galaxy' | 'cross_galaxy' | 'cross_sector' | 'cross_quadrant'
}

// Request Types
export interface RegisterRequest {
  username: string
  email: string
  password: string
  empire_name: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SocialAuthCallbackRequest {
  code?: string
  redirect_uri?: string
  access_token?: string
}

export interface SocialAuthResponseMeta {
  is_new_user?: boolean
}

export interface SocialAuthResponse {
  token: string
  user: User
  empire: Empire | null
  meta?: SocialAuthResponseMeta
}

// Legacy interface - use the one below instead
// export interface ColonizePlanetRequest {
//   coordinate: string
//   name: string
// }

export interface BuyMinesRequest {
  quantity: number
}

export interface BuyProbesRequest {
  quantity: number
}

// Legacy create fleet request (string coordinate); prefer updated type below
export interface CreateFleetRequestLegacy {
  ships: Record<string, number>
  origin_planet_id: number
  destination_coordinate: string
  order_type: 'attack' | 'defend' | 'station' | 'return'
}

export interface CreateSignalRequestLegacy {
  target_coordinate: string
  signal_type: 'fleet' | 'orbital_defence' | 'planetary' | 'all_frequency_fleet'
}

export interface CreateAllianceRequest {
  name: string
  description?: string
}

export interface DonateToAllianceRequest {
  tellerium: number
  krypton: number
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

// Defence Types
export interface DefenceDefinition {
  id: number
  name: string
  slug: string
  description: string
  tellerium_cost: number
  krypton_cost: number
  target_class: string
  init: number
  build_time_ticks: number
  era?: number // Era required for this defence
  specialization?: 'general' | 'industrial' | 'military' | 'relic' // Specialization path
  // Note: Attack/defence power and energy consumption fields may not be in the API response
  attack_power?: number
  defence_power?: number
  energy_consumption?: number
  effects?: Record<string, number | boolean> // Defence effects
  notes?: string // Developer notes/UI hints
}

export interface Defence {
  id: number
  defence_slug: string
  quantity: number
  definition: {
    name: string
    description: string
  }
}

// Facility Types
export interface FacilityDefinition {
  id: number
  name: string
  slug: string
  description: string
  base_tellerium_cost: number
  base_krypton_cost: number
  build_time_ticks: number
  prerequisites: string[]
  era?: number // Era required for this facility
  specialization?: 'general' | 'industrial' | 'military' | 'relic' // Specialization path
  // Note: Production and energy consumption fields may not be in the API response
  production_tellerium?: number
  production_krypton?: number
  energy_consumption?: number
  // New tech tree fields
  per_tick?: Record<string, number> // JSON object with resource production per tick (e.g., {"tellerium": 10, "krypton": 5, "dark_matter": 2})
  upkeep?: Record<string, number> // JSON object with upkeep costs per tick (e.g., {"tellerium": 5, "krypton": 3})
  notes?: string // Developer notes/UI hints
}

export interface Facility {
  id: number
  facility_slug: string
  level: number
  is_active: boolean
  definition: {
    name: string
    description: string
  }
}

// Research Types
export interface ResearchDefinition {
  id: number
  name: string
  slug: string
  description: string
  cost_research_points: number
  prerequisites: string[]
  era?: number // Era required for this research
  specialization?: 'general' | 'industrial' | 'military' | 'relic' // Specialization path
  effects: Record<string, number | boolean> // Research effects (multipliers, bonuses, boolean unlocks)
  prerequisite_research?: string[] // Array of research slugs required
  notes?: string // Developer notes/UI hints
}

export interface ResearchProgress {
  research_points: number
  completed_research: string[]
  available_research: Array<{
    slug: string
    name: string
    cost: number
    can_research: boolean
  }>
  // Optional for UI compatibility
  research?: any[]
}

// Planet-specific research item with detailed prerequisite information
export interface PlanetResearchItem {
  slug: string
  name: string
  description: string
  cost_tellerium: number
  cost_krypton: number
  build_time_ticks: number
  can_research: boolean
  completed: boolean // Whether already completed (empire-wide)
  missing_prerequisites: string[] // Combined list of missing items
  prerequisite_facilities: string[] // Required facilities (checked on planet)
  prerequisite_research: string[] // Required research (checked empire-wide)
  era?: number // Era required for this research
  specialization?: 'general' | 'industrial' | 'military' | 'relic' // Specialization path
  effects?: Record<string, number | boolean>
  notes?: string // Developer notes/UI hints
}

// Ship Types
export interface ShipDefinition {
  id: number
  name: string
  slug: string
  class: string
  description?: string
  tellerium_cost: number
  krypton_cost: number
  gun_power: number
  armour: number
  accuracy: string
  agility: string
  init: number
  travel_ticks: number
  build_time_ticks: number
  prerequisites: string[] | null
  era?: number // Era required for this ship
  specialization?: 'general' | 'industrial' | 'military' | 'relic' // Specialization path
  abilities: string[]
  notes?: string // Developer notes/UI hints
}

export interface Ship {
  definition_id: number
  quantity: number
  definition: {
    name: string
    class: string
    attack_power: number
  }
}

// Mail Types
export interface Mail {
  id: number
  subject: string
  body: string
  from_empire: {
    id: number
    name: string
  }
  to_empire: {
    id: number
    name: string
  }
  is_read: boolean
  created_at: string
  // Threading fields
  thread_id?: string
  parent_id?: number
  reply_count?: number
  is_thread_starter?: boolean
}

export interface MailMeta {
  page: number
  per_page: number
  total: number
  pages: number
}

// Resource Types
export interface ResourceBalances {
  tellerium: number
  krypton: number
}

export interface ResourceProduction {
  tellerium_per_tick: number
  krypton_per_tick: number
}

export interface PlanetResources {
  balances: ResourceBalances
  production: ResourceProduction
  mines: number
  probes: number
}

export interface EmpireResourceSummary {
  total_balances: ResourceBalances
  total_production: ResourceProduction
  planet_count: number
  total_mines: number
  total_probes: number
}

// Signal Types (updated to match API)
export interface TachyonSignal {
  id: number
  from_empire: {
    id: number
    name: string
  }
  target_quadrant: number
  target_sector: number
  target_galaxy: number
  target_system?: number  // System level (5-level hierarchy)
  target_planet: number
  target_x?: number  // X coordinate (source of truth)
  target_y?: number  // Y coordinate (source of truth)
  type: 'fleet' | 'orbital_defence' | 'planetary' | 'all_frequency' | 'events'
  status: 'processing' | 'completed' | 'failed'
  signal_strength: number
  scan_data: Record<string, any>
  results?: Array<{
    type: string
    description?: string
    details?: any
    confidence?: number
    data?: any
  }>
  completed_at?: string
  created_at: string
  statistics?: Record<string, any>
}

export interface SignalStatistics {
  total_signals: number
  successful_signals: number
  failed_signals: number
  total_cost: number
  last_signal_at: string
}

// Cost Breakdown Types
export interface CostBreakdown {
  type: 'mines' | 'probes'
  quantity: number
  cost: {
    tellerium_cost: number
    krypton_cost: number
    total_cost: number
  }
  current_resources: ResourceBalances
  can_afford: boolean
}

// Travel Time Types
export interface TravelTime {
  travel_ticks: number
  slowest_ship: string
  slowest_ship_travel_ticks: number
  distance_multiplier: number
  origin: string // Coordinate format: "1:1:1:1"
  destination: string // Coordinate format: "1:1:2:1"
}

export interface TravelEstimate {
  ship_type: string
  travel_ticks: number
  travel_seconds: number
}

// Tech Planning Types
export interface TechPlanDto {
  id: string
  name: string
  node_ids: string[]
  notes?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface CreateTechPlanRequest {
  name: string
  node_ids: string[]
  notes?: string | null
  metadata?: Record<string, unknown> | null
}

export interface UpdateTechPlanRequest {
  id: string
  name?: string
  node_ids?: string[]
  notes?: string | null
  metadata?: Record<string, unknown> | null
  updated_at: string
}

export interface UpdateTechPlanNodesRequest {
  id: string
  node_ids: string[]
  updated_at: string
}

export interface DeleteTechPlanRequest {
  id: string
  updated_at: string
}

export interface TechAdvisorSuggestionDto {
  node_id: string
  advisor_id?: string | null
  dismissed_at?: string | null
  pinned_at?: string | null
}

export interface TechAdvisorStateDto {
  current_focus_node_id: string | null
  dismissed_suggestions: TechAdvisorSuggestionDto[]
  pinned_suggestions: TechAdvisorSuggestionDto[]
  updated_at: string | null
}

export interface UpdateTechAdvisorStateRequest {
  current_focus_node_id: string | null
  dismissed_suggestions?: TechAdvisorSuggestionDto[]
  pinned_suggestions?: TechAdvisorSuggestionDto[]
  updated_at?: string | null
}

export interface AdvisorSuggestionMutationRequest {
  node_id: string
  advisor_id?: string | null
  updated_at?: string | null
}

// Updated Fleet Types to match API
export interface FleetShip {
  definition_id: number
  quantity: number
}

export interface FleetCoordinate {
  quadrant: number
  sector: number
  galaxy: number
  planet: number
}

export interface FleetDetails {
  id: number
  name: string
  origin_coordinate: FleetCoordinate
  destination_coordinate: FleetCoordinate
  destination_region?: number
  destination_system?: number
  ships: FleetShip[]
  order_type: 'attack' | 'defend' | 'station' | 'return' | 'colonize' | 'transport'
  status: 'stationed' | 'travelling' | 'arrived' | 'in_combat' | 'returning' | 'in_transit' | 'cancelled'
  arrival_tick: string
  departure_tick?: string
  travel_time_ticks?: number
  resources?: {
    tellerium: number
    krypton: number
  }
  owner?: {
    id: number
    name: string
  }
}

// Updated Request Types
export interface CreateFleetRequest {
  ships: Record<string, number> // Associative array: { "fighter": 10, "cruiser": 5 }
  origin_planet_id: number
  destination_quadrant?: number // Legacy support
  destination_sector?: number // Legacy support
  destination_galaxy?: number // Legacy support
  destination_planet?: number // Legacy support
  destination_x: number
  destination_y: number
  destination_region?: number
  destination_system?: number
  order_type: 'attack' | 'defend' | 'station' | 'return' | 'colonize' | 'transport'
  resources?: {
    tellerium?: number
    krypton?: number
  }
  auto_return_on_failure?: boolean
  name?: string
}

export interface MoveFleetRequest {
  destination_quadrant: number
  destination_sector: number
  destination_galaxy: number
  destination_planet: number
  order_type?: 'attack' | 'defend' | 'station' | 'return' | 'colonize' | 'transport'
  auto_return_on_failure?: boolean
  resources?: {
    tellerium?: number
    krypton?: number
  }
}

export interface TravelTimeRequest {
  ships: Array<{ definition_id: number; quantity: number }>
  origin_quadrant: number
  origin_sector: number
  origin_galaxy: number
  origin_planet: number
  destination_quadrant: number
  destination_sector: number
  destination_galaxy: number
  destination_planet: number
}

export interface ColonizePlanetRequest {
  origin_planet_id: number
  ships: Record<string, number>
  x: number
  y: number
  quadrant?: number
  sector?: number
  galaxy?: number
  system?: number
  planet?: number
  name?: string
}

export interface CreateSignalRequest {
  origin_planet_id: number
  target_quadrant: number
  target_sector: number
  target_galaxy: number
  target_system: number
  target_planet: number
  target_x: number
  target_y: number
  type: 'fleet' | 'orbital_defence' | 'planetary' | 'all_frequency' | 'events'
}

export interface SendMailRequest {
  to_empire_id: number
  subject: string
  body: string
  parent_id?: number
  thread_id?: string
}

export interface ReplyMailRequest {
  original_mail_id: number
  subject: string
  body: string
}

// Alliance Chat Types
export interface AllianceChatMessage {
  id: number
  alliance_id: number
  sender_empire: {
    id: number
    name: string
  }
  message: string
  created_at: string
}

export interface AllianceChatMeta {
  page: number
  per_page: number
  total: number
  pages: number
}

export interface SendAllianceChatRequest {
  message: string
}

// Universal Chat System Types
export interface ChatChannel {
  id: number
  slug: string
  name: string
  description: string
  max_message_length: number
  rate_limit_per_minute: number
}

export interface ChatChannelListResponse {
  channels: ChatChannel[]
}

export interface ChatMessage {
  id: number
  channel_slug: string
  sender_empire: {
    id: number
    name: string
  }
  message: string
  mentions: number[]
  is_edited: boolean
  edited_at: string | null
  is_moderated: boolean
  created_at: string
}

export interface ChatMessageListResponse {
  channel_slug: string
  messages: ChatMessage[]
}

export interface SendChatMessageRequest {
  message: string
}

export interface EditChatMessageRequest {
  message: string
}

export interface SendTypingIndicatorRequest {
  is_typing: boolean
}

export interface OnlineUser {
  empire_id: number
  empire_name: string
  last_seen: string
}

export interface OnlineUsersResponse {
  channel_slug: string
  count: number
  online_users: OnlineUser[]
}

// Admin Chat Types
export interface AdminChatMessage {
  id: number
  channel_slug: string
  sender_empire: {
    id: number
    name: string
  }
  message: string
  mentions: number[]
  is_edited: boolean
  edited_at: string | null
  is_moderated: boolean
  created_at: string
}

export interface AdminChatMessageListResponse {
  data: AdminChatMessage[]
  meta: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

export interface BanUserFromChatRequest {
  empire_id: number
  reason?: string
  duration_hours?: number
}

export interface MuteUserFromChatRequest {
  empire_id: number
  duration_hours?: number
}

export interface BuildDefenceRequest {
  defence_slug: string
  quantity: number
}

export interface BuildFacilityRequest {
  facility_slug: string
  level?: number
}

export interface BuildShipRequest {
  ship_slug: string
  quantity: number
}

export interface TransferResourcesRequest {
  destination_planet_id: number
  tellerium: number
  krypton: number
}

export interface StartResearchRequest {
  planet_id: number
  research_slug: string
}

export interface PopulationStratum {
  slug: string
  name: string
  population: number
  percentage: number
  modifiers: Array<{
    slug: string
    name: string
    description?: string
    value: number
  }>
}

export interface PopulationEdictRequirement {
  slug: string
  name?: string
  description?: string
  met?: boolean
}

export interface PopulationEdict {
  slug: string
  name: string
  description: string
  duration_ticks: number
  remaining_ticks?: number
  cooldown_ticks?: number
  requirements?: Array<PopulationEdictRequirement | string>
  is_active?: boolean
  effects?: Array<{
    slug: string
    name: string
    value: number | string
  }>
}

export interface PopulationStage {
  slug: string
  name: string
  progress: number
  progress_cap: number
  growth_rate: number
  requirements: Array<{
    slug: string
    name: string
    met: boolean
    description?: string
  }>
}

export interface PopulationEvent {
  id: string
  type: string
  message: string
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
}

export interface PopulationProfileResponse {
  population: {
    total: number
    growth_rate: number
    unrest: number
    stage: PopulationStage
    strata: PopulationStratum[]
    specialization?: string | null
    specialization_options?: Array<{
      slug: string
      name: string
      description: string
      effects?: Array<{ slug: string; value: number | string }>
    }>
  }
  draft: {
    current: number
    capacity: number
    ratio: number
    overdraft: number
  }
  edicts: {
    active: PopulationEdict[]
    available: PopulationEdict[]
  }
  events?: PopulationEvent[]
}

export interface PopulationDraftMetricsResponse {
  draft: {
    current: number
    capacity: number
    ratio: number
    overdraft: number
  }
}

export interface ApplyPopulationEdictRequest {
  planetId: number
  edict_slug: string
}

export interface SelectPopulationSpecializationRequest {
  planetId: number
  specialization: string
}

// Buildable Items Types
export interface BuildableItem {
  slug: string
  name: string
  base_tellerium_cost: number
  base_krypton_cost: number
  build_time: number // API returns build_time in seconds
  prerequisites: string[]
  description: string
  era?: number // Era required for this item
}

export interface BuildableFacility extends BuildableItem {
  // Facilities have additional properties
}

export interface BuildableResearch extends BuildableItem {
  cost_tellerium: number
  cost_krypton: number
  prerequisite_facilities: string[]
}

export interface BuildableShip extends BuildableItem {
  class: string
  tellerium_cost: number
  krypton_cost: number
}

export interface DefencePrerequisiteStatus {
  slug: string
  type: 'facility' | 'research' | 'unknown'
  met: boolean
}

export interface BuildableDefence extends BuildableItem {
  tellerium_cost: number
  krypton_cost: number
  build_time_ticks: number
  can_build?: boolean
  missing_prerequisites?: string[]
  prerequisite_status?: DefencePrerequisiteStatus[]
}

export interface AvailableDefence extends BuildableDefence {
  unlocked?: boolean
}

export interface AvailableDefencesResponse {
  defences: AvailableDefence[]
}

export interface DefenceConstructionResponse extends ApiResponse<{ construction: ConstructionQueueItem }>{}

export interface BuildableItems {
  facilities: BuildableFacility[]
  research: BuildableResearch[]
  ships: BuildableShip[]
  defences: BuildableDefence[]
}

// Construction Queue Types
export interface ConstructionQueueItem {
  id: number
  type: 'facility' | 'defence' | 'ship' | 'research'
  item_slug: string
  level?: number
  quantity: number
  build_time: number // API returns build_time in seconds
  ticks_remaining: number
  cost_tellerium: number
  cost_krypton: number
  progress_percentage: number
  started_at: string
  completes_at: string
  is_completed: boolean
}

export interface ConstructionQueueResponse {
  status: string
  construction_queue: ConstructionQueueItem[]
}

export interface UserPreferences {
  notifications: {
    email_notifications: boolean
    push_notifications: boolean
  }
  events: {
    construction_completed: boolean
    research_completed: boolean
    fleet_arrived: boolean
    fleet_attacked: boolean
    planet_colonized: boolean
    alliance_messages: boolean
    empire_attacked: boolean
  }
}

// Admin Panel Types

// Admin Role Types
export interface AdminRole {
  id: number
  name: string
  slug: string
  description: string
  permissions: string[]
  user_count: number
}

export interface AdminRoleListResponse {
  roles: AdminRole[]
}

// Admin User Types
export interface AdminUser {
  id: number
  username: string
  email: string
  last_login: string | null
  suspended_at: string | null
  suspended_reason: string | null
  created_at: string
  empire: Empire | null
  roles: Role[]
  quantum_credits?: number
  quantum_credits_purchased_total?: number
  daily_login_streak?: number
  last_daily_login_claim?: string | null
}

export interface AdminUserListResponse {
  data: AdminUser[]
  meta: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

export interface AdminUserDetailResponse {
  user: AdminUser
}

export interface UpdateUserRequest {
  email?: string
  username?: string
  suspended?: boolean
  suspended_reason?: string
}

export interface ResetPasswordRequest {
  new_password: string
}

export interface AssignRoleRequest {
  role_id: number
}

export interface UserActivityLog {
  id: number
  action: string
  description: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface UserActivityLogResponse {
  data: UserActivityLog[]
  meta: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

// Admin Quantum Credits Types
export interface GrantQuantumCreditsRequest {
  amount: number
  reason: string
  metadata?: Record<string, any>
}

export interface AdjustQuantumCreditsRequest {
  amount: number // Positive to add, negative to subtract
  reason?: string
  metadata?: Record<string, any>
}

export interface QuantumCreditsTransactionsResponse {
  data: QuantumCreditsTransaction[]
  meta: {
    page: number
    per_page: number
    total: number
    pages: number
  }
  current_balance: number
}

// Admin Booster Types
export interface AdminBooster {
  id: number
  type: 'production' | 'construction' | 'signal'
  multiplier: string
  started_at: string
  expires_at: string
  time_remaining?: number // seconds remaining
  empire: {
    id: number
    name: string
    user?: {
      id: number
      username: string
    }
  }
}

export interface AdminBoostersResponse {
  boosters: AdminBooster[]
}

export interface DeleteBoosterRequest {
  reason?: string
}

// Admin Empire Types
export interface AdminEmpire {
  id: number
  name: string
  description?: string
  score: number
  planets_owned: number
  homeworld_planet_id: number
  alliance_id?: number
  created_at: string
  user?: {
    id: number
    username: string
    email: string
  }
}

export interface AdminEmpireListResponse {
  data: AdminEmpire[]
  meta: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

export interface AdminEmpireDetailResponse {
  empire: AdminEmpire
}

export interface UpdateEmpireRequest {
  name?: string
  description?: string
  score?: number
}

export interface TransferEmpireRequest {
  user_id: number
}

export interface EmpireHistoryItem {
  id: number
  action: string
  description: string
  performed_by?: {
    id: number
    username: string
  }
  created_at: string
}

export interface EmpireHistoryResponse {
  data: EmpireHistoryItem[]
  meta: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

// Admin Planet Types
export interface AdminPlanet {
  id: number
  name: string
  coordinate: string | Coordinate
  state: 'unsettled' | 'colony' | 'homeworld'
  mines: number
  probes: number
  tellerium_balance: number
  krypton_balance: number
  owner_empire_id?: number
  owner_empire?: {
    id: number
    name: string
  }
}

export interface AdminPlanetListResponse {
  data: AdminPlanet[]
  meta: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

export interface AdminPlanetDetailResponse {
  planet: AdminPlanet
}

export interface UpdatePlanetRequest {
  name?: string
  state?: 'unsettled' | 'colony' | 'homeworld'
  tellerium_balance?: number
  krypton_balance?: number
  mines?: number
  probes?: number
}

export interface TransferPlanetRequest {
  empire_id: number
}

export interface ModifyPlanetResourcesRequest {
  tellerium?: number
  krypton?: number
  reason: string
}

// Admin Fleet Types
export interface AdminFleetShip {
  definition_id: number
  quantity: number
}

export interface AdminFleet {
  id: number
  owner_empire_id: number
  ships: AdminFleetShip[]
  origin_planet_id: number
  destination_quadrant: number
  destination_sector: number
  destination_galaxy: number
  destination_planet: number
  departure_tick: number
  arrival_tick: number
  status: 'stationed' | 'in_transit' | 'arrived'
  order_type: 'attack' | 'defend' | 'station' | 'return'
  auto_return_on_failure: boolean
  created_at: string
  updated_at: string
  owner?: {
    id: number
    user_id: number
    name: string
    homeworld_planet_id: number
    score: number
    planets_owned: number
    alliance_id: number | null
    created_at: string
    updated_at: string
    description: string | null
  }
  origin?: {
    id: number
    name: string
    quadrant: number
    sector: number
    galaxy: number
    planet: number
    owner_empire_id: number
    state: string
    mines: number
    probes: number
    tellerium_balance: number
    krypton_balance: number
    [key: string]: any // For facilities and other fields
  }
}

export interface AdminFleetListResponse {
  data: AdminFleet[]
  meta: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

export interface TeleportFleetRequest {
  quadrant: number
  sector: number
  galaxy: number
  planet: number
}

// Admin Alliance Types
export interface AdminAlliance {
  id: number
  name: string
  tag: string
  description?: string
  fund_tellerium: number
  fund_krypton: number
  leader: {
    id: number
    name: string
  }
  member_count: number
  created_at: string
}

export interface AdminAllianceListResponse {
  data: AdminAlliance[]
  meta: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

export interface UpdateAllianceRequest {
  name?: string
  tag?: string
  fund_tellerium?: number
  fund_krypton?: number
}

export interface TransferAllianceLeadershipRequest {
  empire_id: number
}

export interface AdminAllianceChatMessage {
  id: number
  alliance_id: number
  sender_empire: {
    id: number
    name: string
  }
  message: string
  created_at: string
}

export interface AdminAllianceChatResponse {
  data: AdminAllianceChatMessage[]
  meta: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

// Admin Mail Types
export interface AdminMail {
  id: number
  subject: string
  body: string
  from_empire: {
    id: number
    name: string
  }
  to_empire: {
    id: number
    name: string
  }
  is_read: boolean
  created_at: string
}

export interface AdminMailListResponse {
  data: AdminMail[]
  meta: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

// Admin Tick Types
export interface AdminTickStats {
  tick_number: number
  started_at: string
  planets_processed?: number
  combats_resolved?: number
  production_applied?: number
  facilities_completed?: number
  research_completed?: number
  fleets_arrived?: number
  defences_completed?: number
  ships_completed?: number
  finished_at: string
  duration_seconds: number
}

export interface AdminTick {
  id: number // Database ID
  tick_number: number
  started_at: string
  finished_at: string
  stats: AdminTickStats
  created_at: string
  updated_at: string
}

export interface AdminTickListResponse {
  data: AdminTick[]
  meta: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

export interface AdminTickDetailResponse {
  tick: AdminTick
}

export interface RollbackTickRequest {
  tick_number: number
  reason: string
}

// Admin Resource Types
export interface BulkResourceAdjustment {
  planet_id: number
  tellerium?: number
  krypton?: number
}

export interface BulkAdjustResourcesRequest {
  adjustments: BulkResourceAdjustment[]
  reason: string
}

export interface BulkAdjustResourcesResponse {
  message: string
  adjusted: number
}

// Admin Statistics Types
export interface AdminStatistics {
  users: {
    total: number
    active: number
    suspended: number
    with_empires: number
  }
  empires: {
    total: number
    active: number
    in_alliances: number
  }
  planets: {
    total: number
    colonized: number
    unsettled: number
    homeworlds: number
    colonies: number
  }
  alliances: {
    total: number
    average_members: number
  }
  fleets: {
    total: number
    in_transit: number
    stationed: number
  }
  resources: {
    total_tellerium: number
    total_krypton: number
    total_mines: number
    total_probes: number
  }
  tick: {
    current: number
    next_eta: string
  }
}

// Admin Combat Types
export interface AdminCombatParticipant {
  empire_id: number
  type: 'fleet' | 'planet'
  fleet_id?: number
  planet_id?: number
  ships?: Record<string, number>
  defences?: Record<string, number> | any[]
  init: number
}

export interface AdminCombatResult {
  winner_empire_id: number
  ships_lost: any[]
  facilities_destroyed: any[]
  planets_captured: any[]
}

export interface AdminCombat {
  id: number
  tick_number: number
  location_quadrant: number
  location_sector: number
  location_galaxy: number
  location_planet: number
  participants: AdminCombatParticipant[]
  result: AdminCombatResult
  created_at: string
  updated_at: string
}

export interface AdminCombatListResponse {
  data: AdminCombat[]
  meta: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

// Announcement Types
export interface Announcement {
  id: number
  title: string
  message: string
  priority: 'info' | 'warning' | 'alert' | 'success'
  is_pinned: boolean
  is_active: boolean
  starts_at: string | null
  expires_at: string | null
  created_by: string // Username string, not number
  created_at: string
  updated_at: string
  creator?: {
    id: number
    username: string
    email: string
  }
}

export interface CreateAnnouncementRequest {
  title: string
  message: string
  priority: 'info' | 'warning' | 'alert' | 'success'
  is_pinned?: boolean
  is_active?: boolean
  starts_at?: string
  expires_at?: string
}

export interface UpdateAnnouncementRequest {
  title?: string
  message?: string
  priority?: 'info' | 'warning' | 'alert' | 'success'
  is_pinned?: boolean
  is_active?: boolean
  starts_at?: string
  expires_at?: string
}

export interface AnnouncementListResponse {
  announcements: Announcement[]
}

export interface AnnouncementListPaginatedResponse {
  data: Announcement[]
  meta: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

// ============================================================================
// Admin Combat Simulation Types
// ============================================================================

export interface CombatParticipant {
  empire_id: number
  type: 'fleet' | 'planet'
  fleet_id?: number
  planet_id?: number
  ships?: Record<string, number>
  defences?: Array<{ defence_slug: string; quantity: number }> | Record<string, number>
}

export interface CombatAction {
  attacker: CombatParticipant
  target: CombatParticipant
  damage_dealt: number
}

export interface CombatRoundLog {
  round: number
  participants_before: CombatParticipant[]
  actions: CombatAction[]
  participants_after: CombatParticipant[]
}

export interface CombatSimulationResult {
  winner_empire_id: number
  ships_lost: Record<number, Record<string, number>>
  defences_destroyed?: Array<{ defence_slug: string; quantity: number }>
  facilities_destroyed?: Array<{ facility_slug: string; quantity: number }>
  seed: number
  battle_id: string
  final_participants: CombatParticipant[]
  round_logs?: CombatRoundLog[]
}

export interface SimulateCombatRequest {
  fleet_id?: number
  planet_id?: number
  custom_fleet_ships?: Record<string, number>
  custom_planet_defences?: Array<{ defence_slug: string; quantity: number }>
  tick_number?: number
  override_seed?: string
  detailed_logs?: boolean
}

export interface SimulateCombatResponse {
  message: string
  simulation: CombatSimulationResult
}

export interface BatchScenario {
  name: string
  fleet_id?: number
  planet_id?: number
  custom_fleet_ships?: Record<string, number>
  custom_planet_defences?: Array<{ defence_slug: string; quantity: number }>
  tick_number?: number
  override_seed?: string
  detailed_logs?: boolean
}

export interface BatchSimulateCombatRequest {
  scenarios: BatchScenario[]
  compare_results?: boolean
}

export interface BatchSimulateResult {
  scenario_index: number
  scenario_name: string
  success: boolean
  result?: CombatSimulationResult
  error?: string
}

export interface WinnerDistribution {
  [empireId: string]: number
}

export interface AverageShipLosses {
  [empireId: string]: {
    [shipType: string]: number
  }
}

export interface BatchComparison {
  total_simulations: number
  winner_distribution: WinnerDistribution
  average_ships_lost: AverageShipLosses
}

export interface BatchSimulateCombatResponse {
  message: string
  results: {
    total_scenarios: number
    successful: number
    failed: number
    results: BatchSimulateResult[]
    comparison?: BatchComparison
  }
}

export interface DefenceConfiguration {
  name?: string
  defences: Array<{ defence_slug: string; quantity: number }>
  empire_id: number
  override_seed?: string
}

export interface TestFleetAgainstDefencesRequest {
  fleet_ships: Record<string, number>
  fleet_empire_id: number
  defence_configs: DefenceConfiguration[]
}

export interface TestFleetResult {
  defence_config: string
  defences: Array<{ defence_slug: string; quantity: number }>
  winner_empire_id: number
  fleet_won: boolean
  ships_lost: Record<number, Record<string, number>>
  defences_destroyed?: Array<{ defence_slug: string; quantity: number }>
}

export interface TestFleetAgainstDefencesResponse {
  message: string
  results: {
    fleet_composition: Record<string, number>
    tests_run: number
    fleet_wins: number
    fleet_losses: number
    win_rate_percent: number
    results: TestFleetResult[]
  }
}

export interface FleetConfiguration {
  name: string
  ships: Record<string, number>
  empire_id: number
  override_seed?: string
}

export interface TestDefenceAgainstFleetsRequest {
  defences: Array<{ defence_slug: string; quantity: number }>
  planet_empire_id: number
  fleet_configs: FleetConfiguration[]
}

export interface TestDefenceResult {
  fleet_config: string
  winner_empire_id: number
  defence_won: boolean
  ships_lost: Record<number, Record<string, number>>
  defences_destroyed?: Array<{ defence_slug: string; quantity: number }>
}

export interface TestDefenceAgainstFleetsResponse {
  message: string
  results: {
    defences: Array<{ defence_slug: string; quantity: number }>
    tests_run: number
    defence_wins: number
    defence_losses: number
    win_rate_percent: number
    results: TestDefenceResult[]
  }
}

// ============================================================================
// Admin Tick Testing Types
// ============================================================================

export interface DryRunTickRequest {
  force_recalc?: boolean
  detailed_diff?: boolean
}

export interface TickStats {
  tick_number: number
  planets_processed: number
  production_applied?: number
  facilities_completed?: number
  research_completed?: number
  fleets_arrived?: number
  combats_resolved?: number
  defences_completed?: number
  ships_completed?: number
  ai_actions_generated?: number
  ai_actions_executed?: number
  ai_actions_failed?: number
  duration_seconds: number
  finished_at?: string | null
}

export interface ValueDiff {
  before: any
  after: any
  change: any
}

export interface DetailedDiff {
  planets?: Record<number, Record<string, ValueDiff>>
  empires?: Record<number, Record<string, ValueDiff>>
  fleets?: Record<number, Record<string, ValueDiff>>
  construction_queues?: Record<number, Record<string, ValueDiff>>
}

export interface DryRunTickResponse {
  message: string
  results: {
    dry_run: boolean
    stats: TickStats
    diff?: DetailedDiff
    warning?: string
  }
}

export interface SandboxTickRequest {
  ticks_to_process: number
  reset_before?: boolean
  initial_state?: any
}

export interface SandboxTickResponse {
  message: string
  results: {
    sandbox: boolean
    ticks_processed: number
    stats: TickStats[]
    final_state?: any
    warning?: string
  }
}

export interface CompareTickResultsRequest {
  // Placeholder for future implementation
}

export interface CompareTickResultsResponse {
  message: string
}

// ============================================================================
// Admin Game Definitions Types
// ============================================================================

export interface GameDefinition {
  id: number
  slug: string
  name: string
  era: number
  base_tellerium_cost: number
  base_krypton_cost: number
  build_time_ticks?: number
  prerequisites?: string[]
  description?: string
  created_at: string
  updated_at: string
  // Additional fields for ships
  stats?: {
    armour?: number
    init?: number
    travel_ticks?: number
    gun_power?: number
    accuracy?: number
    agility?: number
  }
  // Additional fields for defences
  defence_stats?: {
    armour?: number
    gun_power?: number
  }
}

export interface DefinitionListResponse {
  data: GameDefinition[]
  meta: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

export interface DefinitionDetailResponse {
  data: GameDefinition
}

export interface CreateDefinitionRequest {
  slug: string
  name: string
  era: number
  base_tellerium_cost: number
  base_krypton_cost: number
  build_time_ticks: number
  prerequisites?: string[]
  description?: string
  stats?: {
    armour?: number
    init?: number
    travel_ticks?: number
    gun_power?: number
    accuracy?: number
    agility?: number
  }
  defence_stats?: {
    armour?: number
    gun_power?: number
  }
}

export interface UpdateDefinitionRequest {
  slug?: string
  name?: string
  era?: number
  base_tellerium_cost?: number
  base_krypton_cost?: number
  build_time_ticks?: number
  prerequisites?: string[]
  description?: string
  change_reason?: string
  stats?: {
    armour?: number
    init?: number
    travel_ticks?: number
    gun_power?: number
    accuracy?: number
    agility?: number
  }
  defence_stats?: {
    armour?: number
    gun_power?: number
  }
}

export interface CreateDefinitionResponse {
  message: string
  data: GameDefinition
}

export interface UpdateDefinitionResponse {
  message: string
  data: GameDefinition
  warnings?: string[]
}

export interface DeleteDefinitionResponse {
  status: 'ok' | 'error'
  code?: string
  message: string
  warnings?: string[]
}

export interface DefinitionImpactAnalysisRequest {
  proposed_changes: Partial<UpdateDefinitionRequest>
}

export interface ImpactField {
  active_queues_affected?: number
  note: string
}

export interface DefinitionImpactAnalysis {
  definition_type: 'facilities' | 'ships' | 'defences' | 'research'
  definition_id: number
  definition_slug: string
  proposed_changes: Record<string, any>
  current_usage: string[]
  impact: {
    [key: string]: ImpactField
  }
}

export interface DefinitionImpactAnalysisResponse {
  analysis: DefinitionImpactAnalysis
}

export interface DefinitionVersion {
  version_number: number
  changed_by: {
    id: number
    username: string
  }
  changed_at: string
  change_reason?: string | null
  rollback_count: number
}

export interface DefinitionHistoryResponse {
  history: DefinitionVersion[]
}

export interface CompareVersionsRequest {
  version1: number
  version2: number
}

export interface VersionComparison {
  version_1: {
    version_number: number
    changed_at: string
    changed_by: string
  }
  version_2: {
    version_number: number
    changed_at: string
    changed_by: string
  }
  differences: Record<string, {
    version_2?: any
    version_3?: any
  }>
}

export interface CompareVersionsResponse {
  comparison: VersionComparison
}

export interface RollbackDefinitionRequest {
  version_number: number
  reason: string
}

export interface RollbackDefinitionResponse {
  message: string
}

// ============================================================================
// Tech Tree System Types
// ============================================================================

// Empire State - Summary of empire tech tree state
export interface EmpireState {
  active_era: number
  specializations_unlocked: string[]
  dark_matter_current: number
  dark_matter_capacity: number
  dark_matter_production_per_tick?: number
  active_research_effects: Record<string, number | boolean>
  should_prompt_specialization?: boolean
}

// Era Progression Status
export interface EraProgression {
  current_era: number
  next_era: number
  can_progress: boolean
  requirements: {
    facilities: Array<{
      slug: string
      name: string
      completed: boolean
    }>
    message: string
  }
  progress_percentage: number
}

// Dark Matter Information
export interface DarkMatterInfo {
  dark_matter_current: number
  dark_matter_capacity: number
  production_per_tick: number
  capacity_utilization: number
  production_by_planet?: Array<{
    planet_id: number
    planet_name: string
    production_per_tick: number
    facilities: Array<{
      facility_slug: string
      production: number
    }>
  }>
}

// Research Effects Summary
export interface ResearchEffectsSummary {
  active_effects: Record<string, number | boolean>
  effects_by_research?: Record<string, Record<string, number | boolean>>
}

// Specialization Selection
export interface SelectSpecializationRequest {
  specialization: 'industrial' | 'military' | 'relic'
}

export interface SelectSpecializationResponse {
  status: 'success' | 'error'
  message: string
  specialization?: string
  specializations_unlocked?: string[]
  code?: string
  errors?: string[]
}

// Tech Tree API Response
export interface TechTreeApiResponse {
  facilities?: Array<{
    slug: string
    name: string
    description?: string
    era?: number
    specialization?: string
    unlocked: boolean
    can_build: boolean
    completed: boolean
    prerequisites?: string[]
    base_tellerium_cost?: number
    base_krypton_cost?: number
    per_tick?: {
      tellerium?: number
      krypton?: number
    }
    upkeep?: {
      tellerium?: number
      krypton?: number
      energy?: number
    }
    build_time_ticks?: number
    effects?: Record<string, any>
    quantity?: number
  }>
  research?: Array<{
    slug: string
    name: string
    description?: string
    era?: number
    specialization?: string
    unlocked: boolean
    can_research: boolean
    completed?: boolean
    prerequisite_facilities?: string[]
    prerequisite_research?: string[]
    cost_tellerium?: number
    cost_krypton?: number
    cost_research_points?: number
    build_time_ticks?: number
    effects?: Record<string, any>
  }>
  ships?: Array<{
    slug: string
    name: string
    description?: string
    era?: number
    specialization?: string
    unlocked: boolean
    can_build: boolean
    prerequisites?: string[]
    tellerium_cost?: number
    krypton_cost?: number
    build_time_ticks?: number
  }>
  defences?: Array<{
    slug: string
    name: string
    description?: string
    era?: number
    specialization?: string
    unlocked: boolean
    can_build: boolean
    prerequisites?: string[]
    tellerium_cost?: number
    krypton_cost?: number
    build_time_ticks?: number
  }>
  empire?: {
    active_era?: number
    specializations_unlocked?: string[]
  }
  completed_research?: string[]
  queued_items?: Array<{
    id: string
    type: 'facility' | 'research' | 'ship' | 'defence'
    slug: string
    started_at?: string
    completes_at?: string
  }>
  in_progress_items?: Array<{
    id: string
    type: 'facility' | 'research' | 'ship' | 'defence'
    slug: string
    progress_percentage?: number
  }>
}

// Tech Tree Position (shared with tech-tree.types.ts)
export interface TechTreePosition {
  row: number
  column: number
  column_offsets: {
    industrial: number
    military: number
    relic: number
  }
}

// Tech Tree Definitions API Response
export interface TechTreeDefinitionsResponse {
  facilities: Array<{
    id: number
    slug: string
    name: string
    description?: string
    era: number
    specialization: string
    tech_tree_position?: TechTreePosition
    type: 'facility'
    unlocked: boolean
    available: boolean
    can_build?: boolean
    missing_prerequisites?: string[]
    completed?: boolean
    prerequisites?: string[]
    base_tellerium_cost?: number
    base_krypton_cost?: number
    per_tick?: {
      tellerium?: number
      krypton?: number
    }
    upkeep?: {
      tellerium?: number
      krypton?: number
      energy?: number
    }
    build_time_ticks?: number
    effects?: Record<string, any>
    quantity?: number
  }>
  research: Array<{
    id: number
    slug: string
    name: string
    description?: string
    era: number
    specialization: string
    tech_tree_position?: TechTreePosition
    type: 'research'
    unlocked: boolean
    available: boolean
    can_research?: boolean
    missing_prerequisites?: string[]
    completed?: boolean
    prerequisite_facilities?: string[]
    prerequisite_research?: string[]
    cost_tellerium?: number
    cost_krypton?: number
    cost_research_points?: number
    build_time_ticks?: number
    effects?: Record<string, any>
  }>
  ships: Array<{
    id: number
    slug: string
    name: string
    description?: string
    era: number
    specialization: string
    tech_tree_position?: TechTreePosition
    type: 'ship'
    unlocked: boolean
    available: boolean
    can_build?: boolean
    missing_prerequisites?: string[]
    completed?: boolean
    prerequisites?: string[]
    tellerium_cost?: number
    krypton_cost?: number
    build_time_ticks?: number
  }>
  defences: Array<{
    id: number
    slug: string
    name: string
    description?: string
    era: number
    specialization: string
    tech_tree_position?: TechTreePosition
    type: 'defence'
    unlocked: boolean
    available: boolean
    can_build?: boolean
    missing_prerequisites?: string[]
    completed?: boolean
    prerequisites?: string[]
    tellerium_cost?: number
    krypton_cost?: number
    build_time_ticks?: number
  }>
  empire: {
    active_era: number
    specializations_unlocked: string[]
  }
}

// Tech Path API Request/Response
export interface TechPathRequest {
  target_node_id: string
  specialization_filter?: string
}

export interface TechPathResponse {
  path: string[] // Node IDs in order
  total_cost: {
    tellerium?: number
    krypton?: number
    dark_matter?: number
    research_points?: number
  }
  total_time: number // in ticks
  is_valid: boolean
  errors?: string[]
}

