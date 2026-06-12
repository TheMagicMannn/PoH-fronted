import {
  Activity, ShieldCheck, Crosshair, Gauge, Network, Fingerprint, Bot,
  TrendingDown, UserX, ScanLine, Workflow, Search, ArrowRight, Zap, Lock, Code2,
} from "lucide-react";
import {
  Container, Reveal, Stagger, Item, Counter, Eyebrow, SectionHeading, AmbientBackdrop, Btn, StatusBadge,
} from "@/components/marketing/primitives";
import HeroSlider from "@/components/marketing/HeroSlider";

const LOGOS = ["NORTHWIND", "VOLTREACH", "PIXELERA", "HELIXIO", "QUANTLEAP", "BRIGHTFUNNEL", "ADVERA", "MERIDIAN"];

const PROBLEMS = [
  { icon: TrendingDown, tone: "fraud", k: "Up to 40%", t: "Wasted ad spend", d: "Click farms, bots and invalid traffic silently drain paid budgets while dashboards report healthy numbers." },
  { icon: Bot, tone: "suspicious", k: "1 in 5", t: "Sessions are non-human", d: "Headless browsers and automation frameworks mimic real users — until you inspect the behavioral signals." },
  { icon: UserX, tone: "review", k: "30%+", t: "Fake & junk leads", d: "Form-fill bots and incentivized traffic pollute your CRM and waste your sales team's time." },
];

const STEPS = [
  { icon: Code2, n: "01", t: "Collect", d: "Drop one lightweight script. poh.js captures device, network and behavioral signals — privacy-safe, no PII." },
  { icon: Gauge, n: "02", t: "Score", d: "Our layered-evidence engine scores every session & conversion in ~23ms with explainable reason codes." },
  { icon: Workflow, n: "03", t: "Act", d: "Observe, flag, route to review or block — automatically, with rules tuned to your risk appetite." },
];

const CAPS = [
  { icon: Activity, t: "Session Intelligence", d: "Forensic timeline of every visit with trust gauge, reason codes and device fingerprint recurrence." },
  { icon: Crosshair, t: "Conversion Authenticity", d: "Score conversions, not just clicks. Suppress fake leads before they hit your CRM or pixel." },
  { icon: ScanLine, t: "Campaign Quality", d: "Roll fraud up to source, campaign and ad set — see exactly where wasted spend is hiding." },
  { icon: ShieldCheck, t: "Rules & Automation", d: "If-this-then-that rules + sensitivity profiles turn signals into observe / flag / review / block." },
  { icon: Search, t: "Investigations", d: "Cluster repeated fingerprints into cases and trace coordinated fraud across sessions." },
  { icon: Network, t: "Integrations", d: "GA4, Google Ads, Meta Ads, HubSpot and webhooks — push verdicts where your team already works." },
];

const STATS = [
  { to: 1.2, prefix: "$", suffix: "B", decimals: 1, label: "Ad spend protected" },
  { to: 4.8, suffix: "B", decimals: 1, label: "Sessions scored" },
  { to: 23, suffix: "ms", decimals: 0, label: "Median scoring latency" },
  { to: 99.99, suffix: "%", decimals: 2, label: "Platform uptime" },
];

const INTEGRATIONS = ["Google Analytics 4", "Google Ads", "Meta Ads", "TikTok Ads", "HubSpot", "Webhooks", "Segment", "Slack"];

const QUOTES = [
  { q: "PoH paid for itself in the first week. We cut 31% of wasted Google Ads spend by blocking datacenter traffic we never knew existed.", a: "Maya Lindqvist", r: "VP Growth, Voltreach" },
  { q: "The reason codes are the killer feature. When finance asks why we suppressed a conversion, I can show them the exact forensic evidence.", a: "Daniel Osei", r: "Head of Paid Media, Pixelera" },
  { q: "We dropped junk leads to our sales team by 38%. The poh.js install took our engineer less than ten minutes.", a: "Priya Raman", r: "RevOps Lead, Helixio" },
];

export default function Home() {
  return (
    <div data-testid="page-home">
      {/* HERO SLIDER (replaces previous hero section) */}
      <HeroSlider />

      {/* SOCIAL PROOF MARQUEE */}
      <section className="border-y border-white/8 bg-[#0A0B0D] py-8">
        <Container>
          <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-slate-600">
            Trusted by performance &amp; growth teams worldwide
          </p>
        </Container>
        <div className="mask-fade-x overflow-hidden">
          <div className="flex w-max animate-marquee gap-16 pr-16">
            {[...LOGOS, ...LOGOS].map((l, i) => (
              <span key={i} className="font-heading text-xl font-extrabold tracking-tight text-white/25 transition-colors hover:text-white/50">
                {l}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM BENTO */}
      <section className="relative py-24 md:py-32">
        <Container>
          <SectionHeading
            eyebrow="The problem"
            title="Your analytics are lying to you"
            blurb="Every dashboard counts the same traffic — real or not. The fraud is invisible until you score the signals behind each session."
          />
          <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
            {PROBLEMS.map((p) => (
              <Item key={p.t}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-surface p-8 transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
                  <div className="absolute inset-0 bg-grid-fine opacity-0 transition-opacity duration-300 group-hover:opacity-40" />
                  <div className="relative">
                    <p.icon size={26} strokeWidth={1.6} className={p.tone === "fraud" ? "text-fraudulent" : p.tone === "suspicious" ? "text-suspicious" : "text-review"} />
                    <div className="mt-6 font-heading text-4xl font-extrabold tracking-tight text-white">{p.k}</div>
                    <div className="mt-1 font-heading text-lg font-bold text-white">{p.t}</div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">{p.d}</p>
                  </div>
                </div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative overflow-hidden border-y border-white/8 bg-[#0A0B0D] py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-30" />
        <Container className="relative">
          <SectionHeading eyebrow="How it works" title="From raw signal to decisive action" />
          <Stagger className="mt-16 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Item key={s.t}>
                <div className="relative">
                  {i < 2 && <div className="absolute right-0 top-7 hidden h-px w-1/2 translate-x-1/2 bg-gradient-to-r from-trusted/40 to-transparent md:block" />}
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-trusted/30 bg-trusted/10">
                    <s.icon size={24} strokeWidth={1.6} className="text-trusted" />
                  </div>
                  <div className="mt-5 font-mono text-xs text-trusted">{s.n}</div>
                  <h3 className="mt-1 font-heading text-xl font-bold text-white">{s.t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{s.d}</p>
                </div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* CAPABILITIES */}
      <section className="py-24 md:py-32">
        <Container>
          <SectionHeading
            eyebrow="The platform"
            title="One command center for traffic trust"
            blurb="Everything you need to detect, understand and act on invalid traffic — in a single forensic workspace."
          />
          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CAPS.map((c) => (
              <Item key={c.t}>
                <div className="group h-full rounded-2xl border border-white/10 bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:border-trusted/30 hover:shadow-[0_20px_50px_-25px_rgba(52,211,153,0.4)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition-colors group-hover:border-trusted/30 group-hover:bg-trusted/10">
                    <c.icon size={22} strokeWidth={1.6} className="text-slate-300 transition-colors group-hover:text-trusted" />
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-bold text-white">{c.t}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{c.d}</p>
                </div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* STATS */}
      <section className="relative overflow-hidden border-y border-white/8 bg-[#0A0B0D] py-20">
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-trusted/40 to-transparent" />
        <Container>
          <Stagger className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((s) => (
              <Item key={s.label} className="text-center">
                <div className="font-heading text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                  <Counter to={s.to} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
                </div>
                <div className="mt-2 font-mono text-[11px] uppercase tracking-wider text-slate-500">{s.label}</div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* INTEGRATIONS */}
      <section className="py-24 md:py-32">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Reveal><Eyebrow>Connected</Eyebrow></Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  Plays nicely with your entire stack
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
                  Push verdicts to your ad platforms, analytics and CRM. Stream events to webhooks. Keep working
                  where your team already lives — PoH layers on top.
                </p>
              </Reveal>
              <Reveal delay={0.16}>
                <div className="mt-7">
                  <Btn to="/products/proof-of-human-platform" variant="outline" size="md" data-testid="integrations-cta">
                    Explore integrations <ArrowRight size={15} strokeWidth={2} />
                  </Btn>
                </div>
              </Reveal>
            </div>
            <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-2">
              {INTEGRATIONS.map((name) => (
                <Item key={name}>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface px-4 py-3.5 transition-colors hover:border-trusted/30">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                      <Network size={16} strokeWidth={1.6} className="text-trusted" />
                    </span>
                    <span className="text-sm font-medium text-slate-200">{name}</span>
                  </div>
                </Item>
              ))}
            </Stagger>
          </div>
        </Container>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-t border-white/8 bg-[#0A0B0D] py-24 md:py-32">
        <Container>
          <SectionHeading eyebrow="Proof" title="Teams stop paying for fraud" />
          <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
            {QUOTES.map((t) => (
              <Item key={t.a}>
                <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-surface p-7">
                  <StatusBadge tone="secure" className="self-start">verified</StatusBadge>
                  <blockquote className="mt-5 flex-1 text-[15px] leading-relaxed text-slate-200">“{t.q}”</blockquote>
                  <figcaption className="mt-6 border-t border-white/8 pt-4">
                    <div className="font-heading text-sm font-bold text-white">{t.a}</div>
                    <div className="font-mono text-[11px] text-slate-500">{t.r}</div>
                  </figcaption>
                </figure>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>
    </div>
  );
}
