import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Rocket, Globe, Users, Shield, Clock, AlertTriangle, Layers, Sparkles, ArrowRight, BookOpen } from 'lucide-react'
import heroVista from '../../../assets/images/landing/fantasy-scene-with-surreal-landscape.jpg'
import bridgeShot from '../../../assets/images/landing/control-table-spacecraft-from-inside.jpg'
import fleetShot from '../../../assets/images/sections/planet/fleet.jpg'
import planetVista from '../../../assets/images/sections/planet/planet_home_panel.jpg'

const pillarFeatures = [
  {
    icon: Rocket,
    title: 'Command Legendary Fleets',
    description:
      'Assemble fighters, carriers, and dreadnoughts. Coordinate movements across twenty regions with tick-perfect precision.',
  },
  {
    icon: Globe,
    title: 'Shape the Frontier',
    description:
      'Colonise more than 8,000 planets across 25 archetypes. Each world fuels Tellerium, Krypton, and rare secondary resources vital to your empire.',
  },
  {
    icon: Users,
    title: 'Forge Alliances',
    description:
      'Share intel, coordinate incidents, and wage synchronized campaigns. Diplomacy is as lethal as plasma torpedoes.',
  },
  {
    icon: Shield,
    title: 'Fortify the Void',
    description:
      'Build ion cannons, quantum disruptors, and orbital shields to protect your star systems from rival incursions.',
  },
]

const gameplayBeats = [
  {
    icon: Clock,
    title: 'Meaningful Ticks',
    detail:
      'Every thirty minutes the universe advances - production, research, fleet arrivals, and incident fallout resolve deterministically.',
  },
  {
    icon: AlertTriangle,
    title: 'Live Incidents',
    detail:
      'Galaxy-wide crises, derelict recoveries, and seasonal events demand quick reactions. Rally allies and exploit each tick-driven window.',
  },
  {
    icon: Layers,
    title: 'Empire in Balance',
    detail:
      'Up to five worlds, infinite potential. Balance Tellerium, Krypton, Dark Matter, and secondary resource chains to climb the galactic rankings.',
  },
]

const statHighlights = [
  { label: 'Regions', value: '20' },
  { label: 'Colonisable Planets', value: '8,000+' },
  { label: 'Planet Archetypes', value: '25' },
  { label: 'Tech Eras', value: '5' },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="relative">
      <section className="container mx-auto px-6 py-24 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="text-white">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">Play for free</p>
            <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight">
              Command the fractured stars in a living sci-fi grand strategy MMO.
            </h1>
            <p className="mt-6 text-lg text-white/75 leading-relaxed">
              Astralus runs even while you sleep. Coordinate fleets, fortify colonies, and navigate alliance intrigue in a
              deterministic universe inspired by classic space operas.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
                onClick={() => navigate('/register')}
              >
                Play for free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10"
                onClick={() => navigate('/login')}
              >
                Command Center Login
              </Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-4 text-sm text-white/70">
              {statHighlights.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center backdrop-blur-lg">
                  <div className="text-2xl font-semibold text-white">{stat.value}</div>
                  <div className="mt-2 uppercase tracking-[0.2em] text-white/60 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 to-purple-500/20 blur-3xl" aria-hidden="true" />
            <img
              src={heroVista}
              alt="Astralus nebula vista"
              className="relative rounded-3xl border border-white/10 shadow-[0_24px_80px_rgba(8,145,178,0.4)]"
            />
          </div>
        </div>
        <div className="mt-10">
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white"
            onClick={() => navigate('/manual')}
          >
            <BookOpen className="mr-2 h-5 w-5" />
            Read the Player Manual
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto text-center text-white">
          <Sparkles className="mx-auto h-10 w-10 text-cyan-300" />
          <h2 className="mt-6 text-3xl md:text-4xl font-semibold">Why commanders choose Astralus</h2>
          <p className="mt-4 text-white/70 leading-relaxed">
            Built to evoke the cinematic tension of classic space epics - minus the grind. Every system is server-authored and fair.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {pillarFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-black/60 p-8 shadow-[0_20px_60px_rgba(8,145,178,0.35)] backdrop-blur-xl"
              >
                <div className="flex items-center gap-4 text-white">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="mt-6 text-sm leading-relaxed text-white/70">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={bridgeShot} alt="Astralus command bridge" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/75 to-black" aria-hidden="true" />
        </div>
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-3xl text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">The fractured stars</p>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold">Your saga continues between sessions</h2>
            <p className="mt-6 text-white/70 leading-relaxed">
              Astralus processes the galaxy on a relentless cadence. Wake up to intercepted fleets, conclude diplomatic gambits, and
              launch counter-strikes before the next tick hits. The universe never pauses.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {gameplayBeats.map((beat) => {
              const Icon = beat.icon
              return (
                <div key={beat.title} className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-xl text-white">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-semibold">{beat.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-white/70">{beat.detail}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div className="text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Eyes on the galaxy</p>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold">Scan. Colonise. Dominate.</h2>
            <p className="mt-6 text-white/70 leading-relaxed">
              Multi-layer intel keeps commanders sharp. Deploy probes, trace signals, and use the holopad to monitor construction,
              market swings, and alliance assignments from one glass dashboard.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-md">
                <span className="text-white font-semibold">Sensor Intel Matrix</span>
                <p className="mt-2">Live signal sweeps and recon overlays reveal approaching fleets, incidents, and rank shifts.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-md">
                <span className="text-white font-semibold">Alliance Coordination</span>
                <p className="mt-2">Share resources, announcements, and combat pings in real time.</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/30 to-cyan-500/20 blur-3xl" aria-hidden="true" />
            <div className="relative space-y-6">
              <img
                src={fleetShot}
                alt="Alliance fleets assemble"
                className="w-full rounded-3xl border border-white/10 shadow-[0_24px_80px_rgba(8,145,178,0.4)]"
              />
              <img
                src={planetVista}
                alt="Planet-side operations"
                className="w-3/4 rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(139,92,246,0.35)] ml-auto"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-cyan-500/10 via-black/75 to-purple-500/10 p-12 text-center backdrop-blur-2xl text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Begin your legend</p>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold">The next tick is approaching. Are you ready?</h2>
          <p className="mt-6 text-white/70 leading-relaxed max-w-2xl mx-auto">
            Take command for free, master the onboarding cinematic, and secure your first colonies before rival empires awaken.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              onClick={() => navigate('/register')}
            >
              Play for free
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
              onClick={() => navigate('/support')}
            >
              Need Help?
            </Button>
          </div>
          <p className="mt-6 text-xs text-white/50">Premium currency is optional. Skill, coordination, and strategy win the war.</p>
        </div>
      </section>
    </div>
  )
}
