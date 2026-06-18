import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useSite } from "@/context/SiteContext";
import { fetcher } from "@/lib/api";
import SessionDrawer from "./SessionDrawer";

const HUMAN_CLASS = {
  human:            { label: "HUMAN",      short: "HUM",  color: "text-trusted",         dot: "bg-trusted",         hex: "#34D399" },
  suspicious_human: { label: "SUSPICIOUS", short: "SUSP", color: "text-suspicious",       dot: "bg-suspicious",      hex: "#FBBF24" },
  automation:       { label: "AUTOMATION", short: "AUTO", color: "text-review",           dot: "bg-review",          hex: "#60A5FA" },
  bot:              { label: "BOT",        short: "BOT",  color: "text-fraudulent",       dot: "bg-fraudulent",      hex: "#F87171" },
  unscored:         { label: "UNSCORED",   short: "—",    color: "text-muted-foreground", dot: "bg-white/20",        hex: "#6B7280" },
};

const TRAFFIC_TIER = {
  low:      { label: "LOW",  color: "text-trusted"   },
  medium:   { label: "MED",  color: "text-review"    },
  elevated: { label: "ELEV", color: "text-suspicious"},
  high:     { label: "HIGH", color: "text-fraudulent"},
  critical: { label: "CRIT", color: "text-fraudulent"},
};

function LiveGauge({ session }) {
  const score = session?.human_score ?? session?.trust_score ?? 0;
  const cls   = HUMAN_CLASS[session?.human_classification ?? "unscored"] ?? HUMAN_CLASS.unscored;
  const R = 52, C = 2 * Math.PI * R;
  return (
    <div className="relative flex h-[140px] w-[140px] shrink-0 items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <motion.circle
          cx="70" cy="70" r={R} fill="none" stroke={cls.hex} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - score / 100) }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${cls.hex}55)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={session?.id ?? "init"}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="font-heading text-3xl font-extrabold tabular-nums text-white"
          >
            {score}
          </motion.span>
        </AnimatePresence>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">trust</span>
      </div>
    </div>
  );
}

export default function LiveFeed() {
  const { siteId } = useSite();
  const [activeId, setActiveId] = useState(null);
  const [totalSessions, setTotalSessions] = useState(null);

  const params = new URLSearchParams({ range: "7d", page: 1, page_size: 25 });
  if (siteId) params.set("site_id", siteId);

  const { data, isLoading } = useQuery({
    queryKey: ["live-feed", siteId],
    queryFn: () => fetcher(`/sessions?${params}`),
    refetchInterval: 4000,
    staleTime: 0,
  });

  useEffect(() => {
    if (data?.total != null) setTotalSessions(data.total);
  }, [data?.total]);

  const sessions = data?.items ?? [];
  const latest   = sessions[0];
  const latestCls = HUMAN_CLASS[latest?.human_classification ?? "unscored"] ?? HUMAN_CLASS.unscored;

  return (
    <div className="space-y-5" data-testid="live-feed-page">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Live Intelligence Feed</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time session scoring · auto-refreshes every 4 s · click any row for full detail
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-trusted/30 bg-trusted/10 px-3 py-1.5 font-mono text-xs text-trusted">
          <span className="h-1.5 w-1.5 rounded-full bg-trusted animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Terminal card */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B0D0F]/90 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.7)]">

        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-fraudulent/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-suspicious/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-trusted/80" />
            <span className="ml-2 font-mono text-xs text-slate-400">poh.live // intelligence-stream</span>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-trusted">
            <span className="h-1.5 w-1.5 rounded-full bg-trusted animate-pulse" /> live
          </span>
        </div>

        {/* Gauge + latest verdict */}
        <div className="flex flex-wrap items-center gap-5 border-b border-white/8 px-5 py-5">
          <LiveGauge session={latest} />
          <div className="flex-1 min-w-[180px] space-y-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">latest verdict</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={latest?.id ?? "none"}
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.3 }}
                  className={`mt-1 font-heading text-xl font-extrabold ${latestCls.color}`}
                >
                  {latestCls.label}
                </motion.div>
              </AnimatePresence>
              <div className="mt-1 font-mono text-[11px] text-slate-500">
                {latest?.reason_codes?.[0] ?? "awaiting_sessions"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">sessions</div>
                <div className="font-heading text-base font-bold tabular-nums text-white">
                  {totalSessions != null ? totalSessions.toLocaleString() : "—"}
                </div>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">source</div>
                <div className="font-heading text-sm font-bold tabular-nums text-white truncate">
                  {latest ? `${latest.source ?? "—"} / ${latest.medium ?? "—"}` : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stream */}
        <div className="px-2 py-2">
          <div className="grid grid-cols-12 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-600">
            <span className="col-span-2">session</span>
            <span className="col-span-2">country</span>
            <span className="col-span-2">source</span>
            <span className="col-span-2">human</span>
            <span className="col-span-1">traffic</span>
            <span className="col-span-1 text-right">trust</span>
            <span className="col-span-2 text-right">time</span>
          </div>

          <div className="space-y-0.5">
            {isLoading && sessions.length === 0 ? (
              <div className="py-10 text-center font-mono text-xs text-slate-600">
                <span className="animate-pulse">awaiting data…</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-10 text-center font-mono text-xs text-slate-600">
                no sessions in the last 7 days
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {sessions.map((s) => {
                  const hCls  = HUMAN_CLASS[s.human_classification ?? "unscored"] ?? HUMAN_CLASS.unscored;
                  const tier  = TRAFFIC_TIER[s.traffic_risk_tier] ?? null;
                  const trust = s.human_score ?? s.trust_score ?? 0;
                  const time  = s.started_at
                    ? new Date(s.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                    : "—";
                  return (
                    <motion.div
                      key={s.id}
                      layout
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => setActiveId(s.id)}
                      className="grid grid-cols-12 cursor-pointer items-center rounded-md px-3 py-2.5 font-mono text-[11px] hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors"
                    >
                      <span className="col-span-2 text-slate-300 truncate">
                        #{(s.session_id ?? s.id ?? "").slice(-8)}
                      </span>
                      <span className="col-span-2 truncate text-slate-500 uppercase text-[10px]">
                        {s.country ?? "—"}
                      </span>
                      <span className="col-span-2 truncate text-slate-400">
                        {(s.source && s.source !== "null") ? s.source : "—"}
                      </span>
                      <span className="col-span-2">
                        <span className={`inline-flex items-center gap-1 ${hCls.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${hCls.dot}`} />
                          {hCls.short}
                        </span>
                      </span>
                      <span className="col-span-1">
                        {tier
                          ? <span className={`text-[10px] font-semibold ${tier.color}`}>{tier.label}</span>
                          : <span className="text-slate-600">—</span>}
                      </span>
                      <span className={`col-span-1 text-right font-semibold tabular-nums ${hCls.color}`}>
                        {trust}
                      </span>
                      <span className="col-span-2 text-right text-slate-600 text-[10px]">
                        {time}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      <SessionDrawer sessionId={activeId} open={!!activeId} onClose={() => setActiveId(null)} />
    </div>
  );
}
