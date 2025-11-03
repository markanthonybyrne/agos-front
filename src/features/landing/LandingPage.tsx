import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, BookOpen, Shield, Users, Rocket, Zap, Globe, Swords, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brandImages'
// Import background images
import splashImage1 from '../../../assets/images/backgrounds/splash_image_1.jpg'
import splashImage2 from '../../../assets/images/backgrounds/splash_image_2.jpg'
import splashImage3 from '../../../assets/images/backgrounds/splash_image_3.jpg'
import splashImage4 from '../../../assets/images/backgrounds/splash_image_4.jpg'
import consoleImage from '../../../assets/images/backgrounds/console.jpg'
// Import game assets
import oceanPlanetImg from '../../../assets/images/planets/oceanic.png'
import volcanicPlanetImg from '../../../assets/images/planets/volcanic.png'
import icePlanetImg from '../../../assets/images/planets/ice.png'
import temperatePlanetImg from '../../../assets/images/planets/temperate.png'
import battleCruiserImg from '../../../assets/images/ships/battle_cruiser.png'
import commandMothershipImg from '../../../assets/images/ships/command_mothership.png'

export function LandingPage() {
  const navigate = useNavigate()
  
  // Randomly select background on mount
  const [backgroundUrl] = useState(() => {
    const backgrounds = [splashImage1, splashImage2, splashImage3, splashImage4, consoleImage]
    return backgrounds[Math.floor(Math.random() * backgrounds.length)]
  })

  const features = [
    {
      icon: Rocket,
      title: 'Build Powerful Fleets',
      description: 'Design and command fleets of fighters, cruisers, and motherships. Expand your reach across the galaxy and defend your empire.',
      color: 'cyan',
      image: battleCruiserImg,
      imageAlt: 'Battle Cruiser'
    },
    {
      icon: Globe,
      title: 'Colonize Planets',
      description: 'Explore the universe and colonize planets rich with resources. Manage Tellerium and Krypton production to fuel your expansion.',
      color: 'blue',
      image: oceanPlanetImg,
      imageAlt: 'Oceanic Planet'
    },
    {
      icon: Users,
      title: 'Form Alliances',
      description: 'Join forces with other commanders. Forge diplomatic bonds, share resources, and coordinate attacks on common enemies.',
      color: 'purple',
      image: commandMothershipImg,
      imageAlt: 'Command Mothership'
    },
    {
      icon: Zap,
      title: 'Research Technologies',
      description: 'Unlock advanced facilities and research cutting-edge technologies to gain strategic advantages over your rivals.',
      color: 'yellow',
      image: volcanicPlanetImg,
      imageAlt: 'Volcanic Planet'
    },
    {
      icon: Shield,
      title: 'Build Defenses',
      description: 'Fortify your planets with laser turrets, missile batteries, and orbital fortresses. Protect what you\'ve built.',
      color: 'green',
      image: temperatePlanetImg,
      imageAlt: 'Temperate Planet'
    },
    {
      icon: Search,
      title: 'Intelligence Gathering',
      description: 'Use Tachyon signals to scan enemy positions, gather intelligence, and plan your next move with precision.',
      color: 'orange',
      image: icePlanetImg,
      imageAlt: 'Ice Planet'
    },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fixed background layer */}
      <div
        className="fixed inset-0 -z-10"
        style={{ 
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Enhanced gradient overlays */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Primary cyan gradient */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(25, 234, 253, 0.2) 0%, transparent 70%)',
          }}
        />
        {/* Purple accent gradient */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 80% 80%, rgba(157, 78, 221, 0.15) 0%, transparent 70%)',
          }}
        />
        {/* Dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/80" />
      </div>
      
      {/* Animated stars overlay */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.6 + 0.3,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 1.5}s`,
              boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)',
            }}
          />
        ))}
      </div>

      {/* Floating cyan particles */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-400/10 blur-xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              animation: `float ${Math.random() * 15 + 15}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12 lg:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img 
                src={BRAND.logo} 
                alt="A Game Of Space" 
                className="h-32 lg:h-48 w-auto object-contain filter drop-shadow-[0_0_30px_rgba(25,234,253,0.6)]"
              />
            </div>
            
            {/* Main Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="glow-cyan">Conquer the Galaxy</span>
            </h1>
            
            {/* Tagline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Build your empire. Command fleets. Form alliances. Dominate the universe in this tick-based space strategy MMO.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate('/register')}
                size="lg"
                className={cn(
                  'text-lg px-8 py-6 h-auto',
                  'bg-cyan-600 hover:bg-cyan-700 text-white',
                  'shadow-lg shadow-cyan-500/30',
                  'transition-all duration-300 group',
                  'border border-cyan-400/30 hover:border-cyan-400/50'
                )}
              >
                <Rocket className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Create Your Empire
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                size="lg"
                className={cn(
                  'text-lg px-8 py-6 h-auto',
                  'border-cyan-500/30 hover:border-cyan-500/50',
                  'hover:bg-cyan-500/10 transition-all',
                  'panel-glass'
                )}
              >
                Access Command Center
              </Button>
            </div>

            {/* Manual Link */}
            <div className="pt-4">
              <Button
                onClick={() => navigate('/manual')}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Read Player Manual
              </Button>
            </div>
          </div>
        </div>

        {/* Lore/Prologue Section */}
        <div className="container mx-auto px-4 pt-12 pb-12">
          <div className="max-w-6xl mx-auto">
            <Card className={cn(
              'panel-glass surface-gradient card-glow vignette',
              'border-cyan-500/40 shadow-2xl shadow-cyan-500/20',
              'relative overflow-hidden',
              'backdrop-blur-sm'
            )}>
              <CardHeader className="flex-shrink-0 p-2 border-b border-border/50 bg-muted/20">
                <CardTitle className="text-sm font-semibold">
                  <span className="glow-cyan">The Fractured Stars</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center p-6">
                <p className="text-lg md:text-xl text-muted-foreground italic leading-relaxed">
                  <span className="font-bold text-foreground">The Great Silence came without warning.</span>
                </p>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  For millennia, the Galactic Consortium maintained peace across the known universe. The <span className="text-cyan-400 font-semibold">Tellerium-Krypton Accord</span> bound a thousand worlds together, sharing resources and protecting the weak. But greed knows no bounds, and when the Consortium's central authority collapsed under the weight of corruption and ambition, the accord shattered like glass.
                </p>
                <p className="text-base md:text-lg text-foreground font-medium leading-relaxed pt-2">
                  Now, you are alone in the void.
                </p>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  You are a <span className="text-cyan-400 font-semibold">Commander</span>, awakened from cryogenic stasis to find your homeworld isolated and vulnerable. Across the stars, other Commanders stir from their long sleep. Some seek to rebuild what was lost. Others seek to dominate what remains. A few—the wisest—seek to forge new alliances, knowing that unity is the only path to lasting power.
                </p>
                <p className="text-base md:text-lg text-foreground font-semibold leading-relaxed pt-4 border-t border-border/50">
                  <span className="glow-cyan">This is your moment, Commander.</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              <span className="glow-cyan">Master the Universe</span>
            </h2>
            <p className="text-center text-muted-foreground mb-12 text-lg">
              Strategic depth meets galactic conquest
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                const colorClasses = {
                  cyan: 'border-cyan-500/40 text-cyan-400',
                  blue: 'border-blue-500/40 text-blue-400',
                  purple: 'border-purple-500/40 text-purple-400',
                  yellow: 'border-yellow-500/40 text-yellow-400',
                  green: 'border-green-500/40 text-green-400',
                  orange: 'border-orange-500/40 text-orange-400',
                }
                const colorClass = colorClasses[feature.color as keyof typeof colorClasses] || colorClasses.cyan
                
                return (
                  <Card
                    key={index}
                    className={cn(
                      'panel-glass surface-gradient card-glow vignette',
                      'border-cyan-500/40 shadow-xl shadow-cyan-500/10',
                      'hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300',
                      'relative overflow-hidden group'
                    )}
                  >
                    {/* Background image */}
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none">
                      <img 
                        src={feature.image} 
                        alt={feature.imageAlt}
                        className="w-full h-full object-contain"
                        style={{
                          transform: 'scale(1.2)',
                          filter: 'blur(8px)',
                        }}
                      />
                    </div>
                    
                    {/* Floating image in corner */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-300 pointer-events-none">
                      <img 
                        src={feature.image} 
                        alt={feature.imageAlt}
                        className="w-full h-full object-contain animate-float-image"
                        style={{
                          filter: `drop-shadow(0 0 20px ${feature.color === 'cyan' ? 'rgba(25, 234, 253, 0.5)' : feature.color === 'blue' ? 'rgba(74, 158, 255, 0.5)' : feature.color === 'purple' ? 'rgba(157, 78, 221, 0.5)' : feature.color === 'yellow' ? 'rgba(234, 179, 8, 0.5)' : feature.color === 'green' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(249, 115, 22, 0.5)'})`,
                        }}
                      />
                    </div>
                    
                    <CardHeader className="relative z-10 flex-shrink-0 p-2 border-b border-border/50 bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-6 h-6 rounded flex items-center justify-center', colorClass, 'bg-background/40 group-hover:bg-background/60 transition-colors')}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <CardTitle className={cn('text-sm font-semibold', feature.color === 'cyan' ? 'glow-cyan' : '')}>
                          {feature.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 p-6">
                      <CardDescription className="text-base leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        {/* Gameplay Highlights */}
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className={cn(
                'panel-glass surface-gradient card-glow vignette',
                'border-cyan-500/40 shadow-xl shadow-cyan-500/10',
                'relative overflow-hidden'
              )}>
                <CardHeader className="flex-shrink-0 p-2 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <CardTitle className="text-sm font-semibold glow-cyan">
                      Tick-Based Strategy
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">
                    Every 30 minutes, the universe ticks forward. Resources are produced, fleets move, and battles are resolved. Plan your strategy carefully—every decision counts.
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Zap className="w-4 h-4 mr-2 text-cyan-400" />
                    <span>Real-time updates via WebSocket</span>
                  </div>
                </CardContent>
              </Card>

              <Card className={cn(
                'panel-glass surface-gradient card-glow vignette',
                'border-blue-500/40 shadow-xl shadow-blue-500/10',
                'relative overflow-hidden'
              )}>
                <CardHeader className="flex-shrink-0 p-2 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-blue-400" />
                    <CardTitle className="text-sm font-semibold">
                      Competitive Rankings
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">
                    Climb the leaderboards by building a powerful empire. Compete for the top spot in galaxy, alliance, and global rankings.
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Swords className="w-4 h-4 mr-2 text-blue-400" />
                    <span>Global leaderboards</span>
                  </div>
                </CardContent>
              </Card>

              <Card className={cn(
                'panel-glass surface-gradient card-glow vignette',
                'border-purple-500/40 shadow-xl shadow-purple-500/10',
                'relative overflow-hidden'
              )}>
                <CardHeader className="flex-shrink-0 p-2 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" />
                    <CardTitle className="text-sm font-semibold">
                      Endless Exploration
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">
                    Navigate a vast universe with four quadrants, countless sectors, galaxies, and planets. Each world offers unique opportunities and challenges.
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Globe className="w-4 h-4 mr-2 text-purple-400" />
                    <span>Procedurally generated universe</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-6xl mx-auto text-center">
            <Card className={cn(
              'panel-glass surface-gradient card-glow vignette',
              'border-cyan-500/40 shadow-2xl shadow-cyan-500/20',
              'relative overflow-hidden'
            )}>
              <CardHeader className="flex-shrink-0 p-2 border-b border-border/50 bg-muted/20">
                <CardTitle className="text-sm font-semibold">
                  <span className="glow-cyan">Begin Your Journey</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <p className="text-lg text-muted-foreground mb-6">
                  Join thousands of commanders in the ultimate space strategy experience
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => navigate('/register')}
                    size="lg"
                    className={cn(
                      'text-lg px-8 py-6 h-auto',
                      'bg-cyan-600 hover:bg-cyan-700 text-white',
                      'shadow-lg shadow-cyan-500/30',
                      'transition-all duration-300 group',
                      'border border-cyan-400/30 hover:border-cyan-400/50'
                    )}
                  >
                    <Rocket className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    Create Empire
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/login')}
                    variant="outline"
                    size="lg"
                    className={cn(
                      'text-lg px-8 py-6 h-auto',
                      'border-cyan-500/30 hover:border-cyan-500/50',
                      'hover:bg-cyan-500/10 transition-all',
                      'panel-glass'
                    )}
                  >
                    Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Copyright Footer */}
        <div className="container mx-auto px-4 py-8">
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
            opacity: 0.15;
          }
          33% {
            transform: translate(40px, -40px) scale(1.15);
            opacity: 0.25;
          }
          66% {
            transform: translate(-30px, 30px) scale(0.85);
            opacity: 0.2;
          }
        }
        
        @keyframes float-image {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          50% {
            transform: translate(10px, -10px) rotate(5deg);
          }
        }
        
        .animate-float-image {
          animation: float-image 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

