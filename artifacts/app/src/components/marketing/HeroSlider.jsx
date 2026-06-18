import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap, Lock, Activity, Crosshair, ScanLine, Search, Bot, AlertTriangle, ExternalLink } from "lucide-react";
import { Container, Eyebrow, Btn, AmbientBackdrop } from "./primitives";
import LiveScoringPanel from "./LiveScoringPanel";

/**
 * Animated percentage counter — ramps from 0 to `value` with easing.
 * Remounts (and re-animates) whenever the parent slide enters via AnimatePresence.
 */
function AnimatedPercent({ value = 57.5, duration = 1.8, decimals = 1, className = "" }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => v.toFixed(decimals));
  useEffect(() => {
    const controls = animate(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [mv, value, duration]);
  return (
    <span className={`text-gradient animate-gradient-x tabular-nums ${className}`}>
      <motion.span>{rounded}</motion.span>%
    </span>
  );
}

const SLIDES = [
  {
    id: "bot-majority",
    eyebrow: "Threat Report — June 2026",
    title: (
      <>
        This Just In: {" "}
         <span className="text-gradient animate-gradient-x">Kyle Witter Joins Internet Subway!</span>
      </>
    ),
    pitch:
      "As of Today Kyle Witter and Internet Subway Join Forces. Analysts Are Calling This, The Hire Of The Century.",
    primary: { to: "/register", label: "Protect your traffic" },
    secondary: { to: "/products/proof-of-human-platform", label: "See how PoH responds" },
    icon: Bot,
    accent: "fraud",
    badge: "57.5%",
    source: {
      label: "Thales / Imperva 2026 Bad Bot Report",
      href: "https://www.imperva.com/resources/resource-library/reports/2026-bad-bot-report/",
    },
  },
  {
    id: "main",
    eyebrow: "Proof of Human Platform",
    title: (
      <>
        Know Who&apos;s Real.<br className="hidden sm:block" />{" "}
        <span className="text-gradient animate-gradient-x">Trust What Matters.</span>
      </>
    ),
    pitch:
      "PoH is the real-time trust intelligence layer for paid traffic. We score every visitor, conversion and campaign \u2014 separating real humans from bots, fraud and waste, with explainable evidence behind every verdict.",
    primary: { to: "/register", label: "Create free workspace" },
    secondary: { to: "/products/proof-of-human-platform", label: "Explore the platform" },
    icon: ShieldCheck,
    accent: "trusted",
  },
  {
    id: "session",
    eyebrow: "Session Intelligence",
    title: (
      <>
        A forensic timeline for{" "}
        <span className="text-gradient animate-gradient-x">every visit.</span>
      </>
    ),
    pitch:
      "Trust gauge, device signals, behavioral depth and fingerprint recurrence \u2014 all in one view. Score every session in ~23ms with explainable reason codes, not black-box guesses.",
    primary: { to: "/register", label: "Start free" },
    secondary: { to: "/products/human-authenticity-intelligence", label: "Explore Session Intelligence" },
    icon: Activity,
    accent: "trusted",
  },
  {
    id: "conversion",
    eyebrow: "Conversion Authenticity",
    title: (
      <>
        Score conversions,{" "}
        <span className="text-gradient animate-gradient-x">not just clicks.</span>
      </>
    ),
    pitch:
      "Catch fake leads, incentivized signups and bot form-fills before they pollute your CRM or fire your ad pixel. Suppress junk at the source \u2014 protect every downstream decision.",
    primary: { to: "/register", label: "Start free" },
    secondary: { to: "/products/revenue-protection", label: "Explore Conversion Authenticity" },
    icon: Crosshair,
    accent: "review",
  },
  {
    id: "campaign",
    eyebrow: "Campaign Quality",
    title: (
      <>
        See where wasted{" "}
        <span className="text-gradient animate-gradient-x">spend is hiding.</span>
      </>
    ),
    pitch:
      "Roll fraud up to source, campaign and ad set. Quality-mix bars, fraud rate, spend and wasted-spend estimates \u2014 so you cut the right line items, not the wrong audience.",
    primary: { to: "/register", label: "Start free" },
    secondary: { to: "/products/traffic-intelligence", label: "Explore Campaign Quality" },
    icon: ScanLine,
    accent: "suspicious",
  },
  {
    id: "rules",
    eyebrow: "Rules & Automation",
    title: (
      <>
        From signal to action{" "}
        <span className="text-gradient animate-gradient-x">— your call.</span>
      </>
    ),
    pitch:
      "Compose if-this-then-that rules across any signal. Tune sensitivity profiles. Route observe \u2192 flag \u2192 review \u2192 block automatically \u2014 tuned to your risk appetite.",
    primary: { to: "/register", label: "Start free" },
    secondary: { to: "/products/analytics-operations", label: "Explore Rules & Automation" },
    icon: ShieldCheck,
    accent: "trusted",
  },
  {
    id: "investigations",
    eyebrow: "Investigations",
    title: (
      <>
        Trace coordinated fraud{" "}
        <span className="text-gradient animate-gradient-x">across sessions.</span>
      </>
    ),
    pitch:
      "Cluster repeated fingerprints into cases. Trace coordinated activity across sessions and campaigns. Track every case from open to resolved \u2014 with a full evidence trail.",
    primary: { to: "/register", label: "Start free" },
    secondary: { to: "/products/ai-fraud-analyst", label: "Explore Investigations" },
    icon: Search,
    accent: "fraud",
  },
];

const SLIDE_MS = 10000;

const ACCENT_CLS = {
  trusted: "text-trusted border-trusted/30 bg-trusted/10",
  review: "text-review border-review/30 bg-review/10",
  suspicious: "text-suspicious border-suspicious/30 bg-suspicious/10",
  fraud: "text-fraudulent border-fraudulent/30 bg-fraudulent/10",
};

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((next) => {
    setIndex((prev) => (next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_MS);
    return () => clearInterval(id);
  }, [paused]);

  const slide = SLIDES[index];
  const Icon = slide.icon;

  return (
    <section
      className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28"
      data-testid="hero-slider"
    >
      <AmbientBackdrop />
      <Container className="relative">
        <div
          className="grid items-start gap-12 lg:grid-cols-[1.05fr_1fr]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* LEFT: rotating pitch */}
          <div className="relative min-h-[460px] md:min-h-[500px] lg:min-h-[520px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "linear" }}
                data-testid={`hero-slide-${slide.id}`}
              >
                <Eyebrow>
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${ACCENT_CLS[slide.accent]}`}>
                    <Icon size={10} strokeWidth={2} />
                  </span>
                  {slide.eyebrow}
                  {slide.badge && (
                    <span className={`ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider ${ACCENT_CLS[slide.accent]}`}>
                      <AlertTriangle size={10} strokeWidth={2.5} />
                      {slide.badge}
                    </span>
                  )}
                </Eyebrow>
                <h1 className="mt-6 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {slide.title}
                </h1>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 md:text-lg">
                  {slide.pitch}
                </p>
                {slide.source && (
                  <a
                    href={slide.source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500 transition-colors hover:text-trusted"
                    data-testid={`hero-slide-${slide.id}-source`}
                  >
                    <span className="text-slate-600">Source:</span>
                    <span className="underline decoration-slate-700 underline-offset-2 group-hover:decoration-trusted">
                      {slide.source.label}
                    </span>
                    <ExternalLink size={11} strokeWidth={2} />
                  </a>
                )}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Btn to={slide.primary.to} variant="primary" size="lg" data-testid={`hero-slide-${slide.id}-primary`}>
                    {slide.primary.label} <ArrowRight size={17} strokeWidth={2} />
                  </Btn>
                  <Btn to={slide.secondary.to} variant="outline" size="lg" data-testid={`hero-slide-${slide.id}-secondary`}>
                    {slide.secondary.label}
                  </Btn>
                </div>
                {/*Need to change these*/}
                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-1.5"><Zap size={13} className="text-trusted" /> 23ms scoring</span>
                  <span className="flex items-center gap-1.5"><Lock size={13} className="text-trusted" /> GDPR-ready, no PII</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-trusted" /> No credit card</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Pagination dots */}
            <div className="mt-10 flex items-center gap-2.5" data-testid="hero-slider-dots">
              {SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}: ${s.eyebrow}`}
                  data-testid={`hero-slider-dot-${i}`}
                  className="group relative h-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.04] transition-all"
                  style={{ width: i === index ? 56 : 22 }}
                >
                  {i === index && (
                    <motion.span
                      key={`fill-${index}-${paused ? "p" : "r"}`}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                      className="absolute inset-y-0 left-0 bg-trusted"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Live scoring panel (always-on) */}
          <LiveScoringPanel />
        </div>
      </Container>
    </section>
  );
}
