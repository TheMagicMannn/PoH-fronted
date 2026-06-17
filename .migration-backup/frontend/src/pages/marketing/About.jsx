import { Target, Zap, Eye, Network, ShieldCheck, Globe2 } from "lucide-react";
import {
  Container, Reveal, Stagger, Item, Counter, Eyebrow, SectionHeading, AmbientBackdrop, Btn,
} from "@/components/marketing/primitives";

const VALUES = [
  { icon: Eye, t: "Transparency", d: "No black-box scores. Every verdict ships with the exact reason codes and confidence behind it." },
  { icon: Zap, t: "Speed", d: "Fraud happens in milliseconds. So do we — sub-25ms scoring on every session and conversion." },
  { icon: Target, t: "Accuracy", d: "Layered evidence over blunt heuristics. We optimize to protect real users, not just block traffic." },
];

const MILESTONES = [
  { y: "2024", t: "The thesis", d: "Founded after watching seven-figure ad budgets bleed into invalid traffic that analytics counted as 'success'." },
  { y: "2025", t: "Scoring engine v1", d: "Shipped the layered-evidence model and poh.js SDK — explainable, real-time, privacy-safe." },
  { y: "2025", t: "Action layer", d: "Launched rules, sensitivity profiles and conversion suppression so teams could act, not just observe." },
  { y: "2026", t: "Trust network", d: "Began building privacy-safe, cross-customer fraud intelligence — a shared immune system for paid traffic." },
];

const STATS = [
  { to: 4.8, suffix: "B", decimals: 1, label: "Sessions scored" },
  { to: 1.2, prefix: "$", suffix: "B", decimals: 1, label: "Ad spend protected" },
  { to: 38, suffix: "%", decimals: 0, label: "Avg junk-lead reduction" },
  { to: 120, suffix: "+", decimals: 0, label: "Reason codes & signals" },
];

const TEAM = [
  { n: "Avery Chen", r: "Co-founder & CEO", c: "from-trusted/30 to-trusted/5" },
  { n: "Marcus Vale", r: "Co-founder & CTO", c: "from-review/30 to-review/5" },
  { n: "Lena Okafor", r: "VP Engineering", c: "from-suspicious/30 to-suspicious/5" },
  { n: "Diego Santos", r: "Head of Data Science", c: "from-fraudulent/30 to-fraudulent/5" },
];

export default function About() {
  return (
    <div data-testid="page-about">
      {/* HERO */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
        <AmbientBackdrop />
        <Container className="relative text-center">
          <Reveal><Eyebrow>Our mission</Eyebrow></Reveal>
          <Reveal delay={0.06}>
            <h1 className="mx-auto mt-6 max-w-4xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Restoring <span className="text-gradient animate-gradient-x">trust</span> to the internet
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
              The open web runs on advertising — and advertising is being quietly drained by fraud. We're building the
              trust intelligence layer that makes every click, session and conversion accountable.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* STORY */}
      <section className="py-20 md:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="space-y-5">
              <Reveal><Eyebrow>The story</Eyebrow></Reveal>
              <Reveal delay={0.05}>
                <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  We were tired of paying for traffic that wasn't real
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-base leading-relaxed text-slate-400">
                  PoH started with a simple, uncomfortable observation: the dashboards everyone trusts count bots,
                  click farms and headless browsers exactly the same as real customers. Budgets grew, "conversions"
                  climbed, and pipelines filled with junk — all while the numbers looked great.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <p className="text-base leading-relaxed text-slate-400">
                  So we built the layer that's been missing: a real-time, explainable engine that scores the trust of
                  every session and conversion, links fraud back to the campaigns that caused it, and gives teams the
                  controls to act. No black boxes. No guesswork. Just evidence.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="pt-2"><Btn to="/products" variant="outline" size="md" data-testid="about-cta-products">See the platform</Btn></div>
              </Reveal>
            </div>

            <Reveal delay={0.12} y={40}>
              <div className="relative overflow-hidden rounded-2xl border border-white/10">
                <img
                  src="https://images.pexels.com/photos/4963417/pexels-photo-4963417.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                  alt="The PoH team building trust intelligence"
                  className="h-[420px] w-full object-cover opacity-80 transition-all duration-700 hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-trusted">est. 2024 · remote-first</div>
                  <div className="mt-1 font-heading text-lg font-bold text-white">A team obsessed with traffic forensics</div>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* STATS */}
      <section className="border-y border-white/8 bg-[#0A0B0D] py-16">
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

      {/* VALUES */}
      <section className="py-24 md:py-32">
        <Container>
          <SectionHeading eyebrow="What we believe" title="Principles we score ourselves against" />
          <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
            {VALUES.map((v) => (
              <Item key={v.t}>
                <div className="h-full rounded-2xl border border-white/10 bg-surface p-8 transition-colors hover:border-trusted/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-trusted/30 bg-trusted/10">
                    <v.icon size={22} strokeWidth={1.6} className="text-trusted" />
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-bold text-white">{v.t}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{v.d}</p>
                </div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* TIMELINE */}
      <section className="border-y border-white/8 bg-[#0A0B0D] py-24 md:py-32">
        <Container>
          <SectionHeading eyebrow="Journey" title="How we got here" />
          <div className="mt-16 grid gap-px md:grid-cols-4">
            <Stagger className="contents">
              {MILESTONES.map((m, i) => (
                <Item key={i}>
                  <div className="relative px-6 md:px-4">
                    <div className="absolute left-0 top-2 h-px w-full bg-white/8 md:block" />
                    <div className="relative h-3 w-3 rounded-full bg-trusted shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
                    <div className="mt-5 font-mono text-sm text-trusted">{m.y}</div>
                    <h3 className="mt-1 font-heading text-base font-bold text-white">{m.t}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{m.d}</p>
                  </div>
                </Item>
              ))}
            </Stagger>
          </div>
        </Container>
      </section>

      {/* TRUST NETWORK VISION */}
      <section className="py-24 md:py-32">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface p-8 md:p-14">
            <div className="absolute inset-0 bg-grid-fine opacity-30" />
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-trusted/10 blur-[100px]" />
            <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <Eyebrow>The vision</Eyebrow>
                <h2 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  A shared immune system for paid traffic
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-400">
                  Fraud rings don't attack one advertiser — they attack everyone. We're building a privacy-safe trust
                  network where abstracted fraud signals strengthen every customer's defenses without ever sharing
                  personal data. The more traffic we score, the smarter everyone's protection becomes.
                </p>
              </div>
              <Stagger className="grid gap-4">
                {[
                  { icon: Network, t: "Fraud memory graph", d: "Abstracted fingerprint recurrence across the network." },
                  { icon: Globe2, t: "Reputation feeds", d: "Shared, anonymized threat intelligence in real time." },
                  { icon: ShieldCheck, t: "Trust API", d: "Programmatic verdicts for any surface you own." },
                ].map((x) => (
                  <Item key={x.t}>
                    <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-ink/40 p-5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-trusted/30 bg-trusted/10">
                        <x.icon size={18} strokeWidth={1.6} className="text-trusted" />
                      </span>
                      <div>
                        <div className="font-heading text-base font-bold text-white">{x.t}</div>
                        <div className="mt-1 text-sm text-slate-400">{x.d}</div>
                      </div>
                    </div>
                  </Item>
                ))}
              </Stagger>
            </div>
          </div>
        </Container>
      </section>

      {/* TEAM */}
      <section className="border-t border-white/8 bg-[#0A0B0D] py-24 md:py-32">
        <Container>
          <SectionHeading eyebrow="The team" title="Builders, not just blockers" />
          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((p) => (
              <Item key={p.n}>
                <div className="group rounded-2xl border border-white/10 bg-surface p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-trusted/30">
                  <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br ${p.c} font-heading text-2xl font-extrabold text-white`}>
                    {p.n.split(" ").map((w) => w[0]).join("")}
                  </div>
                  <div className="mt-4 font-heading text-base font-bold text-white">{p.n}</div>
                  <div className="mt-1 font-mono text-[11px] text-slate-500">{p.r}</div>
                </div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>
    </div>
  );
}
