import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [location.pathname]);

  const finishPreload = () => {
    try { sessionStorage.setItem("poh_preloaded", "1"); } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-ink text-white antialiased" data-testid="marketing-layout">
      <AnimatePresence>{loading && <Preloader key="preloader" onComplete={finishPreload} />}</AnimatePresence>
      <MarketingNav />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <MarketingFooter />
    </div>
  );
}
