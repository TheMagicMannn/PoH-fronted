import {
  Activity, Crosshair, ScanLine, ShieldCheck, Search, Network, Fingerprint, Bot,
  Gauge, Workflow, ArrowRight, Eye, Flag, AlertTriangle, Ban, Code2, ServerCog, Layers,
} from "lucide-react";
import {
  Container, Reveal, Stagger, Item, Eyebrow, SectionHeading, AmbientBackdrop, Btn, StatusBadge,
} from "@/components/marketing/primitives";

const FLOW = [
  { icon: Code2, t: "poh.js SDK", d: "Lightweight client collects device, network & behavioral signals." },
  { icon: ServerCog, t: "Scoring Engine", d: "Layered-evidence model returns fraud/trust + reason codes in ~23ms." },
  { icon: Layers, t: "Rules & Actions", d: "Sensitivity profiles and custom rules decide the verdict." },
  { icon: Activity, t: "Dashboard & APIs", d: "Verdicts surface in the workspace and sync to your stack." },
];

const MODULES = [
  { icon: Activity, t: "Session Intelligence", d: "A forensic timeline for every visit: trust gauge, confidence, device & behavioral signals, fingerprint recurrence and campaign mapping — with manual trust / review / block overrides.", tone: "secure" },
  { icon: Crosshair, t: "Conversion Authenticity", d: "Score conversions, not just clicks. Detect abnormal click-to-conversion timing and suppress fake or incentivized leads before they reach your CRM or ad pixel.", tone: "review" },
  { icon: ScanLine, t: "Campaign Quality", d: "Aggregate fraud by source, campaign and ad set with quality-mix bars, fraud rate, spend and wasted-spend estimates — so you cut the right line items.", tone: "suspicious" },
  { icon: ShieldCheck, t: "Rules & Automation", d: "Compose if-this-then-that rules over any signal, layered on conservative / balanced / aggressive sensitivity profiles that map scores to observe → flag → review → block.", tone: "secure" },
  { icon: Search, t: "Investigations", d: "Cluster repeated fingerprints into fraud cases, trace coordinated activity across sessions, and track each case from open to resolved.", tone: "fraud" },
  { icon: Network, t: "Integrations", d: "Connect GA4, Google Ads, Meta Ads, HubSpot and webhooks. Push verdicts and suppression signals to the tools your team already uses.", tone: "review" },
];

const SIGNALS = [
  { icon: Bot, t: "Automation & Headless", d: "WebDriver flags, headless signatures, automation framework fingerprints (Puppeteer, Playwright, Phantom)." },
  { icon: Fingerprint, t: "Device Fingerprint", d: "Canvas, hardware concurrency, plugins, language preferences and fingerprint recurrence across sessions." },
  { icon: Network, t: "Network Origin", d: "Proxy, VPN, Tor and datacenter / hosting IP detection via real-time threat intelligence (IPQS)." },
  { icon: Gauge, t: "Behavioral Depth", d: "Mouse, scroll & keyboard interaction depth, time-on-page and instant-bounce timing analysis." },
];

const ACTIONS = [
  { icon: Eye, t: "Observe", d: "Log and monitor — no interference.", tone: "muted" },
  { icon: Flag, t: "Flag", d: "Mark for awareness and reporting.", tone: "suspicious" },
  { icon: AlertTriangle, t: "Review", d: "Route to a human queue for a decision.", tone: "review" },
  { icon: Ban, t: "Block", d: "Suppress conversions or block traffic.", tone: "fraud" },
];

const REASON_CODES = [
  "browser_automation_detected", "headless_browser_indicators", "datacenter_ip_origin",
  "vpn_usage", "tor_exit_node", "proxy_detected", "low_human_interaction_depth",
  "instant_bounce_timing", "repeated_fingerprint_short_window", "abnormal_click_to_conversion_timing",
  "missing_browser_plugins", "anomalous_hardware_profile",
];

const TONE_TEXT = { secure: "text-trusted", suspicious: "text-suspicious", fraud: "text-fraudulent", review: "text-review", muted: "text-slate-300" };

function CodeBlock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B0D0F]">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-fraudulent/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-suspicious/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-trusted/70" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">index.html</span>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-slate-300">
<span className="text-slate-600">{"<!-- Drop in once. Score everything. -->"}</span>{"\n"}
<span className="text-slate-500">{"<script"}</span>{"\n"}
{"  "}<span className="text-trusted">src</span>=<span className="text-suspicious">{'"https://cdn.poh.io/poh.js"'}</span>{"\n"}
{"  "}<span className="text-trusted">data-key</span>=<span className="text-suspicious">{'"poh_live_xxxxxxxx"'}</span>{"\n"}
<span className="text-slate-500">{"  async></script>"}</span>{"\n\n"}
<span className="text-slate-600">{"// Track a conversion"}</span>{"\n"}
<span className="text-review">poh</span>.<span className="text-trusted">convert</span>(<span className="text-suspicious">{'"signup"'}</span>, {"{ value: "}<span className="text-white">49</span>{", currency: "}<span className="text-suspicious">{'"USD"'}</span>{" });"}
      </pre>
    </div>
  );
}

export default function Products() {
  return (
    <div data-testid="page-products">
      {/* HERO */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
        <AmbientBackdrop />
        <Container className="relative text-center">
          <Reveal><Eyebrow>The platform</Eyebrow></Reveal>
          <Reveal delay={0.06}>
            <h1 className="mx-auto mt-6 max-w-4xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Deep intelligence. <span className="text-gradient animate-gradient-x">Real-time action.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
              PoH turns raw traffic signals into explainable verdicts and automated actions — across sessions,
              conversions and campaigns. Here is everything inside the workspace.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-8 flex justify-center gap-3">
              <Btn to="/register" variant="primary" size="lg" data-testid="products-cta-register">Start free</Btn>
              <Btn to="/pricing" variant="outline" size="lg" data-testid="products-cta-pricing">View pricing</Btn>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* DATA FLOW */}
      <section className="border-y border-white/8 bg-[#0A0B0D] py-20">
        <Container>
          <SectionHeading eyebrow="Architecture" title="How a session becomes a verdict" center />
          <Stagger className="mt-14 grid gap-5 md:grid-cols-4">
            {FLOW.map((f, i) => (
              <Item key={f.t}>
                <div className="relative h-full rounded-2xl border border-white/10 bg-surface p-6">
                  {i < 3 && <ArrowRight size={18} className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-trusted/50 md:block" />}
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-trusted/30 bg-trusted/10">
                    <f.icon size={20} strokeWidth={1.6} className="text-trusted" />
                  </div>
                  <div className="mt-4 font-mono text-[10px] text-slate-500">STAGE {i + 1}</div>
                  <h3 className="mt-1 font-heading text-base font-bold text-white">{f.t}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{f.d}</p>
                </div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* SDK */}
      <section className="py-24 md:py-32">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Reveal><Eyebrow>poh.js SDK</Eyebrow></Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  One script. Ten-minute install.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
                  The poh.js client is self-configuring and privacy-safe — it collects device, network and
                  behavioral signals without storing personal data. Add one tag and start scoring every session.
                </p>
              </Reveal>
              <Reveal delay={0.16}>
                <ul className="mt-6 space-y-3">
                  {["No PII collected — GDPR & CCPA friendly", "< 12kb gzipped, async, non-blocking", "Live test session built into onboarding"].map((t) => (
                    <li key={t} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <ShieldCheck size={17} strokeWidth={1.8} className="shrink-0 text-trusted" /> {t}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <Reveal delay={0.12} y={40}><CodeBlock /></Reveal>
          </div>
        </Container>
      </section>

      {/* SIGNALS */}
      <section className="border-y border-white/8 bg-[#0A0B0D] py-24 md:py-32">
        <Container>
          <SectionHeading eyebrow="The signals" title="Evidence, not guesswork" blurb="Every fraud point maps to a human-readable reason code. The score is never a black box." />
          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2">
            {SIGNALS.map((s) => (
              <Item key={s.t}>
                <div className="flex gap-4 rounded-2xl border border-white/10 bg-surface p-6 transition-colors hover:border-trusted/30">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                    <s.icon size={20} strokeWidth={1.6} className="text-trusted" />
                  </span>
                  <div>
                    <h3 className="font-heading text-base font-bold text-white">{s.t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.d}</p>
                  </div>
                </div>
              </Item>
            ))}
          </Stagger>

          <Reveal delay={0.1}>
            <div className="mt-10 rounded-2xl border border-white/10 bg-surface p-7">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">reason code catalog</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {REASON_CODES.map((c) => (
                  <span key={c} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-slate-300 transition-colors hover:border-trusted/30 hover:text-trusted">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* MODULES */}
      <section className="py-24 md:py-32">
        <Container>
          <SectionHeading eyebrow="Modules" title="Everything in the workspace" />
          <Stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <Item key={m.t}>
                <div className="group h-full rounded-2xl border border-white/10 bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:border-trusted/30">
                  <m.icon size={24} strokeWidth={1.6} className={TONE_TEXT[m.tone]} />
                  <h3 className="mt-5 font-heading text-lg font-bold text-white">{m.t}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{m.d}</p>
                </div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* ACTION SPECTRUM */}
      <section className="border-t border-white/8 bg-[#0A0B0D] py-24 md:py-32">
        <Container>
          <SectionHeading eyebrow="Automation" title="From observe to block — your call" blurb="Tune sensitivity to your risk appetite. PoH routes each verdict to the right action, automatically." />
          <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ACTIONS.map((a, i) => (
              <Item key={a.t}>
                <div className="relative h-full rounded-2xl border border-white/10 bg-surface p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                    <a.icon size={22} strokeWidth={1.6} className={TONE_TEXT[a.tone]} />
                  </div>
                  <h3 className="mt-4 font-heading text-base font-bold text-white">{a.t}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{a.d}</p>
                  <div className="mt-3 font-mono text-[10px] text-slate-600">escalation {i + 1}/4</div>
                </div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>
    </div>
  );
}
