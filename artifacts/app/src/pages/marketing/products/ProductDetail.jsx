import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  Container, Reveal, Stagger, Item, Eyebrow, SectionHeading, AmbientBackdrop, Btn, StatusBadge,
} from "@/components/marketing/primitives";
import { PRODUCT_DETAILS } from "./productData";

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

export default function ProductDetail() {
  const { slug } = useParams();
  const data = PRODUCT_DETAILS[slug];

  if (!data) {
    return <Navigate to="/products/proof-of-human-platform" replace />;
  }

  const Icon = data.icon;

  return (
    <div data-testid={`page-product-${slug}`}>
      {/* HERO */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
        <AmbientBackdrop />
        <Container className="relative">
          <Reveal>
            <Link
              to={data.parent.to}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500 hover:text-trusted"
              data-testid="product-detail-back"
            >
              <ArrowLeft size={13} /> {data.parent.label}
            </Link>
          </Reveal>
          <div className="mt-6 grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Reveal>
                <Eyebrow>
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${ACCENT_BORDER[data.accent]}`}>
                    <Icon size={10} strokeWidth={2} />
                  </span>
                  {data.eyebrow}
                </Eyebrow>
              </Reveal>
              <Reveal delay={0.06}>
                <h1 className="mt-6 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
                  {data.title}
                </h1>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 md:text-lg">
                  {data.lead}
                </p>
              </Reveal>
              {data.body && (
                <Reveal delay={0.16}>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">
                    {data.body}
                  </p>
                </Reveal>
              )}
              <Reveal delay={0.2}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Btn to="/register" variant="primary" size="lg" data-testid="product-detail-cta-register">
                    Start free <ArrowRight size={17} strokeWidth={2} />
                  </Btn>
                  <Btn to="/pricing" variant="outline" size="lg" data-testid="product-detail-cta-pricing">
                    See pricing
                  </Btn>
                </div>
              </Reveal>
              <Reveal delay={0.24}>
                <div className="mt-7 flex flex-wrap items-center gap-2">
                  <StatusBadge tone="secure" dot>Live</StatusBadge>
                  <StatusBadge tone="secure">Real-time</StatusBadge>
                  <StatusBadge tone="muted">GDPR-ready</StatusBadge>
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.18} y={40}>
              <div className="grid gap-5">
                {data.outputCard && (
                  <ScoreCard
                    label={data.outputCard.label}
                    value={data.outputCard.value}
                    sub={data.outputCard.sub}
                    inverse={data.outputCard.inverse}
                  />
                )}
                <div className="rounded-2xl border border-white/10 bg-surface p-6">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">What it does for you</div>
                  <ul className="mt-4 grid gap-2.5">
                    {data.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-slate-200">
                        <CheckCircle2 size={16} strokeWidth={2} className={`mt-0.5 shrink-0 ${ACCENT_TEXT[data.accent]}`} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* WHAT IT EVALUATES */}
      {data.evaluates && data.evaluates.length > 0 && (
        <section className="border-y border-white/8 bg-[#0A0B0D] py-20 md:py-24">
          <Container>
            <SectionHeading
              eyebrow="What it does"
              title="The platform continuously evaluates"
              blurb="Every signal is captured in real time and combined into explainable verdicts — no black box, no guessing."
            />
            <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.evaluates.map((it, i) => (
                <Item key={it}>
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-surface p-5 transition-colors hover:border-trusted/30">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono text-[11px] ${ACCENT_BORDER[data.accent]} ${ACCENT_TEXT[data.accent]}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm leading-relaxed text-slate-200">{it}</span>
                  </div>
                </Item>
              ))}
            </Stagger>
          </Container>
        </section>
      )}

      {/* IDEAL FOR */}
      {data.idealFor && data.idealFor.length > 0 && (
        <section className="py-20 md:py-24">
          <Container>
            <SectionHeading eyebrow="Ideal for" title="Built for teams that need certainty" />
            <Stagger className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2.5">
              {data.idealFor.map((c) => (
                <Item key={c}>
                  <span className="rounded-full border border-white/10 bg-surface px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-trusted/40 hover:text-white">
                    {c}
                  </span>
                </Item>
              ))}
            </Stagger>
          </Container>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-white/8 bg-[#0A0B0D] py-24 md:py-28">
        <AmbientBackdrop />
        <Container className="relative text-center">
          <Reveal>
            <h2 className="mx-auto max-w-3xl font-heading text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
              Add {data.eyebrow} to your stack —{" "}
              <span className="text-gradient animate-gradient-x">in minutes.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400">
              Spin up a workspace, drop in the poh.js tag and start scoring real traffic on your first session.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Btn to="/register" variant="primary" size="lg" data-testid="product-detail-final-cta">
                Start free <ArrowRight size={17} strokeWidth={2} />
              </Btn>
              <Btn to={data.parent.to} variant="outline" size="lg" data-testid="product-detail-final-back">
                Back to {data.parent.label}
              </Btn>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
