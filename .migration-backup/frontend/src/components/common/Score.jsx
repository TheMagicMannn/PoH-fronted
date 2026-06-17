import { cn } from "@/lib/utils";
import { classify, statusConfig, reasonLabel } from "@/lib/format";

// Horizontal fraud-score bar with semantic color
export function ScoreBar({ score, label = "Fraud", className, showValue = true }) {
  const status = classify(score);
  const c = statusConfig[status];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-full max-w-[120px] rounded-full bg-white/8 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-300", c.dot)} style={{ width: `${Math.max(3, score)}%` }} />
      </div>
      {showValue && <span className={cn("font-mono text-xs tabular-nums w-8 text-right", c.text)}>{score}</span>}
    </div>
  );
}

// Circular trust gauge
export function TrustGauge({ score, size = 56, classification }) {
  const status = classification || classify(100 - score);
  const c = statusConfig[status];
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.hex} strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-500" />
      </svg>
      <span className={cn("absolute font-mono font-semibold text-sm", c.text)}>{score}</span>
    </div>
  );
}

export function ReasonCodes({ codes = [], max = 3, className }) {
  if (!codes.length)
    return <span className="text-muted-foreground text-xs font-mono">no signals</span>;
  const shown = codes.slice(0, max);
  const extra = codes.length - shown.length;
  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {shown.map((code) => (
        <span key={code} title={reasonLabel(code)} className="inline-flex items-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {code.replace(/_/g, " ")}
        </span>
      ))}
      {extra > 0 && <span className="font-mono text-[10px] text-muted-foreground">+{extra}</span>}
    </div>
  );
}

export function ReasonCodeList({ codes = [] }) {
  if (!codes.length) return <p className="text-sm text-muted-foreground">No risk signals detected.</p>;
  return (
    <ul className="space-y-1.5">
      {codes.map((code) => (
        <li key={code} className="flex items-start gap-2 text-sm">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-fraudulent" />
          <span className="text-slate-300">{reasonLabel(code)}</span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground shrink-0">{code}</span>
        </li>
      ))}
    </ul>
  );
}
