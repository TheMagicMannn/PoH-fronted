import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import pohLogo from "@/assets/poh-logo.png";

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const dur = 1700;
    const id = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / dur) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(id);
        setTimeout(onComplete, 380);
      }
    }, 28);
    return () => clearInterval(id);
  }, [onComplete]);

  return (
    <motion.div
      key="preloader"
      initial={{ opacity: 1 }}
      exit={{ y: "-100%" }}
      transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
      data-testid="preloader"
    >
      <div className="absolute inset-0 bg-grid-fine opacity-40" />
      <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-trusted/10 blur-[100px]" />

      <div className="relative flex flex-col items-center">
        <motion.img
          src={pohLogo}
          alt="PoH Intelligence — Proof of Human"
          draggable="false"
          className="h-40 w-auto select-none drop-shadow-[0_0_28px_rgba(52,211,153,0.55)]"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-6 font-mono text-[11px] uppercase tracking-[0.4em] text-slate-400"
        >
          Initializing Trust Protocol
          <span className="ml-1 inline-block w-2 animate-blink text-trusted">_</span>
        </motion.div>

        <div className="mt-6 h-[3px] w-56 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-trusted transition-[width] duration-75 ease-linear"
            style={{ width: `${progress}%`, boxShadow: "0 0 12px rgba(52,211,153,0.6)" }}
          />
        </div>
        <div className="mt-2 font-mono text-[10px] tabular-nums text-slate-600">{Math.floor(progress)}%</div>
      </div>
    </motion.div>
  );
}
