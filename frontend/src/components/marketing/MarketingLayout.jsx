import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import MarketingNav from "./MarketingNav";
import MarketingFooter from "./MarketingFooter";
import Preloader from "./Preloader";

export default function MarketingLayout() {
  const location = useLocation();
  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem("poh_preloaded");
    } catch {
      return true;
    }
  });

  // Reset scroll to top on route change. Use `behavior: "instant"` directly —
  // the previous `"instant" in window` check was always false and fell back to
  // smooth scroll, which contributed to the page-content-not-rendering bug
  // because `whileInView` reveals fired before the scroll completed.
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const finishPreload = () => {
    try { sessionStorage.setItem("poh_preloaded", "1"); } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-ink text-white antialiased" data-testid="marketing-layout">
      <AnimatePresence>{loading && <Preloader key="preloader" onComplete={finishPreload} />}</AnimatePresence>
      <MarketingNav />
      {/*
        Plain <main> — no framer-motion wrapper. The previous wrapper applied a
        translate-y(12px) → 0 animation on every route mount, which:
        1) Caused the visible "page jiggle" on every navigation.
        2) Broke `whileInView` Reveal triggers inside the page because the
           transform offset confused IntersectionObserver, so content stayed at
           opacity:0 until the user scrolled (which forced the observer to
           re-evaluate).
      */}
      <main>
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}
