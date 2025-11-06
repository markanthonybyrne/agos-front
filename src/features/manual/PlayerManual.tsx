import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft, BookOpen, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import manualContent from '../../../docs/PLAYER_MANUAL.md?raw'

interface Section {
  id: string
  title: string
  level: number
}

export function PlayerManual() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<string>('')
  const [sections, setSections] = useState<Section[]>([])
  const [isTocOpen, setIsTocOpen] = useState(false)

  useEffect(() => {
    // Parse markdown to extract sections
    const lines = manualContent.split('\n')
    const parsedSections: Section[] = []
    
    lines.forEach((line, index) => {
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const title = headingMatch[2].trim()
        const id = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
        parsedSections.push({ id, title, level })
      }
    })
    
    setSections(parsedSections)
    if (parsedSections.length > 0) {
      setActiveSection(parsedSections[0].id)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('h1[id], h2[id], h3[id]')
      let current = ''
      
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect()
        if (rect.top <= 100) {
          current = heading.id
        }
      })
      
      if (current) {
        setActiveSection(current)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
      setIsTocOpen(false)
    }
  }

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n')
    const elements: JSX.Element[] = []
    let inList = false
    let listItems: string[] = []
    let listLevel = 0

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className={cn(
            'list-disc list-inside mb-4 space-y-2',
            listLevel === 2 && 'ml-6'
          )}>
            {listItems.map((item, idx) => (
              <li key={idx} className="text-foreground/90 leading-relaxed">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        )
        listItems = []
        inList = false
        listLevel = 0
      }
    }

    lines.forEach((line, index) => {
      // Headings
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
      if (headingMatch) {
        flushList()
        const level = headingMatch[1].length
        const title = headingMatch[2].trim()
        const id = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
        
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
        const headingProps: any = {
          key: `heading-${index}`,
          id: id,
          className: cn(
            'font-heading font-bold mb-4 mt-8 scroll-mt-20',
            level === 1 && 'text-4xl glow-cyan border-b border-primary/30 pb-3',
            level === 2 && 'text-3xl text-primary mt-12',
            level === 3 && 'text-2xl text-primary/90 mt-8'
          )
        }
        elements.push(
          <HeadingTag {...headingProps}>
            {title}
          </HeadingTag>
        )
        return
      }

      // Horizontal rules
      if (line.trim() === '---') {
        flushList()
        elements.push(
          <hr key={`hr-${index}`} className="my-8 border-border/50" />
        )
        return
      }

      // Lists
      const listMatch = line.match(/^(\s*)[-*]\s+(.+)$/)
      if (listMatch) {
        const level = Math.floor(listMatch[1].length / 2)
        const item = listMatch[2].trim()
        
        if (!inList || level !== listLevel) {
          flushList()
          inList = true
          listLevel = level
        }
        listItems.push(item)
        return
      }

      // Paragraphs
      if (line.trim()) {
        flushList()
        elements.push(
          <p key={`para-${index}`} className="mb-4 text-foreground/90 leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        )
      } else if (!inList) {
        elements.push(<br key={`br-${index}`} />)
      }
    })

    flushList()
    return elements
  }

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    let currentIndex = 0

    // Collect all matches (bold and inline code)
    const matches: Array<{ start: number; end: number; content: string; type: 'bold' | 'code' }> = []

    // Bold text
    const boldRegex = /\*\*(.+?)\*\*/g
    let match
    while ((match = boldRegex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        type: 'bold',
      })
    }

    // Inline code
    const codeRegex = /`([^`]+)`/g
    while ((match = codeRegex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        type: 'code',
      })
    }

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start)

    matches.forEach((matchItem, idx) => {
      if (matchItem.start > currentIndex) {
        parts.push(text.slice(currentIndex, matchItem.start))
      }
      
      if (matchItem.type === 'bold') {
        parts.push(
          <strong key={`bold-${idx}`} className="text-primary font-semibold">
            {matchItem.content}
          </strong>
        )
      } else if (matchItem.type === 'code') {
        parts.push(
          <code
            key={`code-${idx}`}
            className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary"
          >
            {matchItem.content}
          </code>
        )
      }
      
      currentIndex = matchItem.end
    })

    if (currentIndex < text.length) {
      parts.push(text.slice(currentIndex))
    }

    return parts.length > 0 ? parts : text
  }

  const backgroundUrl = new URL('../../../assets/images/background.jpg', import.meta.url).href

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div className="bg-black/60 backdrop-blur-sm min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/login')}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-heading glow-cyan">Player Manual</h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTocOpen(!isTocOpen)}
              className="lg:hidden"
            >
              <Menu className="h-4 w-4 mr-2" />
              Table of Contents
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Table of Contents - Desktop */}
            <aside className="hidden lg:block w-64 shrink-0">
              <Card className="sticky top-24 max-h-[calc(100vh-8rem)]">
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold mb-4 text-primary">Contents</h2>
                  <ScrollArea className="h-[calc(100vh-12rem)]">
                    <nav className="space-y-1">
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded text-sm transition-colors',
                            'hover:bg-accent hover:text-accent-foreground',
                            activeSection === section.id
                              ? 'bg-primary/20 text-primary font-semibold'
                              : 'text-muted-foreground',
                            section.level === 1 && 'font-semibold text-base',
                            section.level === 2 && 'ml-2',
                            section.level === 3 && 'ml-4 text-xs'
                          )}
                        >
                          {section.title}
                        </button>
                      ))}
                    </nav>
                  </ScrollArea>
                </CardContent>
              </Card>
            </aside>

            {/* Table of Contents - Mobile */}
            {isTocOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-black/50" onClick={() => setIsTocOpen(false)} />
                <Card className="absolute top-16 left-0 right-0 m-4 max-h-[calc(100vh-8rem)]">
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold mb-4 text-primary">Contents</h2>
                    <ScrollArea className="h-[calc(100vh-12rem)]">
                      <nav className="space-y-1">
                        {sections.map((section) => (
                          <button
                            key={section.id}
                            onClick={() => scrollToSection(section.id)}
                            className={cn(
                              'w-full text-left px-3 py-2 rounded text-sm transition-colors',
                              'hover:bg-accent hover:text-accent-foreground',
                              activeSection === section.id
                                ? 'bg-primary/20 text-primary font-semibold'
                                : 'text-muted-foreground',
                              section.level === 1 && 'font-semibold text-base',
                              section.level === 2 && 'ml-2',
                              section.level === 3 && 'ml-4 text-xs'
                            )}
                          >
                            {section.title}
                          </button>
                        ))}
                      </nav>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Content */}
            <main className="flex-1 max-w-4xl">
              <Card className="panel-glass">
                <CardContent className="p-8 prose prose-invert max-w-none">
                  <div className="space-y-4">
                    {renderMarkdown(manualContent)}
                  </div>
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

