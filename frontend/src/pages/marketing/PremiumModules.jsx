import { Link } from "react-router-dom";
import {
  Shield, Database, Bot, Target, Code2, Radar,
  IdCard, UserLock, GitBranch, Globe2, Cpu,
  ArrowRight, CheckCircle2, Sparkles,
} from "lucide-react";
import {
  Container, Reveal, Stagger, Item, Eyebrow, SectionHeading, AmbientBackdrop, Btn, StatusBadge,
} from "@/components/marketing/primitives";

const MODULES = [
  {
    id: "ad-shield",
    name: "Ad Shield",
    headline: "Stop Wasting Advertising Budget on Invalid Traffic",
    icon: Shield,
    accent: "trusted",
    description:
      "Ad Shield continuously monitors paid traffic and advertising campaigns to identify invalid clicks, fraudulent traffic, bots, click farms, and suspicious activity before they consume marketing budgets.",
    body:
      "By analyzing authenticity, behavior, and traffic quality in real time, Ad Shield helps organizations ensure advertising dollars are being spent on genuine human engagement rather than automated or fraudulent interactions.",
    benefits: [
      "Reduce click fraud",
      "Protect advertising budgets",
      "Improve return on ad spend (ROAS)",
      "Identify low-quality traffic sources",
      "Detect competitor click abuse",
      "Improve campaign performance",
    ],
    idealFor: ["Ecommerce", "Lead Generation", "Agencies", "SaaS Companies", "Performance Marketing Teams"],
  },
  {
    id: "ai-fraud-analyst",
    name: "AI Fraud Analyst",
    headline: "Your Always-On Fraud Investigation Assistant",
    icon: Bot,
    accent: "review",
    description:
      "AI Fraud Analyst acts as an intelligent investigation layer that continuously analyzes platform data, identifies anomalies, explains suspicious activity, and recommends corrective actions.",
    body:
      "Instead of manually searching through dashboards and reports, teams receive AI-generated insights that help quickly understand what happened, why it happened, and what to do next.",
    benefits: [
      "Explain fraud incidents automatically",
      "Surface hidden threats",
      "Investigate suspicious sessions",
      "Identify emerging attack patterns",
      "Generate executive summaries",
      "Accelerate fraud investigations",
    ],
    idealFor: ["Security Teams", "Fraud Operations", "Marketing Teams", "Compliance Teams", "Enterprise Organizations"],
  },
  {
    id: "intent-intelligence",
    name: "Intent Intelligence",
    headline: "Understand Why Visitors Are Really There",
    icon: Target,
    accent: "review",
    description:
      "Intent Intelligence analyzes behavioral signals and engagement patterns to determine the likely purpose behind a visitor's actions.",
    body:
      "The platform evaluates indicators that may suggest purchasing intent, research intent, competitive intelligence gathering, automated activity, or potentially malicious behavior. This provides organizations with a deeper understanding of visitor motivations beyond traditional analytics metrics.",
    benefits: [
      "Identify high-intent prospects",
      "Improve lead prioritization",
      "Detect suspicious behavior",
      "Enhance sales intelligence",
      "Improve conversion optimization",
      "Understand visitor motivations",
    ],
    idealFor: ["B2B Companies", "SaaS Organizations", "Ecommerce Businesses", "Sales Teams", "Marketing Teams"],
  },
  {
    id: "trust-apis",
    name: "Trust API Pack",
    headline: "Bring Human Authenticity Intelligence Into Any Application",
    icon: Code2,
    accent: "trusted",
    description:
      "The Trust API Pack provides developers with direct access to PoH intelligence services through secure APIs.",
    body:
      "Applications can perform real-time authenticity verification, trust validation, risk analysis, and fraud assessments directly within existing workflows and systems. Organizations can embed PoH intelligence anywhere decisions need to be made.",
    benefits: [
      "Verify visitors in real time",
      "Validate customers and users",
      "Integrate trust scoring into applications",
      "Enhance fraud prevention systems",
      "Improve automated decision making",
      "Extend PoH across your technology stack",
    ],
    idealFor: ["Software Developers", "SaaS Platforms", "Enterprise Applications", "Ecommerce Systems", "Identity Workflows"],
  },
  {
    id: "fraud-memory-cloud",
    name: "Fraud Memory Cloud",
    headline: "Learn From Every Fraud Attempt",
    icon: Database,
    accent: "fraud",
    description:
      "Fraud Memory Cloud is a continuously growing intelligence repository that stores known fraud indicators, suspicious devices, behavioral patterns, attack signatures, and historical risk signals.",
    body:
      "As new threats are identified, the platform becomes smarter and more effective at recognizing similar activity across future sessions. This shared intelligence layer allows organizations to benefit from historical fraud knowledge and accelerate threat detection.",
    benefits: [
      "Detect repeat offenders faster",
      "Identify known fraud patterns",
      "Improve detection accuracy",
      "Reduce false positives",
      "Accelerate investigations",
      "Strengthen fraud defenses over time",
    ],
    idealFor: ["Ecommerce Platforms", "Financial Services", "SaaS Providers", "Agencies", "Enterprise Organizations"],
  },
  {
    id: "threat-intelligence-feed",
    name: "Threat Intelligence Feed",
    headline: "Real-Time Visibility Into Emerging Threats",
    icon: Radar,
    accent: "fraud",
    description:
      "Threat Intelligence Feed delivers continuously updated intelligence on emerging fraud techniques, suspicious infrastructure, attack trends, and evolving threat activity.",
    body:
      "Organizations gain access to actionable intelligence that helps them proactively identify risks before they impact operations, customers, or revenue. The feed can also be integrated into existing security and monitoring platforms.",
    benefits: [
      "Monitor emerging threats",
      "Stay ahead of evolving fraud tactics",
      "Improve security awareness",
      "Strengthen threat detection",
      "Support security operations",
      "Enable proactive defense strategies",
    ],
    idealFor: ["Enterprise Security Teams", "Government Agencies", "Financial Services", "Managed Security Providers", "Large Digital Platforms"],
  },
];

const FUTURE_MODULES = [
  { icon: IdCard, t: "Identity Intelligence", d: "Verify digital identities while preserving privacy." },
  { icon: UserLock, t: "Account Protection", d: "Prevent account takeovers, credential abuse, and unauthorized access." },
  { icon: GitBranch, t: "Risk Orchestration", d: "Automate actions based on trust, fraud, and authenticity signals." },
  { icon: Globe2, t: "Trust Intelligence Network", d: "A global network effect where organizations collectively benefit from anonymized trust and fraud intelligence." },
  { icon: Cpu, t: "Autonomous Trust Engine", d: "AI-powered decisioning that automatically responds to threats and suspicious activity in real time." },
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

const DETAIL_SLUG = {
  "ad-shield": "ad-shield",
  "ai-fraud-analyst": "ai-fraud-analyst",
  "intent-intelligence": "intent-intelligence",
  "trust-apis": "trust-apis",
  "fraud-memory-cloud": "fraud-memory-cloud",
  "threat-intelligence-feed": "trust-apis", // no dedicated stub yet; redirect to API pack peer; safe fallback
};

function ModuleSection({ mod, index }) {
  const Icon = mod.icon;
  const flip = index % 2 === 1;
  const detail = DETAIL_SLUG[mod.id];
  return (
    <section id={mod.id} className="scroll-mt-24 border-t border-white/8 py-20 md:py-28">
      <Container>
        <div className={`grid gap-12 lg:grid-cols-[1.05fr_1fr] ${flip ? "lg:grid-flow-col-dense" : ""}`}>
          <div className={flip ? "lg:col-start-2" : ""}>
            <Reveal>
              <Eyebrow>
                <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${ACCENT_BORDER[mod.accent]}`}>
                  <Icon size={10} strokeWidth={2} />
                </span>
                {mod.name}
              </Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                {mod.headline}
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">{mod.description}</p>
            </Reveal>
            <Reveal delay={0.14}>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">{mod.body}</p>
            </Reveal>
            {detail && (
              <Reveal delay={0.18}>
                <Link
                  to={`/products/${detail}`}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-trusted hover:text-white"
                  data-testid={`module-link-${mod.id}`}
                >
                  Open module page <ArrowRight size={14} />
                </Link>
              </Reveal>
            )}
          </div>
          <div className={flip ? "lg:col-start-1 lg:row-start-1" : ""}>
            <Reveal delay={0.08} y={42}>
              <div className="grid gap-5">
                <div className="rounded-2xl border border-white/10 bg-surface p-6">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">What it does for you</div>
                  <ul className="mt-4 grid gap-2.5">
                    {mod.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-slate-200">
                        <CheckCircle2 size={16} strokeWidth={2} className={`mt-0.5 shrink-0 ${ACCENT_TEXT[mod.accent]}`} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0B0D0F] p-6">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Ideal for</div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {mod.idealFor.map((c) => (
                      <span key={c} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-slate-300">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default function PremiumModules() {
  return (
    <div data-testid="page-premium-modules">
      {/* HERO */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-24">
        <AmbientBackdrop />
        <Container className="relative text-center">
          <Reveal><Eyebrow>Premium Modules</Eyebrow></Reveal>
          <Reveal delay={0.06}>
            <h1 className="mx-auto mt-6 max-w-4xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Expansion modules that{" "}
              <span className="text-gradient animate-gradient-x">extend the core platform.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
              Bolt advanced intelligence, automation and APIs onto Proof of Human. Each module is built to
              integrate with the core platform — protect ad spend, accelerate investigations, embed trust
              scoring anywhere, and learn from every fraud attempt.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Btn to="/register" variant="primary" size="lg" data-testid="premium-cta-register">
                Start free <ArrowRight size={17} strokeWidth={2} />
              </Btn>
              <Btn to="/pricing" variant="outline" size="lg" data-testid="premium-cta-pricing">
                See pricing
              </Btn>
            </div>
          </Reveal>
          <Reveal delay={0.22}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <StatusBadge tone="secure" dot>Live</StatusBadge>
              <StatusBadge tone="secure">Real-time</StatusBadge>
              <StatusBadge tone="review">Composable</StatusBadge>
              <StatusBadge tone="muted">API-first</StatusBadge>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* MODULE NAV PILLS */}
      <section className="border-y border-white/8 bg-[#0A0B0D] py-12">
        <Container>
          <Stagger className="flex flex-wrap items-center justify-center gap-2.5">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <Item key={m.id}>
                  <a
                    href={`#${m.id}`}
                    className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface px-3.5 py-2 text-[13px] font-medium text-slate-200 transition-all hover:border-trusted/40 hover:bg-trusted/[0.06] hover:text-white"
                    data-testid={`premium-pill-${m.id}`}
                  >
                    <Icon size={14} strokeWidth={1.8} className={`${ACCENT_TEXT[m.accent]}`} />
                    {m.name}
                  </a>
                </Item>
              );
            })}
          </Stagger>
        </Container>
      </section>

      {/* MODULES (zig-zag) */}
      {MODULES.map((mod, i) => (
        <ModuleSection key={mod.id} mod={mod} index={i} />
      ))}

      {/* FUTURE MODULES */}
      <section className="border-y border-white/8 bg-[#0A0B0D] py-24 md:py-28">
        <Container>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles size={18} className="text-trusted" />
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-trusted">On the roadmap</span>
          </div>
          <SectionHeading
            title="Optional Future Enterprise Modules"
            blurb="As PoH evolves, additional premium modules will extend the platform across identity, account protection, orchestration and autonomous decisioning."
          />
          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FUTURE_MODULES.map((f) => (
              <Item key={f.t}>
                <div className="h-full rounded-2xl border border-dashed border-white/15 bg-surface/60 p-7 transition-all hover:border-trusted/30 hover:bg-surface">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <f.icon size={22} strokeWidth={1.6} className="text-slate-300" />
                    </span>
                    <StatusBadge tone="muted">Coming soon</StatusBadge>
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-bold text-white">{f.t}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{f.d}</p>
                </div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <AmbientBackdrop />
        <Container className="relative text-center">
          <Reveal>
            <h2 className="mx-auto max-w-3xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">
              Extend trust intelligence{" "}
              <span className="text-gradient animate-gradient-x">across your stack.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400">
              Start with the core platform. Add the premium modules your team needs — when you need them.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Btn to="/register" variant="primary" size="lg" data-testid="premium-final-cta-register">
                Start free <ArrowRight size={17} strokeWidth={2} />
              </Btn>
              <Btn to="/support" variant="outline" size="lg" data-testid="premium-final-cta-talk">
                Talk to sales
              </Btn>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
