import { FormEvent, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { AlertCircle, MessageCircle, Send, LifeBuoy, BookOpen, Shield, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetAnnouncementsQuery } from '@/api/endpoints/announcementsApi'
import supportHero from '../../../../assets/images/landing/futuristic-scifi-communication-station-distant-alien-world-with-sleek-domed-architecture-holographic-technology.jpg'
import consoleImage from '../../../../assets/images/backgrounds/console.jpg'

type SupportFormState = {
  commander: string
  email: string
  topic: string
  message: string
}

const newSupportFormState = (): SupportFormState => ({
  commander: '',
  email: '',
  topic: '',
  message: '',
})

export function SupportPage() {
  const [formState, setFormState] = useState<SupportFormState>(newSupportFormState)
  const [errors, setErrors] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const {
    data: announcements = [],
    isLoading: isLoadingAnnouncements,
    isError: isAnnouncementsError,
  } = useGetAnnouncementsQuery()

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(formState.topic ? `[Astralus Support] ${formState.topic}` : 'Astralus Support Request')
    const body = encodeURIComponent(
      [
        `Commander: ${formState.commander || 'Unknown'}`,
        `Email: ${formState.email || 'Not provided'}`,
        '',
        formState.message || 'Describe your issue here.',
        '',
        '-- Sent via astralus.online support portal',
      ].join('\n')
    )
    return `mailto:support@astralus.online?subject=${subject}&body=${body}`
  }, [formState])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrors(null)
    setSubmitted(false)

    if (!formState.commander.trim() || !formState.email.trim() || !formState.message.trim()) {
      setErrors('Commander name, contact email, and a short message are required.')
      return
    }

    if (!/.+@.+\..+/.test(formState.email.trim())) {
      setErrors('Please provide a valid email so we can reach you.')
      return
    }

    setSubmitted(true)
    window.location.href = mailtoHref
  }

  const announcementsToDisplay = useMemo(() => {
    if (!announcements || announcements.length === 0) {
      return []
    }

    const sorted = [...announcements].sort((a, b) => {
      const aPinned = a?.is_pinned ? 1 : 0
      const bPinned = b?.is_pinned ? 1 : 0
      if (aPinned !== bPinned) {
        return bPinned - aPinned
      }

      const priorityRank = (priority?: string | null) => {
        if (!priority) return 0
        const value = priority.toLowerCase()
        if (value === 'critical') return 3
        if (value === 'warning') return 2
        if (value === 'info') return 1
        return 0
      }

      const priorityDiff = priorityRank(b?.priority) - priorityRank(a?.priority)
      if (priorityDiff !== 0) {
        return priorityDiff
      }

      const dateA = a?.published_at ? new Date(a.published_at).getTime() : 0
      const dateB = b?.published_at ? new Date(b.published_at).getTime() : 0
      return dateB - dateA
    })

    return sorted.slice(0, 4)
  }, [announcements])

  const renderAnnouncementSummary = (announcement: typeof announcements[number]) => {
    const summarySource =
      announcement.summary ??
      announcement.body ??
      announcement.content ??
      announcement.metadata?.summary ??
      announcement.metadata?.body ??
      ''

    if (!summarySource) {
      return 'Read the full briefing for details.'
    }

    const normalized = summarySource.replace(/\s+/g, ' ').trim()

    if (normalized.length <= 160) {
      return normalized
    }

    return `${normalized.slice(0, 160)}…`
  }

  const renderPublishedAt = (publishedAt?: string) => {
    if (!publishedAt) return null
    const date = new Date(publishedAt)
    if (Number.isNaN(date.getTime())) return null
    return `Published ${formatDistanceToNow(date, { addSuffix: true })}`
  }

  const priorityBadgeClass = (priority?: string | null) => {
    if (!priority) return 'bg-white/10 text-white/70 border-white/10'
    const value = priority.toLowerCase()
    if (value === 'critical') return 'bg-red-500/20 text-red-200 border-red-500/40'
    if (value === 'warning') return 'bg-amber-500/20 text-amber-200 border-amber-500/40'
    if (value === 'info') return 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40'
    return 'bg-white/10 text-white/70 border-white/10'
  }

  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${supportHero})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/75 via-black/70 to-black" aria-hidden="true" />
        <div className="container mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">Support</p>
            <h1 className="mt-6 text-4xl md:text-5xl font-bold text-white tracking-tight">
              We have your back between ticks.
            </h1>
            <p className="mt-6 text-lg text-white/75 leading-relaxed">
              Whether you need technical assistance, want to report an exploit, or just have a lore question, our support team and
              community commanders are on standby. Choose the quickest channel for your situation below.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-lg">
                <div className="flex items-center gap-3 text-white">
                  <MessageCircle className="h-6 w-6 text-cyan-300" />
                  <h2 className="text-xl font-semibold">Discord</h2>
                </div>
                <p className="mt-4 text-sm text-white/70">
                  Live help, patch updates, and alliance recruitment. Ideal for urgent coordination or community requests.
                </p>
                <Button
                  className="mt-6 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold w-full"
                  onClick={() => window.open('https://discord.gg/astralus', '_blank', 'noopener')}
                >
                  Join the Discord
                </Button>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-lg">
                <div className="flex items-center gap-3 text-white">
                  <Shield className="h-6 w-6 text-purple-300" />
                  <h2 className="text-xl font-semibold">Support Ticket</h2>
                </div>
                <p className="mt-4 text-sm text-white/70">
                  Use the secure email form for account issues, purchase questions, or sensitive exploit reports.
                </p>
                <Button
                  variant="outline"
                  className="mt-6 border-white/30 text-white hover:bg-white/10 w-full"
                  onClick={() => {
                    const formSection = document.getElementById('support-form')
                    formSection?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 pt-16">
        <div className="rounded-3xl border border-white/10 bg-black/65 p-8 lg:p-10 backdrop-blur-xl text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Operational Briefings</p>
              <h2 className="mt-3 text-2xl md:text-3xl font-semibold">Important game announcements</h2>
              <p className="mt-3 text-sm text-white/70 leading-relaxed max-w-2xl">
                Stay ahead of maintenance windows, balance updates, and emergent incidents. We flag pinned or critical briefings so
                your alliance can mobilise without delay.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-200">
              <Radio className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {isLoadingAnnouncements ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`announcement-skeleton-${index}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-lg"
                >
                  <Skeleton className="h-5 w-2/3 bg-white/10" />
                  <Skeleton className="mt-3 h-4 w-full bg-white/10" />
                  <Skeleton className="mt-2 h-4 w-3/4 bg-white/10" />
                </div>
              ))
            ) : isAnnouncementsError ? (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                <AlertCircle className="h-5 w-5" />
                Unable to load announcements right now. Check #operations-log on Discord for live updates.
              </div>
            ) : announcementsToDisplay.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/70 backdrop-blur-lg">
                No announcements to relay at the moment. We&rsquo;ll post here the moment a new briefing goes live.
              </div>
            ) : (
              announcementsToDisplay.map((announcement) => {
                const publishedLabel = renderPublishedAt(announcement.published_at)
                return (
                  <div
                    key={announcement.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 backdrop-blur-lg transition hover:border-cyan-400/40 hover:bg-white/10"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em]">
                        {announcement.priority ? (
                          <span className={`rounded-full border px-3 py-1 ${priorityBadgeClass(announcement.priority)}`}>
                            {announcement.priority}
                          </span>
                        ) : null}
                        {announcement.is_pinned ? (
                          <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 text-cyan-200">Pinned</span>
                        ) : null}
                        {publishedLabel ? <span className="text-white/60">{publishedLabel}</span> : null}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-white/70">{renderAnnouncementSummary(announcement)}</p>
                    {announcement.link_url ? (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/10"
                          onClick={() => window.open(announcement.link_url!, '_blank', 'noopener')}
                        >
                          View briefing
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-24" id="support-form">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="rounded-3xl border border-white/10 bg-black/60 p-10 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-white">
              <LifeBuoy className="h-6 w-6 text-cyan-300" />
              <h2 className="text-2xl font-semibold">Send a support request</h2>
            </div>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              Fill in the details and we&rsquo;ll generate an email that pre-populates everything for{' '}
              <span className="text-white font-semibold">support@astralus.online</span>. Your default mail client will open so you
              can review and attach logs if needed.
            </p>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="commander" className="text-white/80">
                  Commander Name
                </Label>
                <Input
                  id="commander"
                  placeholder="Commander Nova"
                  value={formState.commander}
                  onChange={(event) => setFormState((prev) => ({ ...prev, commander: event.target.value }))}
                  className="bg-black/40 border-white/20 text-white"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white/80">
                  Contact Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formState.email}
                  onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                  className="bg-black/40 border-white/20 text-white"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="topic" className="text-white/80">
                  Topic (optional)
                </Label>
                <Input
                  id="topic"
                  placeholder="Account recovery, exploit report, billing question..."
                  value={formState.topic}
                  onChange={(event) => setFormState((prev) => ({ ...prev, topic: event.target.value }))}
                  className="bg-black/40 border-white/20 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message" className="text-white/80">
                  Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="Share the situation, steps to reproduce, affected planets, screenshots, or links to video."
                  rows={6}
                  value={formState.message}
                  onChange={(event) => setFormState((prev) => ({ ...prev, message: event.target.value }))}
                  className="bg-black/40 border-white/20 text-white resize-none"
                  required
                />
              </div>

              {errors ? (
                <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <AlertCircle className="h-5 w-5" />
                  {errors}
                </div>
              ) : null}
              {submitted ? (
                <div className="flex items-center gap-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
                  <Send className="h-5 w-5" />
                  Opening your email client - attach screenshots or logs before sending.
                </div>
              ) : null}

              <Button type="submit" size="lg" className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
                Prepare Email
              </Button>
            </form>
            <p className="mt-6 text-xs text-white/50">
              Prefer manual email? Send details directly to <span className="text-white font-semibold">support@astralus.online</span>{' '}
              and include your empire name plus any diagnostic logs from the browser console.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/60 p-10 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-white">
              <BookOpen className="h-6 w-6 text-cyan-300" />
              <h2 className="text-2xl font-semibold">Self-service resources</h2>
            </div>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              Many issues can be resolved quickly by reviewing our manuals and field guides. These are updated alongside each
              seasonal patch.
            </p>
            <ul className="mt-6 space-y-4 text-sm text-white/70">
              <li className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                <span className="font-semibold text-white">Player Manual</span> - mechanics, strategy, and first-hour checklists.
                Accessible publicly via the portal.
              </li>
              <li className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                <span className="font-semibold text-white">UI Field Guide</span> - panel-by-panel breakdown of the command shell,
                holopad, and fleet interfaces. Available in-game once logged in.
              </li>
              <li className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                <span className="font-semibold text-white">Incident Reports</span> - track known issues via #operations-log on
                Discord for real-time status.
              </li>
            </ul>
            <Button
              variant="outline"
              className="mt-8 border-white/40 text-white hover:bg-white/10 w-full"
              onClick={() => window.location.assign('/manual')}
            >
              View Player Manual
            </Button>
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6">
              <div className="text-sm text-white/60 leading-relaxed">
                <strong className="text-white">Maintenance windows:</strong> regular patches deploy Wednesdays 20:00 UTC. Expect 15
                minute downtime and follow the incident feed for updates.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden pb-24">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${consoleImage})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/90 via-black/80 to-black" aria-hidden="true" />
        <div className="container mx-auto px-6">
          <div className="rounded-3xl border border-white/10 bg-black/70 p-10 text-center backdrop-blur-xl">
            <h2 className="text-3xl md:text-4xl font-semibold text-white">Need priority escalation?</h2>
            <p className="mt-4 text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
              If an exploit or outage threatens the cluster, ping <span className="text-white font-semibold">@Operations</span> on
              Discord with your incident summary after emailing logs. We respond within one tick for critical events.
            </p>
            <Button
              className="mt-8 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              onClick={() => window.open('https://discord.gg/astralus', '_blank', 'noopener')}
            >
              Reach Operations
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
