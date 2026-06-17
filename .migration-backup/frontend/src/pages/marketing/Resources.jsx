import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, ArrowUpRight, Clock, Mail } from "lucide-react";
import {
  Container, Reveal, Stagger, Item, Eyebrow, SectionHeading, AmbientBackdrop, Btn, StatusBadge,
} from "@/components/marketing/primitives";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Guides", "Case Studies", "Engineering", "Reports"];

const FEATURED = {
  tag: "Report",
  title: "The 2026 State of Invalid Traffic",
  excerpt: "We analyzed 4.8 billion scored sessions across paid channels. The result: a data-backed look at where ad fraud is hiding, which sources leak the most spend, and what high-performing teams do differently.",
  read: "18 min read",
  date: "Jun 2026",
};

const POSTS = [
  { tag: "Guides", title: "How to read a fraud score (and trust it)", excerpt: "A practical walkthrough of reason codes, confidence and what each signal really means.", read: "7 min", date: "Jun 2026" },
  { tag: "Case Studies", title: "How Voltreach cut 31% of wasted Google Ads spend", excerpt: "Blocking datacenter traffic they never knew existed — in two weeks.", read: "6 min", date: "May 2026" },
  { tag: "Engineering", title: "Inside the layered-evidence scoring engine", excerpt: "Why explainability beats black-box ML for traffic trust at scale.", read: "11 min", date: "May 2026" },
  { tag: "Guides", title: "Suppressing fake conversions before your pixel fires", excerpt: "A field guide to conversion authenticity and CRM hygiene.", read: "8 min", date: "Apr 2026" },
  { tag: "Reports", title: "Bot traffic benchmarks by channel", excerpt: "Median invalid-traffic rates for search, social and display in 2026.", read: "5 min", date: "Apr 2026" },
  { tag: "Case Studies", title: "RevOps at Helixio: 38% fewer junk leads", excerpt: "How a 10-minute SDK install transformed lead quality.", read: "6 min", date: "Mar 2026" },
];

const TAG_TONE = { Guides: "secure", "Case Studies": "review", Engineering: "suspicious", Reports: "muted", Report: "secure" };

export default function Resources() {
  const [cat, setCat] = useState("All");
  const [email, setEmail] = useState("");
  const filtered = cat === "All" ? POSTS : POSTS.filter((p) => p.tag === cat);

  const subscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("Subscribed to PoH threat alerts");
    setEmail("");
  };

  return (
    <div data-testid="page-resources">
      {/* HERO */}
      <section className="relative overflow-hidden pt-32 pb-12 md:pt-40 md:pb-16">
        <AmbientBackdrop />
        <Container className="relative text-center">
          <Reveal><Eyebrow>Intelligence Hub</Eyebrow></Reveal>
          <Reveal delay={0.06}>
            <h1 className="mx-auto mt-6 max-w-3xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Learn to spot what your <span className="text-gradient animate-gradient-x">dashboards hide</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
              Guides, case studies, engineering deep-dives and original research on ad fraud, traffic trust and
              conversion authenticity.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* FEATURED */}
      <section className="pb-16">
        <Container>
          <Reveal>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              data-testid="resources-featured"
              className="group relative grid overflow-hidden rounded-3xl border border-white/10 bg-surface md:grid-cols-2"
            >
              <div className="relative min-h-[260px] overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/12627677/pexels-photo-12627677.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                  alt="State of Invalid Traffic report"
                  className="h-full w-full object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface md:bg-gradient-to-l" />
              </div>
              <div className="flex flex-col justify-center p-8 md:p-12">
                <div className="flex items-center gap-3">
                  <StatusBadge tone={TAG_TONE[FEATURED.tag]}>{FEATURED.tag}</StatusBadge>
                  <span className="font-mono text-[11px] text-slate-500">{FEATURED.date}</span>
                </div>
                <h2 className="mt-5 font-heading text-2xl font-extrabold leading-tight text-white md:text-3xl">{FEATURED.title}</h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">{FEATURED.excerpt}</p>
                <div className="mt-6 flex items-center gap-2 font-mono text-xs text-trusted">
                  <Clock size={13} /> {FEATURED.read}
                  <span className="ml-auto flex items-center gap-1 text-white transition-transform group-hover:translate-x-1">
                    Read report <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </a>
          </Reveal>
        </Container>
      </section>

      {/* FILTER + GRID */}
      <section className="pb-24 md:pb-28">
        <Container>
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                data-testid={`resources-filter-${c.toLowerCase().replace(/\s/g, "-")}`}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  cat === c ? "border-trusted/40 bg-trusted/10 text-trusted" : "border-white/10 text-slate-400 hover:text-white"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <Stagger key={cat} className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Item key={p.title}>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="group flex h-full flex-col rounded-2xl border border-white/10 bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:border-trusted/30"
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge tone={TAG_TONE[p.tag]}>{p.tag}</StatusBadge>
                    <ArrowUpRight size={16} className="text-slate-600 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-trusted" />
                  </div>
                  <h3 className="mt-5 flex-1 font-heading text-lg font-bold leading-snug text-white">{p.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{p.excerpt}</p>
                  <div className="mt-5 flex items-center gap-3 border-t border-white/8 pt-4 font-mono text-[11px] text-slate-500">
                    <Clock size={12} /> {p.read} <span className="ml-auto">{p.date}</span>
                  </div>
                </a>
              </Item>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* NEWSLETTER */}
      <section className="border-t border-white/8 bg-[#0A0B0D] py-24 md:py-28">
        <Container className="max-w-3xl text-center">
          <Reveal>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-trusted/30 bg-trusted/10">
              <Mail size={22} strokeWidth={1.6} className="text-trusted" />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-6 font-heading text-3xl font-extrabold tracking-tight text-white md:text-4xl">Get the threat brief</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-4 max-w-md text-base text-slate-400">
              Monthly intelligence on emerging fraud patterns and traffic trust — no spam, unsubscribe anytime.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <form onSubmit={subscribe} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row" data-testid="newsletter-form">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                data-testid="newsletter-email"
                className="flex-1 rounded-lg border border-white/10 bg-surface px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-colors focus:border-trusted/50 focus:ring-1 focus:ring-trusted/30"
              />
              <Btn variant="primary" size="md" data-testid="newsletter-submit">Subscribe</Btn>
            </form>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
