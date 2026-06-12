import { Link } from "react-router-dom";
import {
  Fingerprint, ShieldCheck, Network, ShieldAlert, BarChart3,
  Code2, Layers, Gauge, Workflow, Search, ArrowRight, CheckCircle2,
  Target, Building2, ShoppingCart, Server, Briefcase, Landmark, Sparkles,
} from "lucide-react";
import {
  Container, Reveal, Stagger, Item, Eyebrow, SectionHeading, AmbientBackdrop, Btn, StatusBadge,
} from "@/components/marketing/primitives";

const ENGINES = [
  {
    id: "human-authenticity-intelligence",
    name: "Human Authenticity Intelligence",
    headline: "Identify Real Humans with Confidence",
    icon: Fingerprint,
    accent: "trusted",
    description:
      "Determine in real time whether a visitor is a genuine human or an automated, fraudulent or low-quality interaction. Every session is scored on multiple layers of evidence — not a single fingerprint.",
    evaluates: [
      "Device fingerprint integrity & recurrence",
      "Network origin (datacenter, VPN, proxy, Tor)",
      "Browser automation & headless signatures",
      "Behavioral depth (mouse, scroll, keyboard, dwell)",
      "Page interaction sequencing & timing",
      "Hardware & software anomaly indicators",
      "Cross-session pattern repetition",
    ],
    outputNote:
      "These signals are continuously weighted and combined into a single Human Authenticity Score on a 0–100 scale.",
    outputCard: { label: "Human Authenticity Score", value: 92, sub: "REAL HUMAN · HIGH CONFIDENCE" },
    benefits: [
      "Identify automated and fraudulent visitors",
      "Reduce bot traffic and invalid sessions",
      "Improve marketing data quality",
      "Protect lead funnels from junk submissions",
      "Strengthen security posture",
      "Deliver more accurate analytics",
    ],
  },
  {
    id: "trust-intelligence",
    name: "Trust Intelligence",
    headline: "Understand Who Can Be Trusted",
    icon: ShieldCheck,
    accent: "trusted",
    description:
      "Beyond authenticity, PoH measures behavioral trustworthiness — how a visitor engages, how consistent they are, and whether their actions match a healthy human profile. Trust is a continuous, evidence-backed signal you can act on.",
    evaluates: [
      "Engagement consistency over time",
      "Identity recurrence across sessions",
      "Behavioral coherence vs. healthy human profile",
      "Historical risk and abuse signals",
      "Cross-session reputation patterns",
      "Velocity & frequency anomalies",
    ],
    outputNote:
      "Produces a Trust Score (0–100) and a tiered trust band — useful for personalization, friction control and downstream automation.",
    outputCard: { label: "Trust Score", value: 87, sub: "TRUSTED · LOW RISK" },
    benefits: [
      "Prioritize high-trust visitors",
      "De-prioritize suspicious activity",
      "Improve conversion segmentation",
      "Strengthen retention models",
      "Power smarter personalization",
      "Reduce friction for trusted users",
    ],
  },
  {
    id: "traffic-intelligence",
    name: "Traffic Intelligence",
    headline: "See Where Your Traffic Comes From",
    icon: Network,
    accent: "review",
    description:
      "Understand the true origin and quality of every traffic source — paid, organic, direct, referral or social — beyond what your analytics platforms show. PoH reveals attribution gaps, dark traffic and source-level fraud.",
    signalsA: {
      title: "Channel classification",
      items: ["Paid Search", "Paid Social", "Organic", "Direct", "Referral", "Email", "Affiliate", "Bot / Automated"],
    },
    signalsB: {
      title: "Sources detected",
      items: ["Google Ads", "Meta", "TikTok", "LinkedIn", "Bing", "YouTube", "Partner referrals", "Dark-traffic detection"],
    },
    outputNote:
      "Combine source attribution with authenticity to see real-human traffic volume per channel — not just sessions.",
    benefits: [
      "Identify low-quality channels",
      "Validate attribution",
      "Detect dark traffic",
      "Improve channel-level ROAS",
      "Surface hidden fraud sources",
      "Inform spend allocation",
    ],
  },
  {
    id: "revenue-protection",
    name: "Revenue Protection",
    headline: "Protect Revenue from Fraud and Waste",
    icon: ShieldAlert,
    accent: "fraud",
    description:
      "Stop fraud from converting. PoH suppresses fake conversions, blocks abusive traffic and protects margins across acquisition, payments and customer operations — automatically and explainably.",
    evaluates: [
      "Fake & incentivized conversion suppression",
      "Click & lead fraud detection",
      "Promo, coupon & loyalty abuse",
      "Account farming & multi-accounting",
      "Refund & chargeback risk signals",
      "Affiliate fraud and false attribution",
    ],
    outputNote:
      "Every protective action is tied to a reason code and full evidence trail — defensible with ad networks, finance and compliance.",
    outputCard: { label: "Fraud Risk", value: 14, sub: "LOW · NO ACTION", inverse: true },
    benefits: [
      "Suppress fake conversions",
      "Block click & lead fraud",
      "Prevent payment & promo abuse",
      "Reduce chargebacks",
      "Protect ad budgets",
      "Improve lifetime customer value",
    ],
  },
  {
    id: "analytics-operations",
    name: "Analytics & Operations",
    headline: "Turn Intelligence into Action",
    icon: BarChart3,
    accent: "review",
    description:
      "All the dashboards, exports, alerts and APIs your team needs to operationalize trust intelligence — from boardroom KPIs to investigator workflows. PoH plugs into the tools your team already uses.",
    evaluates: [
      "Real-time dashboards & KPI views",
      "Executive & investor reporting",
      "Investigator queues & case workflows",
      "Webhook + REST APIs",
      "Alerts, thresholds & anomaly detection",
      "Custom rules engine & automation",
    ],
    outputNote:
      "Push verdicts to GA4, Google Ads, Meta Ads, HubSpot, Slack, BigQuery, S3 and webhooks. Stream every event to your stack.",
    benefits: [
      "Real-time dashboards",
      "Executive reporting",
      "Investigator queues",
      "Webhook + API delivery",
      "Alerts & anomaly detection",
      "Custom rules & automation",
    ],
  },
];

const HOW_STEPS = [
  { n: "01", icon: Code2, t: "Collect", d: "Drop one lightweight script. poh.js gathers device, network & behavioral signals — privacy-safe, no PII collected." },
  { n: "02", icon: Layers, t: "Enrich", d: "Global threat intelligence, historical patterns and cross-session memory are layered on top of the raw signal." },
  { n: "03", icon: Gauge, t: "Score", d: "The engine produces four explainable scores in ~23ms — every score is backed by reason codes, never a black box.", chips: true },
  { n: "04", icon: Workflow, t: "Act", d: "Automated rules and sensitivity profiles route each verdict to observe → flag → review → block." },
  { n: "05", icon: Search, t: "Investigate", d: "Replay session timelines, cluster repeated fingerprints into cases and resolve incidents with a full evidence trail." },
];

const SCORE_CHIPS = [
  { label: "Human Authenticity", tone: "trusted" },
  { label: "Trust", tone: "trusted" },
  { label: "Fraud", tone: "fraud" },
  { label: "Risk Indicators", tone: "suspicious" },
];

const AUDIENCES = [
  { icon: Target, t: "Marketing Teams", d: "Protect ad spend, validate attribution and clean up campaign performance with real-human metrics." },
  { icon: ShoppingCart, t: "Ecommerce", d: "Stop promo abuse, fake accounts and bot checkout — preserve margin and customer experience." },
  { icon: Server, t: "SaaS", d: "Block fraudulent signups, multi-accounting and trial abuse before they hit your funnel." },
  { icon: Briefcase, t: "Agencies", d: "Prove campaign quality to clients with explainable fraud reporting and source-level cleanup." },
  { icon: Building2, t: "Enterprises", d: "Operationalize trust intelligence across marketing, security, fraud and revenue functions." },
  { icon: Landmark, t: "Government & Public Sector", d: "Detect automated abuse on public services, protect citizen-facing platforms and verify human interaction." },
];

const OUTCOME_QUESTIONS = [
  "Is this visitor real?",
  "Should I trust their conversion?",
  "Should I spend more on this source?",
  "Is this campaign being attacked?",
  "Is this lead worth my sales team's time?",
];

const ACCENT_TEXT = {
  trusted: "text-trusted",
  fraud: "text-fraudulent",
  suspicious: "text-suspicious",
  review: "text-review",
};
const ACCENT_BORDER = {
  trusted: "border-trusted/30 bg-trusted/10",
  fraud: "border-fraudulent/30 bg-fraudulent/10",
  suspicious: "border-suspicious/30 bg-suspicious/10",
  review: "border-review/30 bg-review/10",
};

function ScoreCard({ label, value, sub, inverse = false }) {
  const tone = inverse
    ? value < 40 ? "trusted" : value < 70 ? "suspicious" : "fraud"
    : value > 75 ? "trusted" : value > 50 ? "suspicious" : "fraud";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B0D0F] p-7">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-trusted/50 to-transparent" />
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-3 flex items-end gap-2">
        <span className={`font-heading text-6xl font-extrabold leading-none ${ACCENT_TEXT[tone]}`}>{value}</span>
        <span className="mb-1.5 font-mono text-sm text-slate-500">/ 100</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className={`h-full rounded-full ${tone === "trusted" ? "bg-trusted" : tone === "suspicious" ? "bg-suspicious" : "bg-fraudulent"}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${ACCENT_BORDER[tone]} ${ACCENT_TEXT[tone]}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
        {sub}
      </div>
    </div>
  );
}

function EngineSection({ engine, index }) {
  const Icon = engine.icon;
  const flip = index % 2 === 1;
  return (
    <section id={engine.id} className="scroll-mt-24 border-t border-white/8 py-20 md:py-28">
      <Container>
        <div className={`grid gap-12 lg:grid-cols-[1.1fr_1fr] ${flip ? "lg:grid-flow-col-dense" : ""}`}>
          <div className={flip ? "lg:col-start-2" : ""}>
            <Reveal>
              <Eyebrow>
                <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${ACCENT_BORDER[engine.accent]}`}>
                  <Icon size={10} strokeWidth={2} />
                </span>
                {engine.name}
              </Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                {engine.headline}
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">{engine.description}</p>
            </Reveal>

            {engine.evaluates && (
              <Reveal delay={0.14}>
                <div className="mt-6">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    The platform continuously evaluates
                  </div>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {engine.evaluates.map((it) => (
                      <li key={it} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${engine.accent === "fraud" ? "bg-fraudulent" : engine.accent === "review" ? "bg-review" : "bg-trusted"}`} />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )}

            {engine.signalsA && (
              <Reveal delay={0.14}>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {[engine.signalsA, engine.signalsB].map((sig) => (
                    <div key={sig.title}>
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">{sig.title}</div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {sig.items.map((c) => (
                          <span key={c} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-slate-300">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}

            {engine.outputNote && (
              <Reveal delay={0.18}>
                <p className="mt-5 rounded-xl border-l-2 border-trusted/60 bg-trusted/[0.04] px-4 py-3 text-sm leading-relaxed text-slate-300">
                  {engine.outputNote}
                </p>
              </Reveal>
            )}

            <Reveal delay={0.22}>
              <Link
                to={`/products/${engine.id}`}
                className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-trusted hover:text-white"
                data-testid={`engine-link-${engine.id}`}
              >
                Open module page <ArrowRight size={14} />
              </Link>
            </Reveal>
          </div>

          <div className={flip ? "lg:col-start-1 lg:row-start-1" : ""}>
            <Reveal delay={0.08} y={42}>
              <div className="grid gap-5">
                {engine.outputCard && (
                  <ScoreCard
                    label={engine.outputCard.label}
                    value={engine.outputCard.value}
                    sub={engine.outputCard.sub}
                    inverse={engine.outputCard.inverse}
                  />
                )}
                <div className="rounded-2xl border border-white/10 bg-surface p-6">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">What it does for you</div>
                  <ul className="mt-4 grid gap-2.5">
                    {engine.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-slate-200">
                        <CheckCircle2 size={16} strokeWidth={2} className={`mt-0.5 shrink-0 ${ACCENT_TEXT[engine.accent]}`} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default function ProofOfHumanPlatform() {
  return (
    <div data-testid="page-poh-platform">
      {/* HERO */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-24">
        <AmbientBackdrop />
        <Container className="relative text-center">
          <Reveal><Eyebrow>Proof of Human Platform</Eyebrow></Reveal>
          <Reveal delay={0.06}>
            <h1 className="mx-auto mt-6 max-w-4xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Know Who&apos;s Real.{" "}
              <span className="text-gradient animate-gradient-x">Trust What Matters.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-400 md:text-lg">
              Proof of Human is a real-time trust intelligence platform that scores every visitor, every conversion
              and every campaign — exposing bots, fraud and invalid traffic before they cost you money. We turn raw
              device, network and behavioral signals into explainable verdicts you can actually act on.
            </p>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-trusted/30 bg-trusted/[0.04] p-6 text-left">
              <div className="flex items-start gap-3">
                <Sparkles size={20} className="mt-0.5 shrink-0 text-trusted" />
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-trusted">What makes PoH different</div>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-200">
                    Most fraud tools count clicks. PoH measures humans. Every score is backed by reason codes —
                    no black box, no guessing, just evidence your team, your CFO and your ad networks will accept.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300">
              One platform. Five intelligence engines. One question answered: <span className="text-white">is this visitor real?</span>
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Btn to="/register" variant="primary" size="lg" data-testid="poh-cta-register">
                Start free <ArrowRight size={17} strokeWidth={2} />
              </Btn>
              <Btn to="/pricing" variant="outline" size="lg" data-testid="poh-cta-pricing">
                See pricing
              </Btn>
            </div>
          </Reveal>

          <Reveal delay={0.28}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <StatusBadge tone="secure" dot>Live</StatusBadge>
              <StatusBadge tone="secure">~23ms verdicts</StatusBadge>
              <StatusBadge tone="review">GDPR-ready</StatusBadge>
              <StatusBadge tone="muted">No PII required</StatusBadge>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="border-y border-white/8 bg-[#0A0B0D] py-20">
        <Container>
          <SectionHeading
            eyebrow="What's included in the core platform"
            title="Five intelligence engines, one platform."
            blurb="PoH bundles every intelligence layer your team needs — from authenticity scoring to revenue protection — into a single, explainable workspace. No bolt-ons. No silos."
          />
          <Stagger className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-2.5">
            {ENGINES.map((e) => {
              const Icon = e.icon;
              return (
                <Item key={e.id}>
                  <a
                    href={`#${e.id}`}
                    className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface px-3.5 py-2 text-[13px] font-medium text-slate-200 transition-all hover:border-trusted/40 hover:bg-trusted/[0.06] hover:text-white"
                    data-testid={`poh-pill-${e.id}`}
                  >
                    <Icon size={14} strokeWidth={1.8} className={`${ACCENT_TEXT[e.accent]}`} />
                    {e.name}
                  </a>
                </Item>
              );
            })}
          </Stagger>
        </Container>
      </section>

      {/* ENGINES (zig-zag) */}
      {ENGINES.map((engine, i) => (
        <EngineSection key={engine.id} engine={engine} index={i} />
      ))}

      {/* HOW IT WORKS */}
      <section className="relative overflow-hidden border-y border-white/8 bg-[#0A0B0D] py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-30" />
        <Container className="relative">
          <SectionHeading eyebrow="How Proof of Human Works" title="From raw signal to decisive action" />
          <Stagger className="mt-14 grid gap-6 md:grid-cols-3 lg:grid-cols-5">
            {HOW_STEPS.map((s, i) => (
              <Item key={s.t}>
                <div className="relative h-full rounded-2xl border border-white/10 bg-surface p-6">
                  <div className="absolute -top-3 left-6 rounded-full border border-trusted/40 bg-[#0A0B0D] px-2.5 py-0.5 font-mono text-[10px] text-trusted">
                    {s.n}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-trusted/30 bg-trusted/10">
                    <s.icon size={22} strokeWidth={1.6} className="text-trusted" />
                  </div>
                  <h3 className="mt-4 font-heading text-base font-bold text-white">{s.t}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{s.d}</p>
                  {s.chips && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {SCORE_CHIPS.map((c) => (
                        <span
                          key={c.label}
                          className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${ACCENT_BORDER[c.tone]} ${ACCENT_TEXT[c.tone]}`}
                        >
                          {c.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* WHO USES POH */}
      <section className="py-24 md:py-32">
        <Container>
          <SectionHeading eyebrow="Audiences" title="Who Uses Proof of Human?" />
          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((a) => (
              <Item key={a.t}>
                <div className="h-full rounded-2xl border border-white/10 bg-surface p-7 transition-all hover:-translate-y-1 hover:border-trusted/30">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                    <a.icon size={22} strokeWidth={1.6} className="text-trusted" />
                  </span>
                  <h3 className="mt-5 font-heading text-lg font-bold text-white">{a.t}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{a.d}</p>
                </div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* OUTCOME */}
      <section className="border-y border-white/8 bg-[#0A0B0D] py-24 md:py-32">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <Reveal><Eyebrow>The outcome</Eyebrow></Reveal>
              <Reveal delay={0.06}>
                <h2 className="mt-5 font-heading text-3xl font-extrabold leading-tight tracking-tight text-white md:text-[42px]">
                  Every team running paid traffic needs to answer one question{" "}
                  <span className="text-gradient animate-gradient-x">— is this visitor real?</span>
                </h2>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400">
                  PoH gives marketing, security, fraud, RevOps and product teams the same source of truth.
                  When trust is measurable, every downstream decision gets sharper — campaigns, conversions,
                  attribution, sales, retention, even fraud response.
                </p>
              </Reveal>
              <Reveal delay={0.18}>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300">
                  PoH answers all five — in real time, with evidence.
                </p>
              </Reveal>
            </div>
            <Stagger className="space-y-3">
              {OUTCOME_QUESTIONS.map((q, i) => (
                <Item key={q}>
                  <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-surface px-5 py-4 transition-colors hover:border-trusted/30">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-trusted/30 bg-trusted/10 font-mono text-xs text-trusted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-heading text-lg font-bold text-white md:text-xl">{q}</span>
                  </div>
                </Item>
              ))}
            </Stagger>
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <AmbientBackdrop />
        <Container className="relative text-center">
          <Reveal>
            <h2 className="mx-auto max-w-3xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">
              Know who&apos;s real.{" "}
              <span className="text-gradient animate-gradient-x">Trust what matters.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400">
              Stand up a workspace in minutes. Start scoring real traffic in your first session.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Btn to="/register" variant="primary" size="lg" data-testid="poh-final-cta-register">
                Start free <ArrowRight size={17} strokeWidth={2} />
              </Btn>
              <Btn to="/pricing" variant="outline" size="lg" data-testid="poh-final-cta-pricing">
                See pricing
              </Btn>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
