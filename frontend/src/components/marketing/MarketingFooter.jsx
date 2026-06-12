import { Link } from "react-router-dom";
import { ShieldCheck, Github, Linkedin, Twitter } from "lucide-react";
import { Container, Btn, Reveal } from "./primitives";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "Overview", to: "/products" },
      { label: "Pricing", to: "/pricing" },
      { label: "Session Intelligence", to: "/products" },
      { label: "Conversion Authenticity", to: "/products" },
      { label: "poh.js SDK", to: "/products" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Resources", to: "/resources" },
      { label: "Trust Network", to: "/about" },
      { label: "Careers", to: "/about" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", to: "/support" },
      { label: "Documentation", to: "/support" },
      { label: "API Reference", to: "/support" },
      { label: "System Status", to: "/support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
      { label: "GDPR & CCPA", to: "/gdpr-ccpa" },
      { label: "Security", to: "/support" },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer className="relative mt-10 border-t border-white/8 bg-[#0A0B0D]" data-testid="marketing-footer">
      {/* CTA band */}
      <Container className="relative -mt-px">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface px-8 py-14 text-center md:px-16 md:py-20">
            <div className="absolute inset-0 bg-grid-fine opacity-40" />
            <div className="absolute -top-24 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-trusted/15 blur-[110px]" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-heading text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Start protecting your traffic <span className="text-gradient animate-gradient-x">today</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
                Drop in one script and start scoring every session and conversion in real time. No credit card required.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Btn to="/register" variant="primary" size="lg" data-testid="footer-cta-register">Create free workspace</Btn>
                <Btn to="/products" variant="outline" size="lg" data-testid="footer-cta-products">Explore the platform</Btn>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>

      {/* Link grid */}
      <Container className="py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-trusted/30 bg-trusted/15">
                <ShieldCheck size={18} strokeWidth={1.8} className="text-trusted" />
              </span>
              <span className="font-heading text-lg font-extrabold tracking-tight text-white">PoH</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              The trust &amp; fraud intelligence layer for paid traffic, leads and conversions.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-trusted/40 hover:text-trusted"
                  aria-label="social link"
                >
                  <Icon size={16} strokeWidth={1.6} />
                </a>
              ))}
            </div>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{col.title}</div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-slate-400 transition-colors hover:text-white">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-6 sm:flex-row">
          <p className="font-mono text-xs text-slate-600">© {new Date().getFullYear()} PoH Intelligence, Inc. All rights reserved.</p>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-trusted animate-pulse-dot" />
            All systems operational
          </div>
        </div>
      </Container>
    </footer>
  );
}
