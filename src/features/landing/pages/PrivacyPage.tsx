import { Button } from '@/components/ui/button'

const privacySections = [
  {
    id: 'information-we-collect',
    title: '1. Information We Collect',
    content: (
      <>
        <p>
          We collect only the data required to operate Astralus, secure accounts, and support the community. This includes:
        </p>
        <ul className="mt-4 list-disc space-y-3 pl-6">
          <li>
            <span className="font-semibold text-white">Account Data</span>: commander name, email address, password (stored hashed
            server-side), optional empire description or avatar, and onboarding status.
          </li>
          <li>
            <span className="font-semibold text-white">Gameplay Records</span>: empire configuration, planets, fleets, research
            progress, construction queues, combat logs, rankings, and tick history generated while you play.
          </li>
          <li>
            <span className="font-semibold text-white">Communications</span>: in-game mail, alliance chat, incident reports, support
            emails, and moderation notes necessary to enforce community rules.
          </li>
          <li>
            <span className="font-semibold text-white">Technical Data</span>: IP address, browser/device information, session tokens,
            crash diagnostics, websocket connection identifiers, and server logs captured automatically for security and stability.
          </li>
          <li>
            <span className="font-semibold text-white">Local Storage Preferences</span>: the web client stores authentication tokens,
            UI layout preferences (e.g., holopad widget placements, HUD state), notification archives, and cached map data in your
            browser - you can clear these via your browser settings.
          </li>
        </ul>
        <p className="mt-4 text-sm text-white/70">
          If you choose to authenticate via a social identity provider (when enabled), we receive the minimal profile information
          required to validate your account (typically name, email, and provider identifier).
        </p>
      </>
    ),
  },
  {
    id: 'how-we-use-data',
    title: '2. How We Use Your Data',
    content: (
      <>
        <ul className="list-disc space-y-3 pl-6">
          <li>Provide, maintain, and improve Astralus gameplay, including tick resolution and matchmaking.</li>
          <li>Authenticate accounts, prevent fraud, and keep the universe fair (e.g., detecting automation or exploit attempts).</li>
          <li>Deliver in-game and out-of-game communications such as patch notes, incident alerts, or support replies.</li>
          <li>Balance the game by analysing aggregated, anonymised gameplay trends (e.g., ship usage, win rates).</li>
          <li>Comply with legal obligations and enforce our Terms of Service.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'legal-bases',
    title: '3. Legal Bases',
    content: (
      <>
        <p>
          Depending on your location, our use of your personal data is justified by one or more of the following legal bases:
        </p>
        <ul className="mt-4 list-disc space-y-3 pl-6">
          <li>
            <span className="font-semibold text-white">Contract</span>: we process data necessary to deliver Astralus once you create
            an account or purchase premium currency.
          </li>
          <li>
            <span className="font-semibold text-white">Legitimate Interests</span>: we secure our services, prevent abuse, and improve
            gameplay balance in ways that do not override your rights.
          </li>
          <li>
            <span className="font-semibold text-white">Consent</span>: we rely on your consent for optional features such as marketing
            emails or when connecting your account to third-party platforms.
          </li>
          <li>
            <span className="font-semibold text-white">Legal Obligations</span>: we may need to retain or disclose certain data to comply
            with applicable laws or respond to lawful requests from authorities.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'sharing',
    title: '4. How We Share Information',
    content: (
      <>
        <p>We share data only with trusted partners that help us operate Astralus:</p>
        <ul className="mt-4 list-disc space-y-3 pl-6">
          <li>
            <span className="font-semibold text-white">Infrastructure Providers</span>: cloud hosting, databases, content delivery,
            and logging services necessary to keep Astralus online.
          </li>
          <li>
            <span className="font-semibold text-white">Communications Platforms</span>: email delivery services and Discord (for players
            who join the official server). Content shared on Discord is additionally governed by Discord&apos;s policies.
          </li>
          <li>
            <span className="font-semibold text-white">Identity & Payment Partners</span>: social login providers or payment processors
            (for Quantum Credits or boosters). We do not store full payment card details on our servers.
          </li>
          <li>
            <span className="font-semibold text-white">Compliance & Safety</span>: law enforcement or other parties when required to
            protect players, investigate fraud, or comply with legal obligations.
          </li>
        </ul>
        <p className="mt-4 text-sm text-white/70">
          We do not sell your personal data. When possible, data is shared in aggregated or pseudonymised form.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: '5. Data Retention',
    content: (
      <>
        <ul className="list-disc space-y-3 pl-6">
          <li>Account and gameplay records persist while your account is active and for a limited period after closure (up to 12 months) to support appeals or restore alliances.</li>
          <li>Support tickets and moderation logs are retained for as long as necessary to resolve the issue and enforce our Terms.</li>
          <li>Server logs and security telemetry are typically kept for up to 90 days unless required for investigations.</li>
          <li>
            You may request deletion of your account at any time. We will anonymise or delete personal data unless retention is required
            by law or for legitimate dispute resolution.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'security',
    title: '6. Security Measures',
    content: (
      <>
        <p>
          We implement administrative, technical, and physical safeguards to protect your information, including:
        </p>
        <ul className="mt-4 list-disc space-y-3 pl-6">
          <li>Transport Layer Security (HTTPS/WSS) for all client-server communication.</li>
          <li>Hashed and salted passwords, scoped access tokens, and role-based controls for internal tools.</li>
          <li>Rate limiting and automated detection against exploit attempts or suspicious automation.</li>
          <li>
            Limited staff access to production systems, with logs reviewed during incident response. Despite these measures, no online
            service is 100% secure, so we encourage strong passwords and two-factor authentication where available.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: '7. Your Choices & Rights',
    content: (
      <>
        <ul className="list-disc space-y-3 pl-6">
          <li>Access, correct, or update your profile via in-game settings or by contacting support.</li>
          <li>Request data deletion or account closure via support@astralus.online.</li>
          <li>Opt out of marketing communications through unsubscribe links or by contacting us directly.</li>
          <li>
            Disable or clear local storage preferences in your browser. Doing so may log you out or reset UI layouts.
          </li>
          <li>
            Depending on your jurisdiction (e.g., EEA/UK), you may have additional rights such as data portability or lodging a
            complaint with your supervisory authority.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'international',
    title: '8. International Data Transfers',
    content: (
      <>
        <p>
          Astralus infrastructure may be hosted in or replicated across multiple jurisdictions. When we transfer personal data across
          borders, we rely on appropriate safeguards such as standard contractual clauses or equivalent mechanisms required by local law.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: '9. Children',
    content: (
      <>
        <p>
          Astralus is not directed to children under 13. We do not knowingly collect personal data from children. If we learn we have
          inadvertently collected such data, we will delete it promptly and may suspend the account.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: '10. Changes to This Policy',
    content: (
      <>
        <p>
          We may update this Privacy Policy to reflect gameplay changes, new integrations, or legal requirements. Material changes will
          be communicated via the portal, email (where appropriate), or Discord. Continued use after the effective date signifies acceptance.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: '11. Contact',
    content: (
      <>
        <p>
          For privacy questions or requests, reach us at:<br />
          iammarkyb studios<br />
          support@astralus.online<br />
          Discord: <a href="https://discord.gg/astralus" className="text-cyan-300 hover:text-cyan-200">discord.gg/astralus</a>
        </p>
      </>
    ),
  },
]

export function PrivacyPage() {
  return (
    <div className="relative">
      <section className="container mx-auto px-6 py-24 lg:py-28">
        <div className="max-w-4xl mx-auto text-white/80">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">Legal</p>
          <h1 className="mt-6 text-4xl md:text-5xl font-bold text-white tracking-tight">Astralus Privacy Policy</h1>
          <p className="mt-6 text-lg leading-relaxed">
            Effective 9 November 2025. This policy explains what data we collect, how we use it, and the choices you have as a commander
            in the Astralus universe.
          </p>
          <div className="mt-8 rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-xl">
            <h2 className="text-sm uppercase tracking-[0.3em] text-white/60">Navigate this policy</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {privacySections.map((section) => (
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
          {privacySections.map((section) => (
            <article key={section.id} id={section.id} className="scroll-mt-32 rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-xl">
              <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed">{section.content}</div>
            </article>
          ))}
        </div>
        <div className="mt-24 rounded-3xl border border-white/10 bg-gradient-to-r from-cyan-500/10 via-black/70 to-purple-500/10 p-10 text-center backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">Control your data</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Need to update or delete your account?</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              onClick={() => window.location.assign('/support')}
            >
              Contact Support
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
              onClick={() => window.location.assign('/register')}
            >
              Play for free
            </Button>
          </div>
          <p className="mt-6 text-xs text-white/50">For privacy requests, email support@astralus.online with &ldquo;Data Rights&rdquo; in the subject.</p>
        </div>
      </section>
    </div>
  )
}
