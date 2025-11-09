import { useEffect, useMemo, useState } from 'react'
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

type PlayerManualVariant = 'standalone' | 'landing'

interface PlayerManualProps {
  variant?: PlayerManualVariant
}

export function PlayerManual({ variant = 'standalone' }: PlayerManualProps) {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<string>('')
  const [sections, setSections] = useState<Section[]>([])
  const [isTocOpen, setIsTocOpen] = useState(false)
  const isLandingVariant = variant === 'landing'

  useEffect(() => {
    // Parse markdown to extract sections
    const lines = manualContent.split('\n')
    const parsedSections: Section[] = []
    const slugCounts = new Map<string, number>()

    lines.forEach((line) => {
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const title = headingMatch[2].trim()
        const baseSlug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'section'
        const count = slugCounts.get(baseSlug) ?? 0
        slugCounts.set(baseSlug, count + 1)
        const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`
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
    const introElements: React.ReactNode[] = []
    const sectionsElements: React.ReactNode[] = []
    let currentSectionContent: React.ReactNode[] = []
    let sectionKey = 0
    let inSection = false
    let inList = false
    let listItems: string[] = []
    let listLevel = 0
    let listKey = 0
    let tableKey = 0
    const slugCounts = new Map<string, number>()

    const getUniqueSlug = (title: string) => {
      const base = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'section'
      const count = slugCounts.get(base) ?? 0
      slugCounts.set(base, count + 1)
      return count === 0 ? base : `${base}-${count + 1}`
    }

    const pushElement = (element: React.ReactNode) => {
      if (inSection) {
        currentSectionContent.push(element)
      } else {
        introElements.push(element)
      }
    }

    const flushList = () => {
      if (listItems.length > 0) {
        const listElement = (
          <ul
            key={`list-${listKey++}`}
            className={cn(
              'list-disc list-inside mb-4 space-y-2 text-white/75',
              listLevel === 2 && 'ml-6'
            )}
          >
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        )
        if (inSection) {
          currentSectionContent.push(listElement)
        } else {
          introElements.push(listElement)
        }
        listItems = []
        inList = false
        listLevel = 0
      }
    }

    const flushSection = () => {
      if (currentSectionContent.length > 0) {
        sectionsElements.push(
          <section
            key={`section-${sectionKey++}`}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-black/70 to-black/40 p-8 lg:p-10 backdrop-blur-xl shadow-[0_24px_80px_rgba(15,118,230,0.25)] space-y-4"
          >
            {currentSectionContent}
          </section>
        )
        currentSectionContent = []
      }
    }

    const parseTableRow = (row: string) =>
      row
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim())

    const isDividerRow = (row: string) => {
      const trimmed = row.trim()
      if (!trimmed.startsWith('|')) return false
      return trimmed
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const next = lines[i + 1]?.trim() ?? ''
        if (next && isDividerRow(next)) {
          flushList()
          const headers = parseTableRow(trimmed)
          i += 1
          const rows: string[][] = []
          let rowIndex = i + 1
          while (rowIndex < lines.length) {
            const potentialRow = lines[rowIndex].trim()
            if (!(potentialRow.startsWith('|') && potentialRow.endsWith('|'))) {
              break
            }
            rows.push(parseTableRow(potentialRow))
            rowIndex += 1
          }
          i = rowIndex - 1

          const tableElement = (
            <div
              key={`table-${tableKey++}`}
              className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5"
            >
              <table className="w-full border-collapse text-left text-sm text-white/80">
                <thead className="bg-white/10 text-white">
                  <tr>
                    {headers.map((header, idx) => (
                      <th key={idx} className="px-4 py-3 font-semibold uppercase tracking-[0.2em] text-xs text-white/80">
                        {renderInlineMarkdown(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white/5' : undefined}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-3 align-top text-white/75">
                          {renderInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )

          pushElement(tableElement)
          continue
        }
      }

      const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/)
      if (headingMatch) {
        flushList()
        const level = headingMatch[1].length
        const title = headingMatch[2].trim()
        const uniqueSlug = getUniqueSlug(title)

        if (level === 2) {
          flushSection()
          inSection = true
        }

        const HeadingTag = `h${Math.min(level, 3)}` as 'h1' | 'h2' | 'h3'
        const headingElement = (
          <HeadingTag
            key={`heading-${i}`}
            id={uniqueSlug}
            className={cn(
              'font-heading scroll-mt-28 transition-colors',
              level === 1 && 'text-4xl md:text-5xl font-bold tracking-tight text-white mt-16 mb-6 border-b border-white/10 pb-4',
              level === 2 && 'text-3xl md:text-4xl font-semibold text-cyan-200 mt-12 mb-4',
              level === 3 && 'text-2xl text-white/90 mt-6 mb-3'
            )}
          >
            {title}
          </HeadingTag>
        )

        pushElement(headingElement)
        continue
      }

      if (trimmed === '---') {
        flushList()
        pushElement(<hr key={`hr-${i}`} className="my-10 border-white/10" />)
        continue
      }

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
        continue
      }

      if (trimmed) {
        flushList()
        const paragraph = (
          <p key={`para-${i}`} className="mb-5 text-white/75 leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        )
        pushElement(paragraph)
      } else if (!inList) {
        pushElement(<div key={`spacer-${i}`} className="h-2" />)
      }
    }

    flushList()
    flushSection()

    const introBlock = introElements.length > 0 && (
      <section
        key="intro"
        className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/15 via-black/70 to-black/50 p-8 lg:p-10 backdrop-blur-xl shadow-[0_24px_80px_rgba(12,74,110,0.35)] space-y-4"
      >
        {introElements}
      </section>
    )

    return (
      <>
        {introBlock}
        {sectionsElements}
      </>
    )
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
        parts.push(<strong key={`bold-${idx}`} className="text-cyan-200 font-semibold">{matchItem.content}</strong>)
      } else if (matchItem.type === 'code') {
        parts.push(
          <code
            key={`code-${idx}`}
            className="rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-sm font-mono text-cyan-100"
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

  const backgroundUrl = useMemo(() => {
    if (isLandingVariant) {
      return null
    }
    return new URL('../../../assets/images/background.jpg', import.meta.url).href
  }, [isLandingVariant])

  const tocToggleButton = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsTocOpen(!isTocOpen)}
      className="lg:hidden"
    >
      <Menu className="h-4 w-4 mr-2" />
      Table of Contents
    </Button>
  )

  const desktopToc = (
    <aside className="hidden lg:block w-64 shrink-0">
      <Card className="sticky top-24 max-h-[calc(100vh-8rem)] rounded-3xl border border-white/10 bg-black/70 backdrop-blur-xl">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-cyan-200">Contents</h2>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded text-sm transition-colors',
                    'hover:bg-white/10 hover:text-white',
                    activeSection === section.id
                      ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                      : 'text-white/60',
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
  )

  const mobileTocOverlay = isTocOpen && (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsTocOpen(false)} />
      <Card className="absolute top-16 left-0 right-0 mx-4 max-h-[calc(100vh-8rem)] rounded-3xl border border-white/10 bg-black/80">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-cyan-200">Contents</h2>
            <Button size="sm" variant="ghost" onClick={() => setIsTocOpen(false)}>
              Close
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded text-sm transition-colors',
                    'hover:bg-white/10 hover:text-white',
                    activeSection === section.id
                      ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                      : 'text-white/60',
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
  )

  const renderedManual = renderMarkdown(manualContent)

  const manualMainContent = isLandingVariant ? (
    <div className="space-y-10">{renderedManual}</div>
  ) : (
    <Card className="rounded-3xl border border-white/10 bg-black/70 backdrop-blur-2xl shadow-[0_30px_120px_rgba(15,118,230,0.25)]">
      <CardContent className="p-8 lg:p-10">
        <div className="space-y-10">{renderedManual}</div>
      </CardContent>
    </Card>
  )

  const manualBody = (
    <div className="flex flex-col lg:flex-row gap-8">
      {desktopToc}
      <main className="flex-1 max-w-4xl">
        {manualMainContent}
      </main>
    </div>
  )

  if (isLandingVariant) {
    return (
      <div className="pb-24">
        <section className="container mx-auto px-6 pt-24 lg:pt-32">
          <div className="max-w-4xl text-white">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">Manual</p>
            <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-tight">
              Player Manual — Command the fractured stars.
            </h1>
            <p className="mt-6 text-white/70 leading-relaxed">
              Review the latest Operational Briefings, follow the onboarding sequences, and explore every subsystem from production to
              alliances. This manual mirrors the landing portal&rsquo;s new aesthetic so you can stay oriented between the holopad and the public hub.
            </p>
            <div className="mt-6 lg:hidden">
              {tocToggleButton}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 mt-16">
          {manualBody}
        </section>

        {mobileTocOverlay}
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined}
    >
      <div className="bg-black/60 backdrop-blur-sm min-h-screen">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-md">
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
                <BookOpen className="h-5 w-5 text-cyan-200" />
                <h1 className="text-xl font-heading text-white">Player Manual</h1>
              </div>
            </div>
            {tocToggleButton}
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {manualBody}
        </div>
      </div>
      {mobileTocOverlay}
    </div>
  )
}
