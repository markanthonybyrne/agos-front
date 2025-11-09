import { Button } from '@/components/ui/button'

const termsSections = [
  {
    id: 'overview',
    title: '1. Overview',
    content: (
      <>
        <p>
          Astralus is an online, persistent, tick-based strategy experience operated by iammarkyb studios (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;, or &ldquo;our&rdquo;). These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use
          of astralus.online, related launchers, and linked community services such as Discord and support email channels.
        </p>
        <p className="mt-4">
          By creating an account, logging in, or otherwise accessing Astralus, you agree to be bound by these Terms. If you do
          not agree, do not access or play Astralus.
        </p>
      </>
    ),
  },
  {
    id: 'eligibility',
    title: '2. Eligibility & Accounts',
    content: (
      <>
        <ul className="list-disc space-y-2 pl-6">
          <li>You must be at least 13 years old (or the minimum age required by your country) to create an account.</li>
          <li>
            Account creation requires accurate information during registration, including commander name, email address, and a
            secure password. Optional profile fields (e.g., empire description) remain public to other players.
          </li>
          <li>
            You are responsible for maintaining the confidentiality of your credentials and for all activity conducted under your
            account. If you suspect unauthorised access, contact support immediately.
          </li>
          <li>Accounts may not be shared, sold, or transferred without our written consent.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'access',
    title: '3. Game Access, Virtual Goods & Economy',
    content: (
      <>
        <ul className="list-disc space-y-2 pl-6">
          <li>Astralus is free to play. Core gameplay features, including fleets, colonisation, and alliances, are accessible without payment.</li>
          <li>
            Premium currency ({' '}
            <span className="font-semibold text-white">Quantum Credits</span> ) and boosters may be offered for purchase. Pricing and
            availability will be communicated in-game before checkout. Quantum Credits have no real-world monetary value and may be revoked if Terms are violated.
          </li>
          <li>
            We reserve the right to adjust game balance, tick cadence, virtual goods, and availability of features to maintain fair
            play. Gameplay adjustments may impact the effectiveness of previously acquired items.
          </li>
          <li>
            Refund requests for virtual goods are evaluated case-by-case in accordance with regional consumer laws. Contact{' '}
            <a href="mailto:support@astralus.online" className="text-cyan-300 hover:text-cyan-200">
              support@astralus.online
            </a>{' '}
            for assistance.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'conduct',
    title: '4. Acceptable Use & Conduct',
    content: (
      <>
        <p>
          Astralus relies on deterministic, server-authoritative ticks. To protect competitive integrity you agree not to:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>Use exploits, automation scripts, bots, or unauthorised third-party tools.</li>
          <li>Attempt to disrupt tick processing, overload infrastructure, or gain unauthorised access to systems or data.</li>
          <li>Harass, threaten, or engage in hate speech, including via in-game mail, alliance channels, or Discord.</li>
          <li>Publish or share other players&rsquo; personal information without explicit consent (doxxing).</li>
          <li>Engage in commercial activity (selling accounts, resources, or services) without our written permission.</li>
        </ul>
        <p className="mt-4">
          Violations may lead to warnings, account suspension, removal of offending content, or permanent bans at our discretion.
        </p>
      </>
    ),
  },
  {
    id: 'content',
    title: '5. Player Content & Moderation',
    content: (
      <>
        <p>
          You retain rights to the content you submit in Astralus (e.g., alliance descriptions, mail messages), but grant us a
          worldwide, royalty-free licence to host, display, and distribute that content within the game, support materials, or
          community highlights.
        </p>
        <p className="mt-4">
          We moderate player communications to enforce these Terms and maintain community safety. Content may be logged and reviewed
          if flagged for abuse or investigated for security purposes.
        </p>
      </>
    ),
  },
  {
    id: 'support',
    title: '6. Support & Feedback',
    content: (
      <>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Report issues through the in-portal support form, email{' '}
            <a href="mailto:support@astralus.online" className="text-cyan-300 hover:text-cyan-200">
              support@astralus.online
            </a>
            , or our official Discord.
          </li>
          <li>
            By submitting feedback, ideas, or incident reports you grant us a licence to use, adapt, and publish that material without
            obligation to compensate you.
          </li>
          <li>Support replies target within one tick for high-severity incidents and within 48 hours for general requests.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'suspension',
    title: '7. Suspension & Termination',
    content: (
      <>
        <p>
          We may suspend or terminate access if you breach these Terms, violate community standards, or if we are required to do so
          by law. You may terminate your account at any time by contacting support. Upon termination:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>Your licence to access Astralus ends immediately.</li>
          <li>We may delete or anonymise your stored data in accordance with our Privacy Policy.</li>
          <li>Virtual goods associated with the account are forfeited and non-refundable.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'liability',
    title: '8. Warranties & Liability',
    content: (
      <>
        <ul className="list-disc space-y-2 pl-6">
          <li>Astralus is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We disclaim implied warranties of merchantability, fitness, and non-infringement.</li>
          <li>
            We do not guarantee uninterrupted service, glitch-free gameplay, or preservation of in-game progress. Scheduled
            maintenance and unscheduled outages may occur.
          </li>
          <li>
            To the maximum extent permitted by law, we are not liable for indirect or consequential damages arising from your use of
            Astralus. Our total liability is limited to fees you paid to us in the previous six months, if any.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'changes',
    title: '9. Updates to These Terms',
    content: (
      <>
        <p>
          We may revise these Terms to reflect gameplay updates, legal requirements, or new features. Material changes will be
          announced via the portal, login screen, or Discord. Continued use after changes take effect constitutes acceptance.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: '10. Contact',
    content: (
      <>
        <p>
          iammarkyb studios<br />
          support@astralus.online<br />
          Discord: <a href="https://discord.gg/astralus" className="text-cyan-300 hover:text-cyan-200">discord.gg/astralus</a>
        </p>
      </>
    ),
  },
]

export function TermsPage() {
  return (
    <div className="relative">
      <section className="container mx-auto px-6 py-24 lg:py-28">
        <div className="max-w-4xl mx-auto text-white/80">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">Legal</p>
          <h1 className="mt-6 text-4xl md:text-5xl font-bold text-white tracking-tight">Astralus Terms of Service</h1>
          <p className="mt-6 text-lg leading-relaxed">
            Effective 9 November 2025. These Terms describe the rules of engagement for playing Astralus, purchasing premium currency,
            and participating in our community channels.
          </p>
          <div className="mt-8 rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-xl">
            <h2 className="text-sm uppercase tracking-[0.3em] text-white/60">Quick Links</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {termsSections.map((section) => (
                <Button
                  key={section.id}
                  variant="outline"
                  className="justify-start border-white/20 text-white hover:bg-white/10"
                  onClick={() => {
                    const element = document.getElementById(section.id)
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  {section.title}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24 text-white/75">
        <div className="max-w-4xl mx-auto space-y-16">
          {termsSections.map((section) => (
            <article key={section.id} id={section.id} className="scroll-mt-32 rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-xl">
              <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed">{section.content}</div>
            </article>
          ))}
        </div>
        <div className="mt-24 rounded-3xl border border-white/10 bg-gradient-to-r from-cyan-500/10 via-black/70 to-purple-500/10 p-10 text-center backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">Start your command</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Ready to play under these terms?</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              onClick={() => window.location.assign('/register')}
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
          <p className="mt-6 text-xs text-white/50">Questions? Contact support@astralus.online before continuing.</p>
        </div>
      </section>
    </div>
  )
}

