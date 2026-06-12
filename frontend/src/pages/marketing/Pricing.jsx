import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Minus, ArrowRight, Plus, Sparkles, ShieldCheck, Bot, Activity, Crosshair, ScanLine,
  Search, Boxes, BadgeCheck, Layers, Building2, Users, Zap,
} from "lucide-react";
import {
  Container, Reveal, Stagger, Item, Eyebrow, SectionHeading, AmbientBackdrop, Btn, StatusBadge,
} from "@/components/marketing/primitives";
import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------
 * TIER DATA
 * --------------------------------------------------------------- */

const TIERS = [
  {
    id: "starter",
    name: "Starter",
    blurb: "Developers, hobby projects, small websites and early-stage startups.",
    monthly: 0,
    annual: 0,
    annualBadge: null,
    custom: false,
    cta: "Start free",
    to: "/register",
    highlight: false,
    inherits: null,
    groups: [
      {
        title: "Human Authenticity Intelligence",
        icon: ShieldCheck,
        items: [
          "Human Score", "Trust Score", "Fraud Risk Score", "Device Intelligence",
          "Behavioral Analysis", "Session Fingerprinting", "Bot Detection", "Risk Indicators",
        ],
      },
      {
        title: "Traffic Intelligence",
        icon: Activity,
        items: [
          "Traffic Dashboard", "Real-Time Monitoring", "Basic Traffic Analytics",
          "Geographic Insights", "Device Analytics",
        ],
      },
      {
        title: "AI Insights",
        icon: Sparkles,
        items: ["Basic AI Insights", "Traffic Quality Analysis", "Automated Risk Alerts"],
      },
    ],
    limits: [
      "1 Website", "10,000 Monthly Sessions", "50,000 API Calls",
      "1 API Key", "7-Day Data Retention", "1 User",
    ],
    notIncluded: [
      "Ad Shield", "Session Investigation", "AI Fraud Analyst",
      "Intent Intelligence", "Exports", "Team Collaboration",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    blurb: "Growing businesses, SaaS companies and ecommerce brands.",
    monthly: 49.99,
    annual: 499,
    annualBadge: "Save 17%",
    custom: false,
    cta: "Start 14-day trial",
    to: "/register",
    highlight: true,
    inherits: "Starter",
    groups: [
      {
        title: "Revenue Protection",
        icon: Crosshair,
        items: [
          "Revenue Protection Dashboard", "Conversion Analysis",
          "Traffic Quality Reporting", "Campaign Performance Analysis",
        ],
      },
      {
        title: "Investigation Tools",
        icon: Search,
        items: [
          "Session Investigation", "Session Replay", "Visitor Journey Analytics",
          "User Timeline View", "Advanced Search & Filtering",
        ],
      },
      {
        title: "Analytics",
        icon: ScanLine,
        items: [
          "Traffic Source Intelligence", "Campaign Analytics", "Custom Alerts",
          "CSV Exports", "API Reporting",
        ],
      },
      {
        title: "AI Intelligence",
        icon: Sparkles,
        items: ["Enhanced AI Insights", "Risk Pattern Analysis", "Fraud Trend Detection"],
      },
    ],
    limits: [
      "5 Websites", "100,000 Monthly Sessions", "500,000 API Calls",
      "5 API Keys", "90-Day Retention", "3 Users",
    ],
    notIncluded: null,
  },
  {
    id: "growth",
    name: "Growth",
    blurb: "Agencies, SaaS platforms, ecommerce and multi-brand organizations.",
    monthly: 299.99,
    annual: 2999,
    annualBadge: "Save 17%",
    custom: false,
    cta: "Start 14-day trial",
    to: "/register",
    highlight: false,
    inherits: "Pro",
    premiumIncluded: ["Ad Shield", "AI Fraud Analyst", "Intent Intelligence", "Trust API Pack"],
    groups: [
      {
        title: "Ad Protection",
        icon: ShieldCheck,
        items: [
          "Ad Shield Included", "Click Fraud Protection", "Invalid Traffic Detection",
          "Campaign Trust Scoring", "Ad Spend Validation",
        ],
      },
      {
        title: "Trust Intelligence",
        icon: BadgeCheck,
        items: [
          "Lead Authenticity Analysis", "Conversion Validation", "Multi-Site Trust Scoring",
          "Trust Trend Analytics", "Traffic Reputation Monitoring",
        ],
      },
      {
        title: "Business Intelligence",
        icon: Layers,
        items: [
          "Multi-Site Analytics", "White Label Reports", "Custom Dashboards",
          "Client Reporting", "Executive Reporting",
        ],
      },
      {
        title: "AI Intelligence",
        icon: Sparkles,
        items: [
          "Advanced AI Insights", "AI Fraud Detection", "AI Recommendations",
          "Predictive Risk Analysis",
        ],
      },
    ],
    limits: [
      "25 Websites", "1,000,000 Monthly Sessions", "5,000,000 API Calls",
      "25 API Keys", "1-Year Retention", "15 Users",
    ],
    notIncluded: null,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    blurb: "Enterprise, government, financial services and cybersecurity teams.",
    monthly: null,
    annual: null,
    annualBadge: null,
    custom: true,
    cta: "Contact sales",
    to: "/support",
    highlight: false,
    inherits: "Growth",
    groups: [
      {
        title: "Enterprise Security",
        icon: ShieldCheck,
        items: [
          "Dedicated Infrastructure", "Single Tenant Deployment", "SSO", "SCIM",
          "Audit Logs", "RBAC Controls", "Compliance Reporting",
        ],
      },
      {
        title: "Enterprise Intelligence",
        icon: Boxes,
        items: [
          "Fraud Memory Cloud", "Trust Intelligence Network", "Threat Intelligence Feed",
          "Cross-Customer Fraud Detection", "Identity Correlation", "Fraud Attribution",
        ],
      },
      {
        title: "Enterprise AI",
        icon: Sparkles,
        items: [
          "Private AI Models", "Custom Detection Models", "AI Fraud Analyst",
          "AI Investigation Workbench", "AI Threat Correlation", "AI Trust Intelligence",
        ],
      },
      {
        title: "Integrations",
        icon: Layers,
        items: [
          "SIEM Integration", "SOAR Integration", "Custom Integrations",
          "Webhook Framework", "Enterprise API Access",
        ],
      },
      {
        title: "Support",
        icon: Users,
        items: [
          "Dedicated Success Manager", "Technical Account Manager", "Architecture Reviews",
          "SLA Guarantees", "Priority Support",
        ],
      },
    ],
    limits: [
      "Unlimited Websites", "Unlimited Users", "Unlimited Retention",
      "100M+ API Calls", "Unlimited API Keys",
    ],
    notIncluded: null,
  },
];

/* -----------------------------------------------------------------
 * PREMIUM MODULES MATRIX
 * --------------------------------------------------------------- */

const MODULES = [
  { name: "Ad Shield",                  starter: "—", pro: "$49/mo",  growth: "Included", enterprise: "Included" },
  { name: "AI Fraud Analyst",           starter: "—", pro: "$29/mo",  growth: "Included", enterprise: "Included" },
  { name: "Intent Intelligence",        starter: "—", pro: "$39/mo",  growth: "Included", enterprise: "Included" },
  { name: "Trust API Pack",             starter: "—", pro: "$19/mo",  growth: "Included", enterprise: "Included" },
  { name: "Fraud Memory Cloud",         starter: "—", pro: "—",       growth: "$79/mo",   enterprise: "Included" },
  { name: "Threat Intelligence Feed",   starter: "—", pro: "—",       growth: "$99/mo",   enterprise: "Included" },
  { name: "Trust Intelligence Network", starter: "—", pro: "—",       growth: "$149/mo",  enterprise: "Included" },
  { name: "Dedicated Infrastructure",   starter: "—", pro: "—",       growth: "—",        enterprise: "Included" },
  { name: "Private AI Models",          starter: "—", pro: "—",       growth: "—",        enterprise: "Included" },
];

/* -----------------------------------------------------------------
 * REVENUE EXPANSION JOURNEY
 * --------------------------------------------------------------- */

const JOURNEY = [
  { tier: "Starter",       price: "Free",          note: "Free adoption",                    tone: "slate" },
  { tier: "Pro",           price: "$49.99/mo",     note: "Core platform",                    tone: "trusted" },
  { tier: "Pro + Ad Shield", price: "$98.99/mo",   note: "Click-fraud protection added",     tone: "trusted" },
  { tier: "Pro + Full Intelligence Stack", price: "~$185/mo", note: "All Pro add-ons unlocked",   tone: "trusted" },
  { tier: "Growth",        price: "$299.99/mo",    note: "Multi-site & agency tier",         tone: "review" },
  { tier: "Growth + Fraud Memory Cloud", price: "$378.99/mo", note: "Cross-customer signal",     tone: "review" },
  { tier: "Growth + Full Intelligence Stack", price: "~$550/mo", note: "Threat + trust network",  tone: "review" },
  { tier: "Enterprise",    price: "$1,500–$10,000+/mo", note: "By volume & deployment model", tone: "fraud" },
];

const TONE_CLS = {
  slate:   "border-white/10 bg-white/[0.03] text-slate-300",
  trusted: "border-trusted/30 bg-trusted/[0.06] text-trusted",
  review:  "border-review/30 bg-review/[0.06] text-review",
  fraud:   "border-fraudulent/30 bg-fraudulent/[0.06] text-fraudulent",
};

/* -----------------------------------------------------------------
 * COMPARE TABLE
 * --------------------------------------------------------------- */

const COMPARE = [
  { label: "Websites",            v: ["1", "5", "25", "Unlimited"] },
  { label: "Monthly sessions",    v: ["10k", "100k", "1M", "Unlimited"] },
  { label: "API calls / month",   v: ["50k", "500k", "5M", "100M+"] },
  { label: "API keys",            v: ["1", "5", "25", "Unlimited"] },
  { label: "Data retention",      v: ["7 days", "90 days", "1 year", "Unlimited"] },
  { label: "Team seats",          v: ["1", "3", "15", "Unlimited"] },
  { label: "Human / Trust / Fraud scores", v: [true, true, true, true] },
  { label: "Session investigation & replay", v: [false, true, true, true] },
  { label: "CSV exports & API reporting",    v: [false, true, true, true] },
  { label: "Ad Shield (click fraud)",        v: [false, "Add-on", true, true] },
  { label: "Multi-site & white-label reports", v: [false, false, true, true] },
  { label: "AI Fraud Analyst",                 v: [false, "Add-on", true, true] },
  { label: "Fraud Memory Cloud / Threat Feed", v: [false, false, "Add-on", true] },
  { label: "SSO, SCIM & RBAC",                 v: [false, false, false, true] },
  { label: "Dedicated infrastructure",         v: [false, false, false, true] },
  { label: "Private AI models",                v: [false, false, false, true] },
  { label: "Support",                          v: ["Community", "Email", "Priority", "Dedicated"] },
];

/* -----------------------------------------------------------------
 * FAQ
 * --------------------------------------------------------------- */

const FAQ = [
  { q: "How is a session counted?", a: "A session is a unique visit scored by poh.js within a 30-minute activity window. Repeated events from the same session do not count again. Conversions are included at no extra charge." },
  { q: "Do you need to collect personal data (PII)?", a: "No. PoH scores device, network and behavioral signals only — never names, emails or form values. The platform is built to be GDPR and CCPA friendly out of the box." },
  { q: "Can I buy premium modules à la carte?", a: "Yes. On Pro you can add Ad Shield, AI Fraud Analyst, Intent Intelligence and the Trust API Pack individually. Growth includes all four out of the box, plus optional Fraud Memory Cloud, Threat Intelligence Feed and Trust Intelligence Network." },
  { q: "What happens if I exceed my session or API limit?", a: "We never stop scoring your traffic. You'll get a heads-up as you approach your limit and can upgrade anytime — overages are billed transparently, never silently." },
  { q: "Is there a free trial?", a: "Starter is free forever. Pro and Growth include a 14-day full-feature trial with no credit card required. Cancel anytime." },
  { q: "When should I move from Pro to Growth or Enterprise?", a: "Growth makes sense once you're running multiple sites, need white-label reporting, or want Ad Shield bundled. Enterprise is for high-volume traffic, dedicated infrastructure, SSO/SCIM and private AI models." },
];

/* -----------------------------------------------------------------
 * UI COMPONENTS
 * --------------------------------------------------------------- */

function Toggle({ annual, setAnnual }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-surface p-1" data-testid="pricing-toggle">
      {["Monthly", "Annual"].map((label, i) => {
        const active = (i === 1) === annual;
        return (
          <button
            key={label}
            onClick={() => setAnnual(i === 1)}
            data-testid={`pricing-toggle-${label.toLowerCase()}`}
            className="relative rounded-full px-4 py-1.5 text-sm font-medium"
          >
            {active && (
              <motion.span layoutId="toggle-pill" className="absolute inset-0 rounded-full bg-trusted" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
            )}
            <span className={cn("relative z-10 transition-colors", active ? "text-black" : "text-slate-400")}>{label}</span>
          </button>
        );
      })}
      <span className="pr-3 font-mono text-[11px] uppercase tracking-wider text-trusted">Save 17%</span>
    </div>
  );
}

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        data-testid="faq-toggle"
      >
        <span className="font-heading text-base font-semibold text-white md:text-lg">{item.q}</span>
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-trusted transition-transform", open && "rotate-45")}>
          <Plus size={15} strokeWidth={2} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-10 text-sm leading-relaxed text-slate-400">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Cell({ value }) {
  if (value === true)  return <Check size={17} strokeWidth={2.2} className="mx-auto text-trusted" />;
  if (value === false) return <Minus size={16} strokeWidth={2}   className="mx-auto text-slate-600" />;
  if (value === "Add-on")
    return <span className="rounded-full border border-review/30 bg-review/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-review">Add-on</span>;
  return <span className="text-sm text-slate-300">{value}</span>;
}

function ModuleCell({ value }) {
  if (value === "Included")
    return <span className="inline-flex items-center gap-1 rounded-full border border-trusted/30 bg-trusted/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-trusted"><Check size={10} strokeWidth={2.5} />Included</span>;
  if (value === "—")
    return <Minus size={14} strokeWidth={2} className="mx-auto text-slate-700" />;
  return <span className="font-mono text-[12px] tabular-nums text-white">{value}</span>;
}

function PriceDisplay({ tier, annual }) {
  if (tier.custom) {
    return (
      <div className="mt-6">
        <span className="font-heading text-4xl font-extrabold text-white">Custom</span>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-slate-500">Volume-based pricing</p>
      </div>
    );
  }

  const value = annual ? tier.annual : tier.monthly;
  const period = annual ? "/yr" : "/mo";
  const formatted =
    value === 0
      ? "$0"
      : `$${Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2)}`;

  return (
    <div className="mt-6">
      <div className="flex items-end gap-1.5">
        <span className="font-heading text-5xl font-extrabold tracking-tight text-white">
          <AnimatePresence mode="wait">
            <motion.span
              key={annual ? "a" : "m"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="inline-block tabular-nums"
            >
              {formatted}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="mb-1.5 font-mono text-xs text-slate-500">{period}</span>
      </div>
      {annual && tier.annualBadge && (
        <span className="mt-2 inline-block rounded-full border border-trusted/30 bg-trusted/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-trusted">
          {tier.annualBadge}
        </span>
      )}
    </div>
  );
}

function FeatureGroup({ group }) {
  const Icon = group.icon;
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-md border border-trusted/30 bg-trusted/10">
          <Icon size={11} strokeWidth={2} className="text-trusted" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">{group.title}</span>
      </div>
      <ul className="mt-3 space-y-2">
        {group.items.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-300">
            <Check size={14} strokeWidth={2.2} className="mt-[3px] shrink-0 text-trusted" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TierCard({ tier, annual }) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl border bg-surface p-7",
        tier.highlight ? "beam-border border-trusted/40" : "border-white/10"
      )}
      data-testid={`pricing-card-${tier.id}`}
    >
      {tier.highlight && (
        <div className="absolute right-5 top-5">
          <StatusBadge tone="secure">Most popular</StatusBadge>
        </div>
      )}

      <h3 className="font-heading text-2xl font-extrabold text-white">{tier.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{tier.blurb}</p>

      <PriceDisplay tier={tier} annual={annual} />

      <Btn
        to={tier.to}
        variant={tier.highlight ? "primary" : "outline"}
        size="md"
        className="mt-6 w-full"
        data-testid={`pricing-cta-${tier.id}`}
      >
        {tier.cta} <ArrowRight size={15} strokeWidth={2} />
      </Btn>

      {tier.inherits && (
        <div className="mt-6 rounded-lg border border-trusted/20 bg-trusted/[0.05] px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-trusted">
            Everything in {tier.inherits}, plus
          </span>
        </div>
      )}

      {/* Feature groups */}
      <div className="mt-6 space-y-6 border-t border-white/8 pt-6">
        {tier.groups.map((g) => <FeatureGroup key={g.title} group={g} />)}
      </div>

      {/* Premium modules included badge (Growth) */}
      {tier.premiumIncluded && (
        <div className="mt-6 rounded-xl border border-trusted/25 bg-trusted/[0.04] p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-trusted">
            Included premium modules
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {tier.premiumIncluded.map((m) => (
              <li key={m} className="flex items-center gap-1.5 text-[12px] text-slate-200">
                <Check size={12} strokeWidth={2.5} className="text-trusted" /> {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Limits */}
      <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">Limits</div>
        <ul className="mt-3 space-y-1.5">
          {tier.limits.map((l) => (
            <li key={l} className="flex items-center justify-between gap-2 text-[12px] text-slate-300">
              <span className="text-slate-400">{l.split(/\s(.+)/)[1] || ""}</span>
              <span className="font-mono tabular-nums text-white">{l.split(/\s(.+)/)[0]}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Not Included (Starter) */}
      {tier.notIncluded && (
        <div className="mt-6 border-t border-white/8 pt-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Not included</div>
          <ul className="mt-3 space-y-1.5">
            {tier.notIncluded.map((n) => (
              <li key={n} className="flex items-start gap-2 text-[12px] text-slate-500">
                <Minus size={12} strokeWidth={2} className="mt-[5px] shrink-0 text-slate-600" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* -----------------------------------------------------------------
 * PAGE
 * --------------------------------------------------------------- */

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <div data-testid="page-pricing">
      {/* HERO */}
      <section className="relative overflow-hidden pt-32 pb-12 md:pt-40 md:pb-16">
        <AmbientBackdrop />
        <Container className="relative text-center">
          <Reveal><Eyebrow>PoH Intelligence Pricing</Eyebrow></Reveal>
          <Reveal delay={0.06}>
            <h1 className="mx-auto mt-6 max-w-3xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Traffic Intelligence. Trust Intelligence.{" "}
              <span className="text-gradient animate-gradient-x">Revenue Protection.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
              Start free. Scale to enterprise. Every plan includes real-time scoring with explainable
              reason codes — and every upgrade unlocks deeper signal, not paywalled basics.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-9 flex justify-center">
              <Toggle annual={annual} setAnnual={setAnnual} />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* TIERS */}
      <section className="pb-24 md:pb-28">
        <Container>
          <Stagger className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {TIERS.map((t) => (
              <Item key={t.id}>
                <TierCard tier={t} annual={annual} />
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* PREMIUM MODULES */}
      <section className="border-y border-white/8 bg-[#0A0B0D] py-24 md:py-28">
        <Container>
          <SectionHeading
            eyebrow="Premium Modules"
            title="Buy what you need, when you need it"
            blurb="Modules can be added à la carte to Pro, or come bundled with Growth and Enterprise. Mix and match to build the exact intelligence stack your team runs on."
          />
          <Reveal delay={0.1}>
            <div className="mt-12 overflow-x-auto rounded-2xl border border-white/10 bg-surface">
              <table className="w-full min-w-[720px] border-collapse" data-testid="premium-modules-table">
                <thead>
                  <tr className="border-b border-white/10 bg-black/30">
                    <th className="px-5 py-4 text-left font-mono text-[11px] uppercase tracking-wider text-slate-500">Module</th>
                    {TIERS.map((t) => (
                      <th key={t.id} className="px-4 py-4 text-center font-heading text-sm font-bold text-white">{t.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((row) => (
                    <tr key={row.name} className="border-b border-white/8 transition-colors hover:bg-white/[0.02]">
                      <td className="px-5 py-4 text-sm font-medium text-slate-200">{row.name}</td>
                      <td className="px-4 py-4 text-center"><ModuleCell value={row.starter} /></td>
                      <td className="px-4 py-4 text-center"><ModuleCell value={row.pro} /></td>
                      <td className="px-4 py-4 text-center"><ModuleCell value={row.growth} /></td>
                      <td className="px-4 py-4 text-center"><ModuleCell value={row.enterprise} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* REVENUE EXPANSION JOURNEY */}
      <section className="py-24 md:py-28">
        <Container>
          <SectionHeading
            eyebrow="Revenue Expansion Potential"
            title="A pricing model that grows with you"
            blurb="From a free starter workspace to dedicated enterprise infrastructure, PoH creates clear upgrade paths and high-margin expansion at every stage of the journey."
          />

          <Reveal delay={0.1}>
            <div className="mt-12 overflow-x-auto">
              <div className="flex min-w-[860px] items-stretch gap-3 pb-4">
                {JOURNEY.map((step, i) => (
                  <div key={step.tier} className="flex items-stretch gap-3">
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "relative w-[220px] shrink-0 rounded-xl border p-4",
                        TONE_CLS[step.tone],
                      )}
                    >
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-80">
                        Step {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="mt-2 font-heading text-sm font-bold text-white">{step.tier}</div>
                      <div className="mt-3 font-mono text-[15px] font-bold tabular-nums text-white">{step.price}</div>
                      <div className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{step.note}</div>
                    </motion.div>
                    {i < JOURNEY.length - 1 && (
                      <div className="flex items-center">
                        <ArrowRight size={16} strokeWidth={2} className="text-slate-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mx-auto mt-10 max-w-3xl text-center text-sm leading-relaxed text-slate-400 md:text-base">
              This structure positions PoH Intelligence as a{" "}
              <span className="text-trusted">Traffic Intelligence + Trust Intelligence + Revenue Protection</span>{" "}
              platform — not just another bot-detection or fraud-prevention product — with clear upgrade
              paths and multiple high-margin expansion opportunities.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* COMPARISON */}
      <section className="border-y border-white/8 bg-[#0A0B0D] py-24 md:py-28">
        <Container>
          <SectionHeading eyebrow="Compare" title="Every detail, side by side" />
          <Reveal delay={0.1}>
            <div className="mt-12 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-4 text-left font-mono text-[11px] uppercase tracking-wider text-slate-500">Feature</th>
                    {TIERS.map((t) => (
                      <th key={t.id} className="px-4 py-4 text-center font-heading text-sm font-bold text-white">{t.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((row) => (
                    <tr key={row.label} className="border-b border-white/8 transition-colors hover:bg-white/[0.02]">
                      <td className="py-4 text-sm text-slate-300">{row.label}</td>
                      {row.v.map((val, i) => (
                        <td key={i} className="px-4 py-4 text-center"><Cell value={val} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-32">
        <Container className="max-w-3xl">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" />
          <div className="mt-12">
            {FAQ.map((item) => <FaqItem key={item.q} item={item} />)}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-28">
        <Container>
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl border border-trusted/30 bg-gradient-to-br from-trusted/[0.08] via-surface to-surface p-10 md:p-14 text-center">
              <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(60% 60% at 50% 0%, rgba(45,212,191,0.18), transparent 70%)" }} />
              <div className="relative">
                <Eyebrow>Ready when you are</Eyebrow>
                <h2 className="mx-auto mt-5 max-w-2xl font-heading text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
                  Spin up a free workspace in under 60 seconds
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400 md:text-base">
                  No credit card. Real-time scoring on your real traffic, with explainable verdicts from session one.
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Btn to="/register" variant="primary" size="lg" data-testid="pricing-final-cta-primary">
                    Start free <ArrowRight size={16} strokeWidth={2} />
                  </Btn>
                  <Btn to="/support" variant="outline" size="lg" data-testid="pricing-final-cta-secondary">
                    Talk to sales <Building2 size={15} strokeWidth={2} />
                  </Btn>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
