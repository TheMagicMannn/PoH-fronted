import { cn } from "@/lib/utils";

const RANGES = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "14d", label: "14d" },
  { value: "30d", label: "30d" },
];

export function RangeSelect({ value, onChange, options = RANGES, testid = "range-select" }) {
  return (
    <div data-testid={testid} className="inline-flex items-center rounded-md border border-white/10 bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          data-testid={`range-${o.value}`}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors",
            value === o.value ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Select({ value, onChange, options, placeholder, testid, className }) {
  return (
    <select
      data-testid={testid}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("rounded-md border border-white/10 bg-surface px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/25 cursor-pointer", className)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", testid }) {
  return (
    <input
      data-testid={testid}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full sm:w-56 rounded-md border border-white/10 bg-surface px-3 py-1.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-white/25 font-mono"
    />
  );
}

export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-white/15 bg-[#0A0B0D] px-3 py-2 shadow-xl">
      {label && <div className="mb-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey || p.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-sm" style={{ background: p.color || p.fill }} />
          <span className="text-slate-300 capitalize">{p.name}</span>
          <span className="ml-auto font-mono font-medium text-white tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}
