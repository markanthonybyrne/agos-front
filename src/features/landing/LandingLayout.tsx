import { PropsWithChildren, useMemo } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { BRAND } from '@/lib/brandImages'
import splashImage1 from '../../../assets/images/backgrounds/splash_image_1.jpg'
import splashImage2 from '../../../assets/images/backgrounds/splash_image_2.jpg'
import splashImage3 from '../../../assets/images/backgrounds/splash_image_3.jpg'
import splashImage4 from '../../../assets/images/backgrounds/splash_image_4.jpg'
import consoleImage from '../../../assets/images/backgrounds/console.jpg'
import landingBridge from '../../../assets/images/landing/control-table-spacecraft-from-inside.jpg'
import landingCity from '../../../assets/images/landing/futuristic-cityscape-illuminated-by-high-tech-technology-generated-by-ai.jpg'
import landingStation from '../../../assets/images/landing/futuristic-scifi-communication-station-distant-alien-world-with-sleek-domed-architecture-holographic-technology.jpg'
import planetVista from '../../../assets/images/sections/planet/planet_surface.jpg'

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About Astralus' },
  { path: '/learn', label: 'Learn to Play' },
  { path: '/support', label: 'Support' },
]

const backgroundPool = [
  splashImage1,
  splashImage2,
  splashImage3,
  splashImage4,
  consoleImage,
  landingBridge,
  landingCity,
  landingStation,
  planetVista,
]

type LandingLayoutProps = PropsWithChildren<{
  forceBackground?: string
}>

function ActiveNavLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'text-white' : 'text-white/70 hover:text-white',
        ].join(' ')
      }
      end={to === '/'}
    >
      {label}
    </NavLink>
  )
}

export function LandingLayout({ children, forceBackground }: LandingLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const backgroundUrl = useMemo(() => {
    if (forceBackground) return forceBackground
    const index = Math.floor(Math.random() * backgroundPool.length)
    return backgroundPool[index]
  }, [forceBackground])

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/80 via-black/70 to-black/90" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_60%)]" aria-hidden="true" />

      <header className="relative z-20 overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundUrl})`, filter: 'brightness(0.45) contrast(1.05)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/90" />
        </div>
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md"
            aria-label="Astralus home"
          >
            <img src={BRAND.logo} alt="Astralus" className="h-12 w-auto drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]" />
            <span className="text-sm font-normal tracking-widest text-white/80">O N L I N E</span>
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <ActiveNavLink key={link.path} to={link.path} label={link.label} />
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="text-white/80 hover:text-white"
            >
              Login
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/register')}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              Play for free
            </Button>
          </div>
        </div>
      </header>

      <div className="relative z-10">
        <nav className="md:hidden border-t border-white/10 bg-black/60 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-3 flex flex-wrap gap-3">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                variant={location.pathname === link.path ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate(link.path)}
                className="text-white/80 hover:text-white grow basis-[45%]"
              >
                {link.label}
              </Button>
            ))}
          </div>
        </nav>

        <main className="min-h-[calc(100vh-220px)] relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black/90 pointer-events-none" />
          <div className="relative z-10">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      <footer className="relative z-20 border-t border-white/10 bg-black/80">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row gap-6 md:gap-0 items-start md:items-center justify-between text-sm text-white/60">
          <div>
            <p>© {new Date().getFullYear()} iammarkyb studios. All rights reserved.</p>
            <p className="mt-1">A tick-based grand strategy MMO among the fractured stars.</p>
          </div>
          <div className="flex gap-4">
            <NavLink to="/terms" className="hover:text-white">Terms</NavLink>
            <NavLink to="/privacy" className="hover:text-white">Privacy</NavLink>
            <a
              href="https://discord.gg/astralus"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              Discord
            </a>
            <a href="mailto:support@astralus.online" className="hover:text-white">
              support@astralus.online
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export function LandingLayoutContainer({ children }: PropsWithChildren) {
  return <LandingLayout>{children}</LandingLayout>
}

