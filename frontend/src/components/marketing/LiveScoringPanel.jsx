import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** A self-contained "live scoring engine" terminal that streams scored sessions
 *  and animates a trust gauge — the hero centerpiece. */

const POOL = [
  { src: "google / cpc", country: "US" },
  { src: "meta / paid_social", country: "DE" },
  { src: "tiktok / paid", country: "GB" },
  { src: "bing / cpc", country: "US" },
  { src: "direct / none", country: "IN" },
  { src: "newsletter / email", country: "FR" },
  { src: "google / cpc", country: "SG" },
  { src: "reddit / paid", country: "US" },
];

const REASONS = [
  "headless_browser_indicators",
  "datacenter_ip_origin",
  "low_human_interaction_depth",
  "repeated_fingerprint",
  "vpn_usage",
  "abnormal_click_timing",
  "clean_signal",
];

function randHex(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += "0123456789abcdef"[Math.floor(Math.random() * 16)];
  return s;
}

function makeSession() {
  const r = Math.random();
  // skew toward trusted so the demo feels realistic
  let fraud;
  if (r < 0.55) fraud = Math.floor(Math.random() * 28);
  else if (r < 0.8) fraud = 40 + Math.floor(Math.random() * 25);
  else fraud = 72 + Math.floor(Math.random() * 27);
  const tone = fraud >= 70 ? "fraud" : fraud >= 40 ? "suspicious" : "secure";
  const label = fraud >= 70 ? "FRAUDULENT" : fraud >= 40 ? "SUSPICIOUS" : "TRUSTED";
  const p = POOL[Math.floor(Math.random() * POOL.length)];
  const reason = tone === "secure" ? "clean_signal" : REASONS[Math.floor(Math.random() * (REASONS.length - 1))];
  return {
    id: randHex(8),
    src: p.src,
    country: p.country,
    fraud,
    trust: 100 - fraud,
    tone,
    label,
    reason,
    t: Date.now(),
  };
}

const TONE_TEXT = { secure: "text-trusted", suspicious: "text-suspicious", fraud: "text-fraudulent" };
const TONE_BG = { secure: "bg-trusted", suspicious: "bg-suspicious", fraud: "bg-fraudulent" };
const TONE_RING = { secure: "#34D399", suspicious: "#FBBF24", fraud: "#F87171" };

function Gauge({ session }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const pct = session ? session.trust / 100 : 0.86;
  const color = session ? TONE_RING[session.tone] : "#34D399";
  return (
    <div className="relative flex h-[140px] w-[140px] items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <motion.circle
          cx="70" cy="70" r={R} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - pct) }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={session?.trust ?? "init"}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="font-heading text-3xl font-extrabold tabular-nums text-white"
          >
            {session ? session.trust : 86}
          </motion.span>
        </AnimatePresence>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">trust</span>
      </div>
    </div>
  );
}

export default function LiveScoringPanel() {
  const [rows, setRows] = useState(() => Array.from({ length: 5 }, makeSession));
  const [scanned, setScanned] = useState(48213);
  const timer = useRef(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setRows((prev) => [makeSession(), ...prev].slice(0, 5));
      setScanned((s) => s + Math.floor(2 + Math.random() * 9));
    }, 1700);
    return () => clearInterval(timer.current);
  }, []);

  const current = rows[0];

  return (
    <div className="relative" data-testid="live-scoring-panel">
      {/* glow */}
      <div className="absolute -inset-6 rounded-[28px] bg-trusted/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B0D0F]/90 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        {/* scanline */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-8 bg-gradient-to-b from-trusted/10 to-transparent animate-scanline" />
        {/* title bar */}
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-fraudulent/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-suspicious/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-trusted/80" />
            <span className="ml-2 font-mono text-xs text-slate-400">poh.live // scoring-engine</span>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-trusted">
            <span className="h-1.5 w-1.5 rounded-full bg-trusted animate-pulse-dot" /> live
          </span>
        </div>

        {/* gauge + stats */}
        <div className="flex items-center gap-5 border-b border-white/8 px-5 py-5">
          <Gauge session={current} />
          <div className="flex-1 space-y-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">latest verdict</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={current?.id}
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.3 }}
                  className={`mt-1 font-heading text-xl font-extrabold ${TONE_TEXT[current?.tone || "secure"]}`}
                >
                  {current?.label}
                </motion.div>
              </AnimatePresence>
              <div className="mt-1 font-mono text-[11px] text-slate-500">reason: {current?.reason}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">sessions scored</div>
                <div className="font-heading text-base font-bold tabular-nums text-white">{scanned.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">latency</div>
                <div className="font-heading text-base font-bold tabular-nums text-trusted">23ms</div>
              </div>
            </div>
          </div>
        </div>

        {/* stream */}
        <div className="px-2 py-2">
          <div className="grid grid-cols-12 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-600">
            <span className="col-span-3">session</span>
            <span className="col-span-4">source</span>
            <span className="col-span-3">verdict</span>
            <span className="col-span-2 text-right">fraud</span>
          </div>
          <div className="relative space-y-1">
            <AnimatePresence initial={false}>
              {rows.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: -14, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-12 items-center rounded-md px-3 py-2 font-mono text-[11px] hover:bg-white/[0.03]"
                >
                  <span className="col-span-3 text-slate-300">#{r.id}</span>
                  <span className="col-span-4 truncate text-slate-400">{r.src}</span>
                  <span className="col-span-3">
                    <span className={`inline-flex items-center gap-1.5 ${TONE_TEXT[r.tone]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${TONE_BG[r.tone]}`} />
                      {r.label.slice(0, 4)}
                    </span>
                  </span>
                  <span className={`col-span-2 text-right font-semibold tabular-nums ${TONE_TEXT[r.tone]}`}>{r.fraud}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
