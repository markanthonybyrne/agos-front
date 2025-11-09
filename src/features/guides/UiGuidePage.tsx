import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import uiGuideContent from '../../../docs/ASTRALUS_UI_GUIDE.md?raw'

export function UiGuidePage() {
  const renderedContent = useMemo(() => renderMarkdown(uiGuideContent), [])

  return (
    <div className="flex h-full flex-col bg-[radial-gradient(circle_at_top,rgba(10,20,40,0.65),rgba(4,8,16,0.95))] text-foreground">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">Astralus</p>
            <h1 className="text-3xl font-semibold text-white">UI Field Guide</h1>
            <p className="text-sm text-white/60">
              Comprehensive reference for every interface surface across the Astralus command shell.
            </p>
          </div>
          <Button
            variant="outline"
            asChild
            className="border-cyan-500/40 text-cyan-100 hover:bg-cyan-500/10"
          >
            <Link to="/map">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Galaxy
            </Link>
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="panel-glass surface-gradient border border-cyan-500/30 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="space-y-6 text-sm leading-relaxed text-white/85">
              {renderedContent}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

function renderMarkdown(content: string): JSX.Element[] {
  const lines = content.split('\n')
  const elements: JSX.Element[] = []
  let inList = false
  let listItems: { level: number; text: string }[] = []
  let currentTable: string[][] | null = null

  const flushList = () => {
    if (listItems.length === 0) return

    elements.push(
      <ul key={`list-${elements.length}`} className="list-disc space-y-2 text-base text-white/80">
        {listItems.map((item, idx) => (
          <li
            key={idx}
            style={{ marginLeft: item.level > 0 ? item.level * 20 : 0 }}
            className={cn(item.level > 0 && 'list-[circle]')}
          >
            {renderInlineMarkdown(item.text)}
          </li>
        ))}
      </ul>,
    )

    listItems = []
    inList = false
  }

  const flushTable = () => {
    if (!currentTable || currentTable.length === 0) return

    const rows = [...currentTable]
    const header = rows.shift() ?? []
    if (rows[0] && rows[0].every((cell) => /^-+$/.test(cell.trim()))) {
      rows.shift()
    }

    elements.push(
      <div key={`table-${elements.length}`} className="overflow-x-auto rounded-xl border border-cyan-500/30 bg-white/5 p-4">
        <table className="w-full border-collapse text-left text-sm text-white/85">
          <thead>
            <tr>
              {header.map((cell, idx) => (
                <th key={idx} className="border-b border-white/10 px-3 py-2 font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                  {renderInlineMarkdown(cell.trim())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-white/5 last:border-0">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-3 py-2 align-top text-white/70">
                    {renderInlineMarkdown(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    )

    currentTable = null
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    if (trimmed.startsWith('|')) {
      if (inList) {
        flushList()
      }
      currentTable = currentTable ?? []
      const cells = trimmed
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim())
      currentTable.push(cells)
      return
    } else if (currentTable) {
      flushTable()
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      if (inList) flushList()
      const level = headingMatch[1].length
      const title = headingMatch[2].trim()
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      const headingIndex = Math.max(1, Math.min(level, 4)) - 1
      const headingTag = (['h1', 'h2', 'h3', 'h4'][headingIndex] ?? 'h4') as
        | 'h1'
        | 'h2'
        | 'h3'
        | 'h4'
      const HeadingComponent = headingTag
      elements.push(
        <HeadingComponent
          key={`heading-${index}`}
          id={id}
          className={cn(
            'font-heading uppercase tracking-[0.35em] text-cyan-200',
            level === 1 && 'mt-2 text-2xl text-white',
            level === 2 && 'mt-10 text-xl',
            level === 3 && 'mt-8 text-base text-cyan-200/80',
            level === 4 && 'mt-6 text-sm text-cyan-200/70',
          )}
        >
          {title}
        </HeadingComponent>,
      )
      return
    }

    if (trimmed === '---') {
      if (inList) flushList()
      elements.push(<hr key={`hr-${index}`} className="my-8 border-white/10" />)
      return
    }

    const listMatch = trimmed.match(/^(\s*)[-*]\s+(.+)$/)
    if (listMatch) {
      if (currentTable) flushTable()
      const indentation = listMatch[1].length
      const level = Math.floor(indentation / 2)
      if (!inList) {
        inList = true
      }
      listItems.push({ level, text: listMatch[2].trim() })
      return
    }

    if (trimmed.length === 0) {
      if (inList) {
        flushList()
      } else {
        elements.push(<br key={`br-${index}`} />)
      }
      return
    }

    if (inList) flushList()
    elements.push(
      <p key={`para-${index}`} className="text-base text-white/80">
        {renderInlineMarkdown(trimmed)}
      </p>,
    )
  })

  if (inList) flushList()
  if (currentTable) flushTable()

  return elements
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let cursor = 0
  const regexes: Array<{ regex: RegExp; type: 'bold' | 'code' | 'link' }> = [
    { regex: /\*\*(.+?)\*\*/g, type: 'bold' },
    { regex: /`([^`]+)`/g, type: 'code' },
    { regex: /\[([^\]]+)]\(([^)]+)\)/g, type: 'link' },
  ]

  const matches: Array<{ start: number; end: number; content: string; type: 'bold' | 'code' | 'link'; href?: string }> = []

  regexes.forEach(({ regex, type }) => {
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        type,
        href: type === 'link' ? match[2] : undefined,
      })
    }
  })

  matches.sort((a, b) => a.start - b.start)

  matches.forEach((match, index) => {
    if (match.start > cursor) {
      parts.push(text.slice(cursor, match.start))
    }

    if (match.type === 'bold') {
      parts.push(
        <strong key={`bold-${index}`} className="text-cyan-100">
          {match.content}
        </strong>,
      )
    } else if (match.type === 'code') {
      parts.push(
        <code
          key={`code-${index}`}
          className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-cyan-100"
        >
          {match.content}
        </code>,
      )
    } else if (match.type === 'link' && match.href) {
      parts.push(
        <a
          key={`link-${index}`}
          href={match.href}
          target="_blank"
          rel="noreferrer"
          className="text-cyan-300 underline hover:text-cyan-200"
        >
          {match.content}
        </a>,
      )
    }

    cursor = match.end
  })

  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }

  return parts.length > 0 ? parts : text
}

