// API Response Types
import { Coordinate } from './game.types'

export interface ApiResponse<T> {
  status: 'ok' | 'error'
  data?: T
  message?: string
  code?: string
  details?: Record<string, string[]>
}

// Direct response types (for endpoints that don't wrap responses)
export interface DirectResponse<T> {
  [key: string]: T
}

export interface Role {
  id: number
  name: string
  slug: string
}

export interface User {
  id: number
  username: string
  email: string
  last_login?: string
  created_at: string
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
  planets_owned: number
  alliance_id?: number
  homeworld_planet_id: number
  created_at: string
  description?: string
  // Optional fields for rankings UI
  planets?: any[]
  fleets?: any[]
  alliance?: { name?: string } | null
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
  type?: { slug: 'arid' | 'oceanic' | 'volcanic' | 'ice'; name: string }
  production?: {
    tellerium_per_tick: number
    krypton_per_tick: number
  }
  owner_empire_id?: number
}

export interface Fleet {
  id: number
  ships: Record<string, number>
  origin_coordinate: string
  destination_coordinate: string
  status: 'stationed' | 'in_transit' | 'arrived'
  order_type: 'attack' | 'defend' | 'station' | 'return'
  departure_tick: number
  arrival_tick: number
  travel_time_ticks?: number
  auto_return_on_failure?: boolean
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

export interface UniverseMap {
  quadrants: Array<{
    id: number
    sectors: Array<{
      id: number
      galaxies: Array<{
        id: number
        planets: Array<{
          coordinate: string | Coordinate
          name: string
          owner_empire_id?: number
          state: string
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
  // Note: Attack/defence power and energy consumption fields may not be in the API response
  attack_power?: number
  defence_power?: number
  energy_consumption?: number
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
  // Note: Production and energy consumption fields may not be in the API response
  production_tellerium?: number
  production_krypton?: number
  energy_consumption?: number
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
  effects: Record<string, number>
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
  effects?: Record<string, number>
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
  abilities: string[]
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
  target_planet: number
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
  ships: FleetShip[]
  order_type: 'attack' | 'defend' | 'station' | 'return'
  status: 'stationed' | 'in_transit' | 'arrived' | 'cancelled'
  arrival_tick: string
  owner?: {
    id: number
    name: string
  }
}

// Updated Request Types
export interface CreateFleetRequest {
  ships: Record<string, number> // Associative array: { "fighter": 10, "cruiser": 5 }
  origin_planet_id: number
  destination_quadrant: number
  destination_sector: number
  destination_galaxy: number
  destination_planet: number
  order_type: 'attack' | 'defend' | 'station' | 'return'
  auto_return_on_failure?: boolean
  name?: string
}

export interface MoveFleetRequest {
  destination_quadrant: number
  destination_sector: number
  destination_galaxy: number
  destination_planet: number
  order_type?: 'attack' | 'defend' | 'station' | 'return'
  auto_return_on_failure?: boolean
}

export interface TravelTimeRequest {
  ships: Record<string, number> // Associative array: { "fighter": 10, "cruiser": 5 }
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
  quadrant: number
  sector: number
  galaxy: number
  planet: number
  name: string
}

export interface CreateSignalRequest {
  target_quadrant: number
  target_sector: number
  target_galaxy: number
  target_planet: number
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

// Buildable Items Types
export interface BuildableItem {
  slug: string
  name: string
  base_tellerium_cost: number
  base_krypton_cost: number
  build_time: number // API returns build_time in seconds
  prerequisites: string[]
  description: string
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

export interface BuildableDefence extends BuildableItem {
  // Defences have additional properties
}

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
export interface AdminFleet {
  id: number
  ships: Record<string, number>
  origin_coordinate: string | FleetCoordinate
  destination_coordinate: string | FleetCoordinate
  status: 'stationed' | 'in_transit' | 'arrived'
  order_type: 'attack' | 'defend' | 'station' | 'return'
  departure_tick: number
  arrival_tick: number
  owner?: {
    id: number
    name: string
  }
  owner_empire_id?: number
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
export interface AdminTick {
  id: number // Use tick number as id for DataTable compatibility
  number: number
  processed_at: string
  duration_seconds?: number
  status: 'completed' | 'failed' | 'processing'
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
export interface AdminCombat {
  id: number
  tick_number: number
  attacker_empire_id: number
  attacker_empire_name: string
  defender_empire_id: number
  defender_empire_name: string
  planet_id: number
  planet_coordinate: string
  attacker_won: boolean
  planet_captured: boolean
  created_at: string
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

