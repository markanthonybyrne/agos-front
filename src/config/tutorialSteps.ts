import { 
  Building2, 
  Rocket, 
  Globe, 
  Shield, 
  Users, 
  Sword, 
  Settings, 
  Sparkles,
  Home,
  Coins,
  Zap
} from 'lucide-react'

export type TutorialStepType = 'modal' | 'highlight'

export interface TutorialStep {
  id: string
  order: number
  title: string
  description: string
  content: string | string[]
  type: TutorialStepType
  icon?: React.ComponentType<{ className?: string }>
  targetSelector?: string // CSS selector for highlight steps
  targetRoute?: string // Required route/page for this step
  requiresInteraction?: boolean // Whether user must interact before proceeding
  annotation?: string // Tooltip text for highlight steps
}

export const tutorialSteps: TutorialStep[] = [
  // 1. Welcome & Basic Concepts
  {
    id: 'welcome',
    order: 0,
    title: 'Welcome to agameof.space',
    description: 'Your journey begins here',
    content: [
      'Welcome, Commander! You are about to embark on an epic journey across the universe.',
      'This tutorial will guide you through the basics of building your empire, managing resources, exploring the galaxy, and engaging in strategic combat.',
      'Let\'s get started!',
    ],
    type: 'modal',
    icon: Sparkles,
  },
  {
    id: 'basic-concepts',
    order: 1,
    title: 'Game Basics',
    description: 'Understanding the core mechanics',
    content: [
      'The game runs on TICKS - events that process every 5 minutes.',
      'During each tick, your planets produce resources, construction completes, fleets travel, and combat resolves.',
      'RESOURCES are your lifeblood:',
      '• Tellerium (pink) - Used for most construction and production',
      '• Krypton (purple) - Required for advanced technologies and research',
      'Your EMPIRE starts with one homeworld planet. Expand by colonizing new worlds and building a powerful fleet.',
    ],
    type: 'modal',
    icon: Home,
  },
  
  // 2. Planets & Resources
  {
    id: 'planets-intro',
    order: 2,
    title: 'Planets & Resources',
    description: 'Your foundation for expansion',
    content: [
      'PLANETS are the core of your empire. Each planet provides:',
      '• Resource production (Tellerium and Krypton)',
      '• Space for facilities and defenses',
      '• Ship production capabilities',
      'Your homeworld starts with basic production. As you build mines and probes, production increases.',
      'Resources are stored on each planet and can be transferred between planets via the Fleet system.',
    ],
    type: 'modal',
    icon: Building2,
  },
  {
    id: 'planets-highlight',
    order: 3,
    title: 'View Your Planets',
    description: 'Navigate to the Planets page',
    content: 'Click the Planets button in the top menu to view all your planets and their resources.',
    type: 'highlight',
    targetRoute: '/holopad',
    targetSelector: '[data-tutorial="planets-button"]',
    annotation: 'Click here to view your planets',
    requiresInteraction: false,
    icon: Building2,
  },
  
  // 3. Building Facilities
  {
    id: 'building-intro',
    order: 4,
    title: 'Building Facilities',
    description: 'Expand your planetary infrastructure',
    content: [
      'FACILITIES enhance your planets\' capabilities:',
      '• Mines - Increase Tellerium production',
      '• Probes - Increase Krypton production',
      '• Broadcast Centers - Improve communication range',
      '• Molecular Extraction - Boost overall production',
      'Build facilities using the Tech Tree system. Each facility has prerequisites that must be unlocked first.',
      'Construction takes time measured in ticks. Monitor your construction queue to track progress.',
    ],
    type: 'modal',
    icon: Settings,
  },
  {
    id: 'tech-tree-intro',
    order: 5,
    title: 'Tech Trees',
    description: 'Unlock new technologies',
    content: [
      'TECH TREES organize all buildable items into logical progression paths:',
      '• Facilities - Buildings that enhance production',
      '• Ships - Military vessels for your fleets',
      '• Defenses - Planetary protection systems',
      '• Research - Advanced technologies with empire-wide benefits',
      'Items are organized by ERA. Earlier eras unlock naturally, while later eras require specific research.',
      'Click any available item in the tech tree to view details and begin construction.',
    ],
    type: 'modal',
    icon: Zap,
  },
  
  // 4. Fleets & Travel
  {
    id: 'fleets-intro',
    order: 6,
    title: 'Fleets & Travel',
    description: 'Navigate the stars',
    content: [
      'FLEETS are groups of ships that travel between planets.',
      'Use fleets to:',
      '• Colonize new planets',
      '• Attack enemy empires',
      '• Defend your territories',
      '• Transfer resources between planets',
      'Fleet travel time depends on distance and ship speed. The Universe Map shows travel lines between planets.',
      'Build ships on planets, then create fleets at your Fleet Command center.',
    ],
    type: 'modal',
    icon: Rocket,
  },
  {
    id: 'fleets-highlight',
    order: 7,
    title: 'Access Fleet Command',
    description: 'Open the Fleet Command panel',
    content: 'Click the Fleets button to access fleet management and ship building.',
    type: 'highlight',
    targetRoute: '/holopad',
    targetSelector: '[data-tutorial="fleets-button"]',
    annotation: 'Click here to manage your fleets',
    requiresInteraction: false,
    icon: Rocket,
  },
  
  // 5. Universe Map
  {
    id: 'map-intro',
    order: 8,
    title: 'Universe Map',
    description: 'Explore the galaxy',
    content: [
      'The UNIVERSE MAP is your window to the cosmos.',
      'The map has 4 levels:',
      '• Quadrants - The largest regions',
      '• Sectors - Sub-regions within quadrants',
      '• Galaxies - Star systems within sectors',
      '• Planets - Individual worlds',
      'Use the map to:',
      '• Discover new planets for colonization',
      '• Plan fleet routes',
      '• Scout enemy positions',
      '• View fleet travel paths (shown as colored lines)',
      'Your visibility determines what you can see. Expand your empire to gain more visibility!',
    ],
    type: 'modal',
    icon: Globe,
  },
  {
    id: 'map-highlight',
    order: 9,
    title: 'Open the Universe Map',
    description: 'Explore the cosmos',
    content: 'Click the Map button to navigate the universe and discover new planets.',
    type: 'highlight',
    targetRoute: '/holopad',
    targetSelector: '[data-tutorial="map-button"]',
    annotation: 'Click here to explore the universe',
    requiresInteraction: false,
    icon: Globe,
  },
  
  // 6. Combat
  {
    id: 'combat-intro',
    order: 10,
    title: 'Combat System',
    description: 'Strategic warfare',
    content: [
      'COMBAT is resolved automatically during ticks.',
      'When attacking:',
      '• Send a fleet with attack orders to an enemy planet',
      '• Combat resolves at the next tick',
      '• Results show losses, resources stolen, and planet capture status',
      'When defending:',
      '• Defensive structures protect your planets',
      '• Stationed fleets can assist in defense',
      '• Review battle reports to analyze outcomes',
      'Ship types have different strengths: fighters excel at offense, while cruisers provide defense.',
      'View all your combat history in the Battle Reports panel.',
    ],
    type: 'modal',
    icon: Sword,
  },
  {
    id: 'combat-highlight',
    order: 11,
    title: 'View Battle Reports',
    description: 'Access your combat history',
    content: 'Click the Battle Reports button to review past combat engagements and learn from victories and defeats.',
    type: 'highlight',
    targetRoute: '/holopad',
    targetSelector: '[data-tutorial="combat-button"]',
    annotation: 'Click here to view battle reports',
    requiresInteraction: false,
    icon: Sword,
  },
  
  // 7. Alliances
  {
    id: 'alliances-intro',
    order: 12,
    title: 'Alliances',
    description: 'Join forces with other empires',
    content: [
      'ALLIANCES allow multiple empires to work together.',
      'Benefits include:',
      '• Shared alliance funds for major projects',
      '• Diplomatic protection',
      '• Coordinated military campaigns',
      '• Alliance chat for communication',
      'To join an alliance:',
      '• Browse available alliances',
      '• Submit a join request',
      '• Or create your own alliance and invite others',
      'Alliance leaders can manage members, funds, and alliance settings.',
    ],
    type: 'modal',
    icon: Users,
  },
  {
    id: 'alliances-highlight',
    order: 13,
    title: 'Explore Alliances',
    description: 'Open the Politics panel',
    content: 'Click the Politics button to browse alliances, submit join requests, or create your own alliance.',
    type: 'highlight',
    targetRoute: '/holopad',
    targetSelector: '[data-tutorial="politics-button"]',
    annotation: 'Click here to manage alliances',
    requiresInteraction: false,
    icon: Users,
  },
  
  // 8. Completion
  {
    id: 'completion',
    order: 14,
    title: 'Tutorial Complete!',
    description: 'You\'re ready to command',
    content: [
      'Congratulations! You now understand the basics of agameof.space.',
      'Remember:',
      '• Resources fuel everything - manage them wisely',
      '• Tech trees unlock new possibilities',
      '• Fleets enable expansion and conquest',
      '• Exploration reveals opportunities',
      '• Alliances provide strength in numbers',
      'The universe awaits your command. Build your empire, expand your influence, and claim your place among the stars!',
      'Good luck, Commander!',
    ],
    type: 'modal',
    icon: Sparkles,
  },
]

// Helper to get step by ID
export function getStepById(stepId: string): TutorialStep | undefined {
  return tutorialSteps.find(step => step.id === stepId)
}

// Helper to get step by order
export function getStepByOrder(order: number): TutorialStep | undefined {
  return tutorialSteps.find(step => step.order === order)
}

// Helper to get all steps
export function getAllSteps(): TutorialStep[] {
  return tutorialSteps.sort((a, b) => a.order - b.order)
}

// Helper to get total step count
export function getTotalSteps(): number {
  return tutorialSteps.length
}

