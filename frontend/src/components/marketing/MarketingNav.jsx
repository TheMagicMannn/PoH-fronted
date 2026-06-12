import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Menu, X, ArrowRight, ChevronDown,
  Fingerprint, Shield, Network, BarChart3, ShieldAlert,
  Bot, Database, Target, Code2, ScanLine,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Btn } from "./primitives";
import { cn } from "@/lib/utils";

const PRODUCT_GROUPS = [
  {
    id: "poh",
    title: "Proof of Human Platform",
    to: "/products/proof-of-human-platform",
    blurb: "Five intelligence engines, one platform.",
    accent: "trusted",
    displayMode: "accordion", // collapsed by default, expand via chevron
    items: [
      { label: "Human Authenticity Intelligence", to: "/products/human-authenticity-intelligence", icon: Fingerprint, hint: "Identify real humans with confidence" },
      { label: "Trust Intelligence", to: "/products/trust-intelligence", icon: ShieldCheck, hint: "Understand who can be trusted" },
      { label: "Traffic Intelligence", to: "/products/traffic-intelligence", icon: Network, hint: "See where your traffic comes from" },
      { label: "Revenue Protection", to: "/products/revenue-protection", icon: ShieldAlert, hint: "Protect revenue from fraud & waste" },
      { label: "Analytics & Operations", to: "/products/analytics-operations", icon: BarChart3, hint: "Turn intelligence into action" },
    ],
  },
  {
    id: "premium",
    title: "Premium Modules",
    to: "/products/premium-modules",
    blurb: "Expansion modules that extend the core platform.",
    accent: "review",
    displayMode: "list", // always shown
    items: [
      { label: "Ad Shield", to: "/products/ad-shield", icon: Shield, hint: "Stop wasting ad budget on IVT" },
      { label: "Fraud Memory Cloud", to: "/products/fraud-memory-cloud", icon: Database, hint: "Learn from every fraud attempt" },
      { label: "AI Fraud Analyst", to: "/products/ai-fraud-analyst", icon: Bot, hint: "Always-on investigation assistant" },
      { label: "Intent Intelligence", to: "/products/intent-intelligence", icon: Target, hint: "Understand why visitors are there" },
      { label: "Trust APIs", to: "/products/trust-apis", icon: Code2, hint: "Embed PoH into any application" },
    ],
  },
];

const SIMPLE_LINKS = [
  { to: "/pricing", label: "Pricing" },
  { to: "/resources", label: "Resources" },
  { to: "/about", label: "About" },
  { to: "/support", label: "Support" },
];

function Logo({ onClick }) {
  return (
    <Link to="/" onClick={onClick} className="group flex items-center gap-2.5" data-testid="nav-logo">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-trusted/30 bg-trusted/15 transition-all group-hover:shadow-[0_0_18px_rgba(52,211,153,0.4)]">
        <ShieldCheck size={18} strokeWidth={1.8} className="text-trusted" />
      </span>
      <span className="leading-none">
        <span className="block font-heading text-lg font-extrabold tracking-tight text-white">PoH</span>
        <span className="block font-mono text-[8px] uppercase tracking-[0.22em] text-slate-500">Trust Intelligence</span>
      </span>
    </Link>
  );
}

function ProductsSubmenuList({ items, onClose, variant = "stagger" }) {
  const useStagger = variant === "stagger";
  const Wrapper = useStagger ? motion.ul : "ul";
  const wrapperProps = useStagger
    ? {
        initial: "hidden",
        animate: "show",
        variants: { show: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } } },
      }
    : {};
  return (
    <Wrapper {...wrapperProps} className="flex flex-col gap-1 px-1.5 pt-2 pb-1">
      {items.map((it) => {
        const ItIcon = it.icon;
        const Li = useStagger ? motion.li : "li";
        const liProps = useStagger
          ? {
              variants: {
                hidden: { opacity: 0, x: -10 },
                show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
              },
            }
          : {};
        return (
          <Li key={it.to} {...liProps}>
            <Link
              to={it.to}
              onClick={onClose}
              className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
              data-testid={`products-dropdown-item-${it.to.split("/").pop()}`}
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] transition-colors group-hover:border-trusted/30 group-hover:bg-trusted/10">
                <ItIcon size={15} strokeWidth={1.8} className="text-slate-300 transition-colors group-hover:text-trusted" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{it.label}</span>
                <span className="block text-[12px] text-slate-500">{it.hint}</span>
              </span>
            </Link>
          </Li>
        );
      })}
    </Wrapper>
  );
}

function ProductsDropdown({ open, onClose }) {
  const [expanded, setExpanded] = useState(null); // 'poh' | null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-1/2 top-full z-40 mt-2 w-[460px] max-w-[92vw] -translate-x-1/2"
          data-testid="products-dropdown"
        >
          <div className="glass overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
            <div className="flex flex-col bg-[#0B0D0F] p-3">
              {PRODUCT_GROUPS.map((group, gi) => {
                const isAccordion = group.displayMode === "accordion";
                const isOpen = !isAccordion || expanded === group.id;
                return (
                  <div key={group.id} className="rounded-xl">
                    <div
                      className={cn(
                        "group flex items-stretch gap-1 rounded-xl border transition-all",
                        isOpen
                          ? "border-trusted/40 bg-trusted/[0.04]"
                          : "border-white/10 bg-surface hover:border-trusted/30 hover:bg-trusted/[0.03]"
                      )}
                    >
                      <Link
                        to={group.to}
                        onClick={onClose}
                        className="flex-1 px-4 py-3.5"
                        data-testid={`products-dropdown-header-${group.id}`}
                      >
                        <div className="font-heading text-base font-bold text-white">{group.title}</div>
                        <div className="mt-0.5 text-[12px] text-slate-400">{group.blurb}</div>
                      </Link>
                      {isAccordion && (
                        <button
                          type="button"
                          onClick={() => setExpanded(expanded === group.id ? null : group.id)}
                          aria-expanded={isOpen}
                          aria-label={`${isOpen ? "Collapse" : "Expand"} ${group.title}`}
                          className={cn(
                            "flex w-12 items-center justify-center border-l border-white/10 transition-colors",
                            isOpen ? "text-trusted" : "text-slate-400 hover:text-white"
                          )}
                          data-testid={`products-dropdown-toggle-${group.id}`}
                        >
                          <ChevronDown
                            size={18}
                            className={cn("transition-transform duration-300", isOpen && "rotate-180")}
                          />
                        </button>
                      )}
                    </div>

                    {isAccordion ? (
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                            data-testid={`products-dropdown-panel-${group.id}`}
                          >
                            <ProductsSubmenuList items={group.items} onClose={onClose} variant="stagger" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    ) : (
                      <div data-testid={`products-dropdown-panel-${group.id}`}>
                        <ProductsSubmenuList items={group.items} onClose={onClose} variant="static" />
                      </div>
                    )}

                    {gi !== PRODUCT_GROUPS.length - 1 && (
                      <div className="my-1.5 h-px bg-white/5" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/8 bg-[#0A0B0D] px-5 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
                Real-time trust intelligence
              </span>
              <Link
                to="/pricing"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-trusted hover:text-white"
                data-testid="products-dropdown-pricing"
              >
                See pricing <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MobileProductGroup({ group, onClose }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-surface">
      <div className="flex items-stretch">
        <Link
          to={group.to}
          onClick={onClose}
          className="flex-1 px-4 py-3.5"
          data-testid={`mobile-products-header-${group.id}`}
        >
          <div className="font-heading text-base font-bold text-white">{group.title}</div>
          <div className="mt-0.5 text-[12px] text-slate-500">{group.blurb}</div>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} ${group.title}`}
          className={cn(
            "flex w-12 items-center justify-center border-l border-white/10 transition-colors",
            open ? "text-trusted" : "text-slate-400"
          )}
          data-testid={`mobile-products-toggle-${group.id}`}
        >
          <ChevronDown
            size={18}
            className={cn("transition-transform duration-300", open && "rotate-180")}
          />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <ul className="flex flex-col gap-1 px-3 pb-3 pt-1">
              {group.items.map((it) => (
                <li key={it.to}>
                  <Link
                    to={it.to}
                    onClick={onClose}
                    className="block rounded-lg px-2 py-2 text-sm text-slate-300 hover:bg-white/[0.04] hover:text-trusted"
                    data-testid={`mobile-products-item-${it.to.split("/").pop()}`}
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MarketingNav() {
  const { user } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const closeTimer = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setProductsOpen(false);
    setMobileProductsOpen(false);
  }, [location.pathname]);

  const onProductsEnter = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setProductsOpen(true);
  };
  const onProductsLeave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setProductsOpen(false), 180);
  };

  const productsActive = location.pathname.startsWith("/products");

  return (
    <>
      {/* Backdrop blur when Products dropdown is open */}
      <AnimatePresence>
        {productsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none fixed inset-0 z-40 bg-ink/55 backdrop-blur-md"
            data-testid="nav-backdrop"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled || productsOpen ? "glass border-b border-white/8" : "bg-transparent"
        )}
        data-testid="marketing-nav"
      >
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 md:px-10">
          <Logo />

          <div className="hidden items-center gap-1 lg:flex">
            {/* Products dropdown trigger */}
            <div
              className="relative"
              onMouseEnter={onProductsEnter}
              onMouseLeave={onProductsLeave}
            >
              <Link
                to="/products/proof-of-human-platform"
                onClick={() => setProductsOpen(false)}
                data-testid="nav-products"
                className={cn(
                  "group relative flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors",
                  productsActive ? "text-white" : "text-slate-400 hover:text-white"
                )}
                aria-haspopup="true"
                aria-expanded={productsOpen}
              >
                Products
                <ChevronDown
                  size={14}
                  className={cn(
                    "transition-transform duration-300",
                    productsOpen ? "rotate-180 text-trusted" : "text-slate-500"
                  )}
                />
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-0.5 h-px origin-left bg-trusted transition-transform duration-300",
                    productsActive || productsOpen ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  )}
                />
              </Link>
              <ProductsDropdown open={productsOpen} onClose={() => setProductsOpen(false)} />
            </div>

            {SIMPLE_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                data-testid={`nav-${l.label.toLowerCase()}`}
                className={({ isActive }) =>
                  cn(
                    "group relative px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive ? "text-white" : "text-slate-400 hover:text-white"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    <span
                      className={cn(
                        "absolute inset-x-3 -bottom-0.5 h-px origin-left bg-trusted transition-transform duration-300",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <Btn to="/app" variant="primary" size="sm" data-testid="nav-dashboard">
                Go to Dashboard <ArrowRight size={15} strokeWidth={2} />
              </Btn>
            ) : (
              <>
                <Btn to="/login" variant="ghost" size="sm" data-testid="nav-login">Log in</Btn>
                <Btn to="/register" variant="primary" size="sm" data-testid="nav-create-account">
                  Create account <ArrowRight size={15} strokeWidth={2} />
                </Btn>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white lg:hidden"
            data-testid="nav-mobile-open"
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={1.8} />
          </button>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex flex-col bg-ink/98 backdrop-blur-xl lg:hidden"
            data-testid="mobile-menu"
          >
            <div className="flex h-16 items-center justify-between px-6">
              <Logo onClick={() => setOpen(false)} />
              <button
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white"
                data-testid="nav-mobile-close"
                aria-label="Close menu"
              >
                <X size={20} strokeWidth={1.8} />
              </button>
            </div>
            <motion.div
              initial="hidden" animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } }}
              className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 pt-6 pb-10"
            >
              {/* Mobile Products accordion */}
              <motion.div variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
                <button
                  onClick={() => setMobileProductsOpen((v) => !v)}
                  className="flex w-full items-center justify-between border-b border-white/8 py-4 font-heading text-2xl font-bold text-white"
                  data-testid="mobile-nav-products"
                >
                  Products
                  <ChevronDown
                    size={20}
                    className={cn("transition-transform duration-300", mobileProductsOpen && "rotate-180 text-trusted")}
                  />
                </button>
                <AnimatePresence>
                  {mobileProductsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 py-4">
                        {PRODUCT_GROUPS.map((group) => (
                          <MobileProductGroup
                            key={group.id}
                            group={group}
                            onClose={() => setOpen(false)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {SIMPLE_LINKS.map((l) => (
                <motion.div key={l.to} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
                  <NavLink
                    to={l.to}
                    className="block border-b border-white/8 py-4 font-heading text-2xl font-bold text-white"
                    data-testid={`mobile-nav-${l.label.toLowerCase()}`}
                  >
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}
              <div className="mt-8 flex flex-col gap-3">
                {user ? (
                  <Btn to="/app" variant="primary" size="lg" data-testid="mobile-nav-dashboard">Go to Dashboard</Btn>
                ) : (
                  <>
                    <Btn to="/login" variant="outline" size="lg" data-testid="mobile-nav-login">Log in</Btn>
                    <Btn to="/register" variant="primary" size="lg" data-testid="mobile-nav-create-account">Create account</Btn>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
