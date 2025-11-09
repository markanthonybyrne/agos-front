import { useNavigate } from 'react-router-dom'
import { BookOpen, Radar, Factory, Shield, Map, Route, Timer, Layers, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import heroImage from '../../../../assets/images/backgrounds/splash_image_2.jpg'
import cockpitImage from '../../../../assets/images/landing/futuristic-office-design-modern-creative-interior-photoshoot-created-with-generative-ai.jpg'
import holopadImage from '../../../../assets/images/facilities/futuristic-scifi-communication-station-distant-alien-world-with-sleek-domed-architecture-holographic-technology.jpg'

const firstHourChecklist = [
  {
    icon: Radar,
    title: 'Survey your homeworld',
    description:
      'Review planet stats, starting resources, and the command HUD. Let the cinematic briefing finish streaming while Astralus loads.',
  },
  {
    icon: Factory,
    title: 'Kick-start production',
    description:
      'Queue Mines, Probes, and your first Research Lab to secure Tellerium and Krypton income before the second tick hits.',
  },
  {
    icon: BookOpen,
    title: 'Unlock doctrine',
    description:
      'Research Military Doctrine and Basic Combat to open shipyards, Assault Fighters, and essential combat tooling.',
  },
  {
    icon: Route,
    title: 'Chart expansion routes',
    description:
      'Scan nearby systems, bookmark promising worlds, and prep a Colony Ship. Colonize within your first few hours to secure growth.',
  },
]

const interfaceSurfaces = [
  {
    icon: Map,
    title: 'Galaxy Map',
    description:
      'Drag, zoom, and right-click to queue scouting, launch tachyon signals, or set fleet destinations. Incident overlays keep you informed.',
  },
  {
    icon: Layers,
    title: 'Holopad Desktop',
    description:
      'Your widget workspace for production, fleets, research, and market intel. Layout persists between sessions - design your command deck.',
  },
  {
    icon: Compass,
    title: 'Quick Access Dock',
    description:
      'Instant access to notifications, mail, build queues, and the tech encyclopaedia. Keyboard and focus states keep it accessible.',
  },
  {
    icon: Shield,
    title: 'Planet Console',
    description:
      'Hex-grid interface to manage facilities, population policies, and orbitals. Queue defences, fleets, and research per colony.',
  },
]

const masteryTracks = [
  {
    title: 'Resource Rhythm',
    description:
      'Balance Tellerium, Krypton, and Dark Matter. Upgrade extraction, route payloads between planets, and stay cash-flow positive across ticks.',
  },
  {
    title: 'Fleet Logistics',
    description:
      'Stage fighters, carriers, and colony ships. Time departures with tick cadence, redirect mid-flight, and intercept opposing fleets.',
  },
  {
    title: 'Technology Planning',
    description:
      'Advance through five eras with tech plans. Chain prerequisites, leverage advisor hints, and sync research with construction.',
  },
  {
    title: 'Diplomacy & Intelligence',
    description:
      'Use alliance funds, shared intel, and incidents to shape the galactic stage. Fog of war makes recon and signals a strategic weapon.',
  },
]

export function LearnToPlayPage() {
  const navigate = useNavigate()

  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/75 to-black" aria-hidden="true" />
        <div className="container mx-auto px-6 py-24 lg:py-32 grid gap-16 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">Learn to Play</p>
            <h1 className="mt-6 text-4xl md:text-5xl font-bold text-white tracking-tight">
              From cryostasis to command. Master Astralus in your first campaign.
            </h1>
            <p className="mt-6 text-lg text-white/75 leading-relaxed">
              The Astralus Player Manual and UI Field Guide combine to onboard every commander. Use this primer to plan your opening
              moves, understand the interface surfaces, and get battle-ready before the first galactic incident erupts.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/manual')}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              >
                Read Player Manual
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10"
                onClick={() => navigate('/register')}
              >
                Play for free
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 to-purple-500/20 blur-3xl" aria-hidden="true" />
            <img
              src={cockpitImage}
              alt="Astralus tactical training chamber"
              className="relative rounded-3xl border border-white/10 shadow-[0_24px_80px_rgba(8,145,178,0.4)]"
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white">First Hour Checklist</h2>
          <p className="mt-4 text-white/70">
            Straight from the Player Manual - follow this path to establish your empire before the galaxy reacts.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {firstHourChecklist.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="rounded-3xl border border-white/10 bg-black/55 p-8 shadow-[0_20px_60px_rgba(8,145,178,0.35)] backdrop-blur-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                </div>
                <p className="mt-6 text-sm text-white/70 leading-relaxed">{step.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={holopadImage} alt="Holopad tactical interface" className="h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/75 to-black" aria-hidden="true" />
        </div>
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-white">Interface Surfaces</h2>
            <p className="mt-4 text-white/70">
              The Astralus UI Field Guide spotlights every control surface. Learn these four hubs to stay in command.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {interfaceSurfaces.map((surface) => {
              const Icon = surface.icon
              return (
                <div
                  key={surface.title}
                  className="rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="text-xl font-semibold text-white">{surface.title}</h3>
                  </div>
                  <p className="mt-6 text-sm text-white/70 leading-relaxed">{surface.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white">Paths to Mastery</h2>
          <p className="mt-4 text-white/70">
            Astralus rewards long-term planning. Focus on these strategic tracks as you graduate from rookie to admiral.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {masteryTracks.map((track) => (
            <div
              key={track.title}
              className="rounded-3xl border border-white/10 bg-black/55 p-8 backdrop-blur-lg"
            >
              <h3 className="text-xl font-semibold text-white">{track.title}</h3>
              <p className="mt-4 text-sm text-white/70 leading-relaxed">{track.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-cyan-500/10 via-black/75 to-purple-500/10 p-12 text-center backdrop-blur-2xl">
          <Timer className="mx-auto h-10 w-10 text-cyan-300" />
          <h2 className="mt-6 text-3xl md:text-4xl font-semibold text-white">Ready for your first tick?</h2>
          <p className="mt-4 text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
            Register now to experience the full onboarding cinematic, guided UI tour, and faction briefings. The universe keeps
            moving - log in before the next tick to secure your opening moves.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              Play for free
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
          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/40">Tick cadence · Deterministic combat · Community-driven balance</p>
        </div>
      </section>
    </div>
  )
}

