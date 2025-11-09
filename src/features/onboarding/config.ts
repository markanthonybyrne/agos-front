import { CinematicConfig, GuidedTourConfig } from './types'

const introVideo = new URL('../../../assets/video/tutorial_intro.mp4', import.meta.url).href
const introAudio = new URL('../../../assets/audio/tutorial_intro.mp3', import.meta.url).href

export const ASTRALUS_CINEMATIC: CinematicConfig = {
  videoSrc: introVideo,
  audioSrc: introAudio,
  copy: [
    {
      id: 'opening',
      content: 'This is your moment, Commander.',
      startTimeMs: 0,
      endTimeMs: 2500,
    },
    {
      id: 'stars-await',
      content: 'The stars await your command!... The void whispers your name....',
      startTimeMs: 2500,
      endTimeMs: 7000,
    },
    {
      id: 'branching-fates',
      content: 'Will you be a conqueror, a protector... or a builder?',
      startTimeMs: 7000,
      endTimeMs: 11500,
    },
    {
      id: 'alliance-choice',
      content: 'Will you stand alone against the darkness, or forge bonds that will last a thousand years?',
      startTimeMs: 11500,
      endTimeMs: 17000,
    },
    {
      id: 'choice',
      content: 'The choice is yours.',
      startTimeMs: 17000,
      endTimeMs: 20000,
    },
    {
      id: 'consequences',
      content:
        'But remember: in Astralus, there are no second chances. Every tick counts. Every decision echoes. Every alliance is a gamble.',
      startTimeMs: 20000,
      endTimeMs: 28000,
    },
    {
      id: 'legacy',
      content: 'And in the end, only one question matters: What kind of legacy will you leave among the fractured stars?',
      startTimeMs: 28000,
    },
  ],
}

export const ASTRALUS_TOUR: GuidedTourConfig = {
  allowSkip: true,
  resumeEnabled: true,
  steps: [
    {
      id: 'galaxy-map',
      title: 'Explore the Galaxy',
      description:
        'Use the galaxy map to pan across regions, zoom into systems, and plot fleet trajectories. Filters reveal incidents, resource hotspots, and your sphere of influence.',
      targetSelector: '[data-onboarding-target="galaxy-map"]',
      route: '/map',
    },
    {
      id: 'hud',
      title: 'Command HUD',
      description:
        'The floating HUD keeps your tick countdown, resource deltas, and quick actions in view. Drag it where you need it; it tucks away automatically when you go idle.',
      targetSelector: '[data-onboarding-target="hud"]',
      route: '/map',
    },
    {
      id: 'quick-dock',
      title: 'Quick Access Dock',
      description:
        'This vertical dock is your launch bar for notifications, mail, construction, fleets, markets, and more. Each icon mirrors the left-hand UI guide categories.',
      targetSelector: '[data-onboarding-target="quick-dock"]',
      route: '/map',
    },
    {
      id: 'holopad',
      title: 'Holopad Desktop',
      description:
        'Build your personal command desktop here. Drag widgets for fleets, resources, markets, or tech into layouts that match your play style—the holopad saves everything automatically.',
      targetSelector: '[data-onboarding-target="holopad"]',
      route: '/holopad',
    },
  ],
}


