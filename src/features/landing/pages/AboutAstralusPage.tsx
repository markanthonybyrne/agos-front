import { Globe, Rocket, Shield, Users, Clock, Map, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import heroBridge from '../../../../assets/images/landing/control-table-spacecraft-from-inside copy.jpg'
import nebulaBackdrop from '../../../../assets/images/backgrounds/splash_image_3.jpg'
import citadelImage from '../../../../assets/images/facilities/futuristic-cityscape-illuminated-by-high-tech-technology-generated-by-ai.jpg'
import fleetImage from '../../../../assets/images/sections/planet/fleet.jpg'
import planetSurface from '../../../../assets/images/sections/planet/planet_surface.jpg'

const pillars = [
  {
    icon: Globe,
    title: 'Living Galaxy',
    copy: 'Twenty regions, 8,000+ planets, generational lore. Astralus is a persistent universe where every tick advances the story.',
    stat: '20 regions • 8,000+ planets',
  },
  {
    icon: Rocket,
    title: 'Deterministic Warfare',
    copy: 'You issue the orders. Server-driven ticks process ship movements and combat with precision - out-think rather than out-click.',
    stat: '30 min global ticks',
  },
  {
    icon: Shield,
    title: 'Strategic Depth',
    copy: 'Research five technology eras, fortify with orbital defences, and manage Tellerium, Krypton, and Dark Matter to thrive.',
    stat: '5 technology eras',
  },
  {
    icon: Users,
    title: 'Diplomacy & Alliances',
    copy: 'Forge alliances, share resources, wage synchronized campaigns, or carve your legend alone among the fractured stars.',
    stat: 'Player-driven politics',
  },
]

const timeline = [
  {
    label: 'Awakening',
    headline: 'Cryostasis breach',
    description: 'Your empire emerges from the Great Silence with a single homeworld, limited visibility, and a desperate population.',
  },
  {
    label: 'Expansion',
    headline: 'Colonies ignite',
    description: 'Establish mining and probe networks, settle new worlds, and unlock research to expand your fleet capabilities.',
  },
  {
    label: 'Conflict',
    headline: 'Warfare inevitable',
    description: 'Command synchronized fleets across systems, engage in deterministic battles, and reclaim Tellerium trade routes.',
  },
  {
    label: 'Ascension',
    headline: 'Legacy forged',
    description: 'Dominate the galactic rankings, steward alliances, and influence future patches through live events.',
  },
]

const differentiators = [
  {
    title: 'Server-paced Strategy',
    description:
      'Astralus resolves every action on authoritative servers. Ticks guarantee fairness while still rewarding anticipation and timing.',
  },
  {
    title: 'Permanent Universe',
    description:
      'Empires persist between sessions. Recon gathered today informs campaigns tomorrow - your intelligence network is your edge.',
  },
  {
    title: 'Community-led Evolution',
    description:
      'Balance updates, incidents, and story arcs are shaped alongside the community. Discord is our war room.',
  },
]

export function AboutAstralusPage() {
  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${nebulaBackdrop})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/85 to-black" aria-hidden="true" />
        <div className="container mx-auto px-6 py-24 lg:py-32 flex flex-col-reverse lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2 text-white">
            <p className="uppercase tracking-[0.3em] text-sm text-cyan-300/90">About Astralus</p>
            <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Command the fractured stars, shape a living sci-fi saga.
            </h1>
            <p className="mt-6 text-lg text-white/70 leading-relaxed">
              Astralus blends grand strategy, MMO persistence, and cinematic storytelling. Every action echoes across a universe
              that runs even while you sleep. Wake to new alliances, intercepted fleets, and fresh opportunities to carve your legacy.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => window.open('https://discord.gg/astralus', '_blank', 'noopener')}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              >
                Join the Armada
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10"
                onClick={() => window.location.assign('/register')}
              >
                Play for free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/40 via-transparent to-purple-500/30 blur-3xl" aria-hidden="true" />
              <img
                src={heroBridge}
                alt="Command bridge overlooking Astralus starfields"
                className="relative rounded-3xl border border-white/10 shadow-[0_30px_120px_rgba(8,145,178,0.4)]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-24">
        <div className="grid gap-8 md:grid-cols-2">
          {pillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <div
                key={pillar.title}
                className="rounded-3xl border border-white/10 bg-black/50 p-8 shadow-[0_20px_60px_rgba(7,89,133,0.35)] backdrop-blur-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h2 className="text-2xl font-semibold text-white">{pillar.title}</h2>
                </div>
                <p className="mt-6 text-base text-white/70 leading-relaxed">{pillar.copy}</p>
                <p className="mt-6 text-sm uppercase tracking-[0.2em] text-cyan-200/70">{pillar.stat}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <img src={citadelImage} alt="Astralus orbital citadel" className="h-full w-full object-cover object-center opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-black" aria-hidden="true" />
        </div>
        <div className="container mx-auto px-6 py-24">
          <h2 className="text-3xl md:text-4xl font-semibold text-white text-center">Seasonal Operations Timeline</h2>
          <p className="mt-4 text-white/70 text-center max-w-3xl mx-auto">
            Campaigns unfold in arcs. New technology, incidents, and balance passes drop with each season; commanders drive the story forward.
          </p>
          <div className="mt-16 grid gap-8 md:grid-cols-4">
            {timeline.map((entry) => (
              <div
                key={entry.label}
                className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-lg flex flex-col"
              >
                <span className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">{entry.label}</span>
                <h3 className="mt-4 text-xl font-semibold text-white">{entry.headline}</h3>
                <p className="mt-4 text-sm text-white/65 leading-relaxed">{entry.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-200/80">Why Commanders Stay</p>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold text-white">
              Built for strategists, storytellers, and alliance architects.
            </h2>
            <div className="mt-8 space-y-6">
              {differentiators.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur-md">
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-base text-white/70 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/40 to-cyan-500/30 blur-3xl" aria-hidden="true" />
            <div className="relative space-y-6">
              <img
                src={fleetImage}
                alt="Alliance fleets rendezvous above a quantum world"
                className="w-full rounded-3xl border border-white/10 shadow-[0_20px_80px_rgba(8,145,178,0.4)]"
              />
              <img
                src={planetSurface}
                alt="Planet-side command post on Astralus surface"
                className="w-3/4 rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(139,92,246,0.35)] ml-auto"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-black/70 to-purple-500/10 p-12 text-center backdrop-blur-xl">
          <Sparkles className="mx-auto h-10 w-10 text-cyan-300" />
          <h2 className="mt-6 text-3xl md:text-4xl font-semibold text-white">Write the next chapter</h2>
          <p className="mt-4 text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
            Astralus evolves with every commander. Secure your seat at the war council, align with an alliance, and fight across the seasons to leave a mark in the Astral Chronicle.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              onClick={() => window.location.assign('/register')}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              Play for free
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
              onClick={() => window.location.assign('/login')}
            >
              Command Center Login
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

