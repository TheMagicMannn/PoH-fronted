import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus, ArrowRight, Plus } from "lucide-react";
import {
  Container, Reveal, Stagger, Item, Eyebrow, SectionHeading, AmbientBackdrop, Btn, StatusBadge,
} from "@/components/marketing/primitives";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    name: "Starter",
    blurb: "For founders and small teams validating their paid channels.",
    monthly: 0,
    annual: 0,
    custom: false,
    cta: "Start free",
    to: "/register",
    highlight: false,
    features: ["Up to 25k sessions / mo", "Real-time human vs bot scoring", "1 workspace · 2 seats", "Session & conversion views", "Email support"],
  },
  {
    name: "Growth",
    blurb: "For performance teams & agencies scaling paid acquisition.",
    monthly: 249,
    annual: 199,
    custom: false,
    cta: "Start 14-day trial",
    to: "/register",
    highlight: true,
    features: ["Up to 1M sessions / mo", "Conversion authenticity + suppression", "Campaign quality & wasted-spend reports", "Rules engine + sensitivity profiles", "GA4 / Google Ads / Meta integrations", "5 workspaces · 15 seats", "Priority support"],
  },
  {
    name: "Enterprise",
    blurb: "For high-volume advertisers needing custom scale & controls.",
    monthly: null,
    annual: null,
    custom: true,
    cta: "Talk to sales",
    to: "/support",
    highlight: false,
    features: ["Unlimited sessions", "Investigations & fraud clustering", "SSO, audit logs & roles", "Custom rules & SLA", "Dedicated success manager", "Trust API & webhooks", "White-label agency reporting"],
  },
];

const COMPARE = [
  { label: "Sessions / month", v: ["25k", "1M", "Unlimited"] },
  { label: "Real-time scoring", v: [true, true, true] },
  { label: "Reason codes & confidence", v: [true, true, true] },
  { label: "Conversion suppression", v: [false, true, true] },
  { label: "Campaign quality reports", v: [false, true, true] },
  { label: "Rules engine", v: ["Basic", "Advanced", "Custom"] },
  { label: "Investigations", v: [false, false, true] },
  { label: "Integrations", v: ["1", "All", "All + custom"] },
  { label: "SSO & audit logs", v: [false, false, true] },
  { label: "Trust API", v: [false, false, true] },
  { label: "Support", v: ["Email", "Priority", "Dedicated"] },
];

const FAQ = [
  { q: "How is a session counted?", a: "A session is a unique visit scored by poh.js within a 30-minute activity window. Repeated events from the same session do not count again. Conversions are included at no extra charge." },
  { q: "Do you need to collect personal data (PII)?", a: "No. PoH scores device, network and behavioral signals only — never names, emails or form values. The platform is built to be GDPR and CCPA friendly out of the box." },
  { q: "Can I block invalid traffic on my ad platforms?", a: "Yes. On Growth and above, PoH syncs verdicts and suppression signals to supported ad platforms and CRMs, and streams events to webhooks so you can act anywhere." },
  { q: "What happens if I exceed my session limit?", a: "We never stop scoring your traffic. You'll get a heads-up as you approach your limit and can upgrade anytime — overages are billed transparently, never silently." },
  { q: "Is there a free trial?", a: "Starter is free forever. Growth includes a 14-day full-feature trial with no credit card required. Cancel anytime." },
];

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
      <span className="pr-3 font-mono text-[11px] uppercase tracking-wider text-trusted">Save 20%</span>
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
  if (value === true) return <Check size={17} strokeWidth={2.2} className="mx-auto text-trusted" />;
  if (value === false) return <Minus size={16} strokeWidth={2} className="mx-auto text-slate-600" />;
  return <span className="text-sm text-slate-300">{value}</span>;
}

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  return (
    <div data-testid="page-pricing">
      {/* HERO */}
      <section className="relative overflow-hidden pt-32 pb-12 md:pt-40 md:pb-16">
        <AmbientBackdrop />
        <Container className="relative text-center">
          <Reveal><Eyebrow>Pricing</Eyebrow></Reveal>
          <Reveal delay={0.06}>
            <h1 className="mx-auto mt-6 max-w-3xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Pricing built for <span className="text-gradient animate-gradient-x">scale</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400 md:text-lg">
              Start free. Upgrade when fraud starts costing you. Every plan includes real-time scoring and
              explainable reason codes.
            </p>
          </Reveal>
          <Reveal delay={0.18}><div className="mt-9 flex justify-center"><Toggle annual={annual} setAnnual={setAnnual} /></div></Reveal>
        </Container>
      </section>

      {/* TIERS */}
      <section className="pb-24 md:pb-28">
        <Container>
          <Stagger className="grid gap-6 lg:grid-cols-3">
            {TIERS.map((t) => (
              <Item key={t.name}>
                <div className={cn(
                  "relative flex h-full flex-col overflow-hidden rounded-2xl border bg-surface p-8",
                  t.highlight ? "beam-border border-trusted/40" : "border-white/10"
                )}>
                  {t.highlight && <div className="absolute right-5 top-5"><StatusBadge tone="secure">Most popular</StatusBadge></div>}
                  <h3 className="font-heading text-xl font-extrabold text-white">{t.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{t.blurb}</p>

                  <div className="mt-6 flex items-end gap-1.5">
                    {t.custom ? (
                      <span className="font-heading text-4xl font-extrabold text-white">Custom</span>
                    ) : (
                      <>
                        <span className="font-heading text-5xl font-extrabold tracking-tight text-white">
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={annual ? "a" : "m"}
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.25 }}
                              className="inline-block tabular-nums"
                            >
                              ${annual ? t.annual : t.monthly}
                            </motion.span>
                          </AnimatePresence>
                        </span>
                        <span className="mb-1.5 font-mono text-xs text-slate-500">/mo{t.monthly > 0 ? (annual ? ", billed yearly" : "") : ""}</span>
                      </>
                    )}
                  </div>

                  <Btn to={t.to} variant={t.highlight ? "primary" : "outline"} size="md" className="mt-7 w-full" data-testid={`pricing-cta-${t.name.toLowerCase()}`}>
                    {t.cta} <ArrowRight size={15} strokeWidth={2} />
                  </Btn>

                  <ul className="mt-7 space-y-3 border-t border-white/8 pt-6">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <Check size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-trusted" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* COMPARISON */}
      <section className="border-y border-white/8 bg-[#0A0B0D] py-24 md:py-28">
        <Container>
          <SectionHeading eyebrow="Compare" title="Every detail, side by side" />
          <Reveal delay={0.1}>
            <div className="mt-12 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-4 text-left font-mono text-[11px] uppercase tracking-wider text-slate-500">Feature</th>
                    {TIERS.map((t) => (
                      <th key={t.name} className="px-4 py-4 text-center font-heading text-sm font-bold text-white">{t.name}</th>
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
    </div>
  );
}
