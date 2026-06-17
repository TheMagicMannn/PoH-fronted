import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, BookOpen, Code2, CreditCard, LifeBuoy, ArrowRight, Plus, MessageSquare, Mail, Activity,
} from "lucide-react";
import {
  Container, Reveal, Stagger, Item, Eyebrow, SectionHeading, AmbientBackdrop, Btn, StatusBadge,
} from "@/components/marketing/primitives";
import { cn } from "@/lib/utils";

const CATS = [
  { icon: BookOpen, t: "Documentation", d: "Install poh.js, configure rules and map conversions.", k: "32 articles" },
  { icon: Code2, t: "API Reference", d: "Endpoints, payloads and the Trust API for programmatic verdicts.", k: "REST + webhooks" },
  { icon: CreditCard, t: "Billing & Plans", d: "Invoices, session limits, upgrades and team seats.", k: "14 articles" },
  { icon: LifeBuoy, t: "Contact Support", d: "Reach a human on the trust & fraud team directly.", k: "< 4h response" },
];

const STATUS = [
  { s: "Scoring Engine", up: true },
  { s: "poh.js CDN", up: true },
  { s: "Dashboard & APIs", up: true },
  { s: "Integrations Sync", up: true },
];

const FAQ = [
  { q: "How long does the poh.js install take?", a: "Most teams are live in under ten minutes — add one async script tag with your workspace key, then map any conversions with poh.convert(). No build step required." },
  { q: "Will PoH slow down my site?", a: "No. The SDK is under 12kb gzipped, loads asynchronously and never blocks rendering. Scoring happens server-side in ~23ms." },
  { q: "How do I block invalid traffic on my ad platforms?", a: "Connect your ad platform under Integrations, then enable sync. PoH pushes verdicts and suppression signals automatically on Growth and Enterprise plans." },
  { q: "Can I export my data?", a: "Yes. Session, conversion and campaign data is exportable from the dashboard, and everything is available via the API and webhooks." },
  { q: "How do I reset my password?", a: "Use the 'Forgot password' link on the login screen. You'll receive a secure reset link by email within a minute." },
];

function FaqRow({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 py-5 text-left" data-testid="support-faq-toggle">
        <span className="font-heading text-base font-semibold text-white md:text-lg">{item.q}</span>
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-trusted transition-transform", open && "rotate-45")}>
          <Plus size={15} strokeWidth={2} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <p className="pb-5 pr-10 text-sm leading-relaxed text-slate-400">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Support() {
  const [q, setQ] = useState("");
  const onSearch = (e) => {
    e.preventDefault();
    if (q.trim()) toast.success(`Searching the help center for “${q.trim()}”`);
  };
  const onContact = (e) => {
    e.preventDefault();
    toast.success("Message sent — our team will reply within 4 hours");
    e.target.reset();
  };

  return (
    <div data-testid="page-support">
      {/* HERO + SEARCH */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
        <AmbientBackdrop />
        <Container className="relative text-center">
          <Reveal><Eyebrow>Support</Eyebrow></Reveal>
          <Reveal delay={0.06}>
            <h1 className="mx-auto mt-6 max-w-3xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              We've got your <span className="text-gradient animate-gradient-x">back</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400 md:text-lg">
              Search the help center, browse the docs, or talk to a human on the trust &amp; fraud team.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <form onSubmit={onSearch} className="mx-auto mt-9 flex max-w-xl items-center gap-2 rounded-xl border border-white/10 bg-surface px-4 py-2.5 focus-within:border-trusted/40" data-testid="support-search-form">
              <Search size={18} className="text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search docs, guides and API reference…"
                data-testid="support-search-input"
                className="flex-1 bg-transparent py-1.5 text-sm text-white placeholder:text-slate-600 outline-none"
              />
              <kbd className="hidden rounded border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] text-slate-500 sm:block">⌘K</kbd>
            </form>
          </Reveal>
        </Container>
      </section>

      {/* CATEGORIES */}
      <section className="pb-20">
        <Container>
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CATS.map((c) => (
              <Item key={c.t}>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  data-testid={`support-cat-${c.t.toLowerCase().split(" ")[0]}`}
                  className="group flex h-full flex-col rounded-2xl border border-white/10 bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:border-trusted/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition-colors group-hover:border-trusted/30 group-hover:bg-trusted/10">
                    <c.icon size={22} strokeWidth={1.6} className="text-slate-300 transition-colors group-hover:text-trusted" />
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-bold text-white">{c.t}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{c.d}</p>
                  <div className="mt-5 flex items-center justify-between font-mono text-[11px] text-slate-500">
                    {c.k}
                    <ArrowRight size={14} className="text-trusted transition-transform group-hover:translate-x-1" />
                  </div>
                </a>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* STATUS + QUICKSTART */}
      <section className="border-y border-white/8 bg-[#0A0B0D] py-20">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-white/10 bg-surface p-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Activity size={18} className="text-trusted" />
                    <h3 className="font-heading text-lg font-bold text-white">System status</h3>
                  </div>
                  <StatusBadge tone="secure" dot>All operational</StatusBadge>
                </div>
                <div className="mt-6 space-y-3">
                  {STATUS.map((s) => (
                    <div key={s.s} className="flex items-center justify-between border-b border-white/8 pb-3 last:border-0">
                      <span className="text-sm text-slate-300">{s.s}</span>
                      <span className="flex items-center gap-2 font-mono text-[11px] text-trusted">
                        <span className="h-1.5 w-1.5 rounded-full bg-trusted animate-pulse-dot" /> operational
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-surface p-7">
                <h3 className="font-heading text-lg font-bold text-white">SDK quick-start</h3>
                <p className="mt-2 text-sm text-slate-400">Add one tag to start scoring traffic.</p>
                <pre className="mt-5 overflow-x-auto rounded-xl border border-white/8 bg-[#0B0D0F] p-4 font-mono text-[12px] leading-relaxed text-slate-300">
<span className="text-slate-500">{"<script src="}</span><span className="text-suspicious">{'"https://cdn.poh.io/poh.js"'}</span>{"\n        "}<span className="text-trusted">data-key</span>=<span className="text-suspicious">{'"poh_live_xxxx"'}</span> <span className="text-slate-500">{"async></script>"}</span>
                </pre>
                <Btn to="/register" variant="outline" size="md" className="mt-5" data-testid="support-quickstart-cta">
                  Get your workspace key <ArrowRight size={15} strokeWidth={2} />
                </Btn>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* FAQ + CONTACT */}
      <section className="py-24 md:py-32">
        <Container>
          <div className="grid gap-14 lg:grid-cols-2">
            <div>
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-white md:text-4xl">Common questions</h2>
              <div className="mt-8">
                {FAQ.map((item) => <FaqRow key={item.q} item={item} />)}
              </div>
            </div>

            <div>
              <Eyebrow>Contact</Eyebrow>
              <h2 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-white md:text-4xl">Talk to a human</h2>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-surface px-3.5 py-2 text-sm text-slate-300"><MessageSquare size={15} className="text-trusted" /> Live chat</span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-surface px-3.5 py-2 text-sm text-slate-300"><Mail size={15} className="text-trusted" /> support@poh.io</span>
              </div>
              <form onSubmit={onContact} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-surface p-6" data-testid="support-contact-form">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Name</span>
                    <input required data-testid="contact-name" className="mt-1.5 w-full rounded-lg border border-white/10 bg-ink px-3 py-2.5 text-sm text-white outline-none focus:border-trusted/50" placeholder="Avery Chen" />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Work email</span>
                    <input required type="email" data-testid="contact-email" className="mt-1.5 w-full rounded-lg border border-white/10 bg-ink px-3 py-2.5 text-sm text-white outline-none focus:border-trusted/50" placeholder="you@company.com" />
                  </label>
                </div>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">How can we help?</span>
                  <textarea required rows={4} data-testid="contact-message" className="mt-1.5 w-full resize-none rounded-lg border border-white/10 bg-ink px-3 py-2.5 text-sm text-white outline-none focus:border-trusted/50" placeholder="Tell us what's going on…" />
                </label>
                <Btn variant="primary" size="md" className="w-full" data-testid="contact-submit">Send message</Btn>
              </form>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
