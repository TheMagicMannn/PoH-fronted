import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Menu, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Btn } from "./primitives";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/products", label: "Products" },
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

export default function MarketingNav() {
  const { user } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled ? "glass border-b border-white/8" : "bg-transparent"
        )}
        data-testid="marketing-nav"
      >
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 md:px-10">
          <Logo />

          <div className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
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
              className="flex flex-1 flex-col gap-1 px-6 pt-6"
            >
              {LINKS.map((l) => (
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
