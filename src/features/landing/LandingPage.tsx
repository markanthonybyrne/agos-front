import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, BookOpen, Shield, Users, Rocket, Zap, Globe, Swords, Search, Clock, Target, Layers, TrendingUp, Factory } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brandImages'
// Import background images
import splashImage1 from '../../../assets/images/backgrounds/splash_image_1.jpg'
import splashImage2 from '../../../assets/images/backgrounds/splash_image_2.jpg'
import splashImage3 from '../../../assets/images/backgrounds/splash_image_3.jpg'
import splashImage4 from '../../../assets/images/backgrounds/splash_image_4.jpg'
import consoleImage from '../../../assets/images/backgrounds/console.jpg'

export function LandingPage() {
  const navigate = useNavigate()
  
  // Randomly select background on mount
  const [backgroundUrl] = useState(() => {
    const backgrounds = [splashImage1, splashImage2, splashImage3, splashImage4, consoleImage]
    return backgrounds[Math.floor(Math.random() * backgrounds.length)]
  })

  const coreFeatures = [
    {
      icon: Rocket,
      title: 'Fleet Command',
      description: 'Design and command fleets of fighters, cruisers, carriers, and motherships. Expand your reach across 20 regions and 8,000+ planets.',
      stat: '7 Ship Classes',
      color: 'cyan',
    },
    {
      icon: Globe,
      title: 'Planetary Colonization',
      description: 'Explore the universe and colonize 25 distinct planet types. Manage Tellerium and Krypton production across your empire.',
      stat: '8,000+ Planets',
      color: 'blue',
    },
    {
      icon: Users,
      title: 'Alliance Warfare',
      description: 'Forge diplomatic bonds, share resources through alliance funds, and coordinate synchronized attacks on common enemies.',
      stat: 'Strategic Depth',
      color: 'purple',
    },
    {
      icon: Zap,
      title: 'Research & Technology',
      description: 'Unlock 5 eras of technology. Research cutting-edge facilities, ships, and defences to gain strategic advantages.',
      stat: '5 Technology Eras',
      color: 'yellow',
    },
    {
      icon: Shield,
      title: 'Orbital Defences',
      description: 'Fortify your planets with Ion Cannons, Quantum Disruptors, and Dark Matter Shields. Protect what you\'ve built.',
      stat: 'Multi-Tier Defence',
      color: 'green',
    },
    {
      icon: Search,
      title: 'Fog of War',
      description: 'Navigate a universe hidden in darkness. Expand visibility through research and signal scanning. Discover before you conquer.',
      stat: 'Dynamic Visibility',
      color: 'orange',
    },
  ]

  const gameplayFeatures = [
    {
      icon: Clock,
      title: 'Tick-Based Strategy',
      description: 'Every 30 minutes, the universe advances. Resources are produced, fleets move, battles are resolved. Plan carefully—every decision echoes.',
      detail: 'Server-driven ticks ensure fair, deterministic gameplay',
    },
    {
      icon: Target,
      title: 'Deterministic Combat',
      description: 'Turn-based fleet combat with detailed ship statistics. Initiative, accuracy, and special abilities determine victory.',
      detail: 'Same inputs always produce the same results',
    },
    {
      icon: Layers,
      title: 'Empire Management',
      description: 'Build infrastructure, manage resources, and expand to 5 planets maximum. Balance production, research, and military might.',
      detail: 'Maximum 5 planets per empire (1 homeworld + 4 colonies)',
    },
    {
      icon: TrendingUp,
      title: 'Competitive Rankings',
      description: 'Climb the leaderboards by building a powerful empire. Compete for dominance in galaxy, alliance, and global rankings.',
      detail: 'Score calculated from ships, defences, planets, and facilities',
    },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Fixed background layer with enhanced darkness */}
      <div
        className="fixed inset-0 -z-10"
        style={{ 
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.3) contrast(1.1)',
        }}
      />
      
      {/* Enhanced gradient overlays - EVE/Endless Space style */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Deep space gradient */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(6, 182, 212, 0.15) 0%, transparent 60%)',
          }}
        />
        {/* Nebula effect */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 20% 50%, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
          }}
        />
        {/* Dark space vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background/95" />
        {/* Side vignettes for cinematic effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40" />
      </div>
      
      {/* Animated stars overlay - more subtle */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {[...Array(150)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 1.5 + 0.5}px`,
              height: `${Math.random() * 1.5 + 0.5}px`,
              opacity: Math.random() * 0.4 + 0.2,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
              boxShadow: '0 0 2px rgba(255, 255, 255, 0.6)',
            }}
          />
        ))}
      </div>

      {/* Floating energy particles - more sophisticated */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 400 + 150}px`,
              height: `${Math.random() * 400 + 150}px`,
              background: `radial-gradient(circle, rgba(6, 182, 212, ${Math.random() * 0.08 + 0.02}) 0%, transparent 70%)`,
              filter: 'blur(40px)',
              animation: `float ${Math.random() * 20 + 20}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen">
        {/* Hero Section - More dramatic */}
        <div className="container mx-auto px-4 py-16 lg:py-32">
          <div className="max-w-5xl mx-auto text-center space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {/* Logo with enhanced glow */}
            <div className="flex justify-center mb-12">
              <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-cyan-500/30 rounded-full animate-pulse" />
                <img 
                  src={BRAND.logo} 
                  alt="Astralus" 
                  className="relative h-40 lg:h-56 w-auto object-contain filter drop-shadow-[0_0_40px_rgba(6,182,212,0.8)]"
                />
              </div>
            </div>
            
            {/* Main Title - More dramatic */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 tracking-tight">
                <span className="glow-cyan block mb-2">ASTRALUS</span>
                <span className="text-3xl md:text-5xl lg:text-6xl font-light text-muted-foreground block mt-2">
                  The Fractured Stars Await
                </span>
              </h1>
              
              {/* Tagline */}
              <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed font-light">
                A tick-based grand strategy MMO where empires rise and fall among the stars
              </p>
            </div>
            
            {/* CTA Buttons - More prominent */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-4">
              <Button
                onClick={() => navigate('/register')}
                size="lg"
                className={cn(
                  'text-xl px-12 py-8 h-auto font-semibold',
                  'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700',
                  'text-white border-2 border-cyan-400/50',
                  'shadow-2xl shadow-cyan-500/40',
                  'transition-all duration-300 group',
                  'hover:scale-105 hover:shadow-cyan-500/60',
                  'relative overflow-hidden'
                )}
              >
                <span className="relative z-10 flex items-center">
                  <Rocket className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                  Awaken Your Empire
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </Button>
              
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                size="lg"
                className={cn(
                  'text-xl px-12 py-8 h-auto font-semibold',
                  'border-2 border-cyan-500/50 hover:border-cyan-500/80',
                  'bg-background/40 hover:bg-background/60',
                  'backdrop-blur-md transition-all duration-300',
                  'hover:scale-105 shadow-xl shadow-cyan-500/20',
                  'panel-glass'
                )}
              >
                Access Command Center
              </Button>
            </div>

            {/* Manual Link */}
            <div className="pt-6">
              <Button
                onClick={() => navigate('/manual')}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground text-lg"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Read Player Manual
              </Button>
            </div>
          </div>
        </div>

        {/* Prologue Section - Enhanced with manual content */}
        <div className="container mx-auto px-4 pt-8 pb-16">
          <div className="max-w-5xl mx-auto">
            <Card className={cn(
              'panel-glass surface-gradient card-glow vignette',
              'border-cyan-500/50 shadow-2xl shadow-cyan-500/30',
              'relative overflow-hidden',
              'backdrop-blur-md bg-background/60'
            )}>
              <CardHeader className="flex-shrink-0 p-6 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-transparent">
                <CardTitle className="text-2xl font-bold">
                  <span className="glow-cyan">Prologue: The Fractured Stars</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-8 text-lg leading-relaxed">
                <p className="text-xl text-foreground font-medium italic">
                  <span className="text-cyan-400">The Great Silence came without warning.</span>
                </p>
                <p className="text-muted-foreground">
                  For millennia, the <strong className="text-foreground">Galactic Consortium</strong> maintained peace across the known universe. The <span className="text-cyan-400 font-semibold">Tellerium-Krypton Accord</span> bound a thousand worlds together, sharing resources and protecting the weak. But greed knows no bounds, and when the Consortium's central authority collapsed under the weight of corruption and ambition, the accord shattered like glass.
                </p>
                <p className="text-foreground font-semibold text-xl pt-2">
                  Now, you are alone in the void.
                </p>
                <p className="text-muted-foreground">
                  The remnants of the Consortium scattered across <strong className="text-foreground">twenty regions</strong>, each containing countless star systems teeming with planets—some barren, some rich with resources, all waiting to be claimed. The old rules are gone. The strong prey upon the weak. Alliances form and break like tides.
                </p>
                <p className="text-muted-foreground">
                  You are a <span className="text-cyan-400 font-semibold">Commander</span>, awakened from cryogenic stasis to find your homeworld isolated and vulnerable. Your people look to you for salvation, for conquest, for survival. But you are not the only one who has awakened.
                </p>
                <p className="text-foreground font-bold text-2xl pt-6 border-t border-cyan-500/30">
                  <span className="glow-cyan">This is your moment, Commander. The stars await your command.</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Core Features Section - Enhanced grid */}
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="glow-cyan">Master the Universe</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Strategic depth meets galactic conquest in a tick-based grand strategy experience
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {coreFeatures.map((feature, index) => {
                const Icon = feature.icon
                const colorClasses = {
                  cyan: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10',
                  blue: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
                  purple: 'border-purple-500/50 text-purple-400 bg-purple-500/10',
                  yellow: 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10',
                  green: 'border-green-500/50 text-green-400 bg-green-500/10',
                  orange: 'border-orange-500/50 text-orange-400 bg-orange-500/10',
                }
                const colorClass = colorClasses[feature.color as keyof typeof colorClasses] || colorClasses.cyan
                
                return (
                  <Card
                    key={index}
                    className={cn(
                      'panel-glass surface-gradient card-glow vignette',
                      'border-cyan-500/40 shadow-xl shadow-cyan-500/10',
                      'hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-500',
                      'relative overflow-hidden group',
                      'hover:scale-[1.02] hover:-translate-y-1',
                      'backdrop-blur-md bg-background/50'
                    )}
                  >
                    <CardHeader className="flex-shrink-0 p-4 border-b border-border/50 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-10 h-10 rounded flex items-center justify-center border-2', colorClass)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <CardTitle className="text-lg font-semibold">
                            {feature.title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <CardDescription className="text-base leading-relaxed text-muted-foreground">
                        {feature.description}
                      </CardDescription>
                      <div className="pt-2 border-t border-border/30">
                        <span className="text-sm font-semibold text-cyan-400">
                          {feature.stat}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        {/* Gameplay Highlights - Enhanced */}
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="glow-cyan">Strategic Gameplay</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Every decision matters in this deterministic, tick-based universe
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {gameplayFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card 
                    key={index}
                    className={cn(
                      'panel-glass surface-gradient card-glow vignette',
                      'border-cyan-500/40 shadow-xl shadow-cyan-500/10',
                      'relative overflow-hidden',
                      'backdrop-blur-md bg-background/50',
                      'hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300'
                    )}
                  >
                    <CardHeader className="flex-shrink-0 p-6 border-b border-border/50 bg-muted/20">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-cyan-500/20 border-2 border-cyan-500/50">
                          <Icon className="w-6 h-6 text-cyan-400" />
                        </div>
                        <CardTitle className="text-xl font-semibold glow-cyan">
                          {feature.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="pt-3 border-t border-border/30">
                        <p className="text-sm text-cyan-400/80 font-medium">
                          {feature.detail}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        {/* Key Stats Section */}
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-6xl mx-auto">
            <Card className={cn(
              'panel-glass surface-gradient card-glow vignette',
              'border-cyan-500/50 shadow-2xl shadow-cyan-500/30',
              'backdrop-blur-md bg-background/60'
            )}>
              <CardHeader className="p-6 border-b border-cyan-500/30">
                <CardTitle className="text-2xl font-bold text-center">
                  <span className="glow-cyan">The Universe Awaits</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  <div>
                    <div className="text-4xl md:text-5xl font-bold text-cyan-400 mb-2">20</div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider">Regions</div>
                  </div>
                  <div>
                    <div className="text-4xl md:text-5xl font-bold text-cyan-400 mb-2">8,000+</div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider">Planets</div>
                  </div>
                  <div>
                    <div className="text-4xl md:text-5xl font-bold text-cyan-400 mb-2">7</div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider">Ship Classes</div>
                  </div>
                  <div>
                    <div className="text-4xl md:text-5xl font-bold text-cyan-400 mb-2">5</div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider">Technology Eras</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Final CTA Section - More dramatic */}
        <div className="container mx-auto px-4 py-24 lg:py-40">
          <div className="max-w-5xl mx-auto text-center">
            <Card className={cn(
              'panel-glass surface-gradient card-glow vignette',
              'border-cyan-500/50 shadow-2xl shadow-cyan-500/40',
              'relative overflow-hidden',
              'backdrop-blur-md bg-background/60'
            )}>
              <CardHeader className="p-8 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-transparent">
                <CardTitle className="text-3xl md:text-4xl font-bold">
                  <span className="glow-cyan">Begin Your Journey</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                  Join thousands of commanders in the ultimate space strategy experience. 
                  <br />
                  <span className="text-foreground font-semibold">What kind of legacy will you leave among the fractured stars?</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
                  <Button
                    onClick={() => navigate('/register')}
                    size="lg"
                    className={cn(
                      'text-xl px-12 py-8 h-auto font-semibold',
                      'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700',
                      'text-white border-2 border-cyan-400/50',
                      'shadow-2xl shadow-cyan-500/40',
                      'transition-all duration-300 group',
                      'hover:scale-105 hover:shadow-cyan-500/60',
                      'relative overflow-hidden'
                    )}
                  >
                    <span className="relative z-10 flex items-center">
                      <Rocket className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                      Create Your Empire
                      <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/login')}
                    variant="outline"
                    size="lg"
                    className={cn(
                      'text-xl px-12 py-8 h-auto font-semibold',
                      'border-2 border-cyan-500/50 hover:border-cyan-500/80',
                      'bg-background/40 hover:bg-background/60',
                      'backdrop-blur-md transition-all duration-300',
                      'hover:scale-105 shadow-xl shadow-cyan-500/20',
                      'panel-glass'
                    )}
                  >
                    Access Command Center
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Copyright Footer */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} iammarkyb studios. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.1;
          }
          33% {
            transform: translate(60px, -60px) scale(1.2);
            opacity: 0.2;
          }
          66% {
            transform: translate(-40px, 40px) scale(0.9);
            opacity: 0.15;
          }
        }
      `}</style>
    </div>
  )
}

