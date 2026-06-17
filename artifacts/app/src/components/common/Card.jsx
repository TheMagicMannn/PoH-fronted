import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }) {
  return (
    <div className={cn("rounded-md border border-white/8 bg-surface", className)} {...props}>
      {children}
    </div>
  );
}

export function KpiCard({ label, value, sub, accent = "text-white", icon: Icon, trend, testid }) {
  return (
    <Card className="p-4 transition-colors duration-200 hover:border-white/15 hover:bg-surfacehover" data-testid={testid}>
      <div className="flex items-start justify-between">
        <span className="data-label">{label}</span>
        {Icon && <Icon size={16} weight="duotone" className="text-muted-foreground" />}
      </div>
      <div className={cn("mt-2 font-mono text-2xl font-semibold tabular-nums", accent)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      {trend && (
        <div className={cn("mt-1 text-xs font-mono", trend.up ? "text-fraudulent" : "text-trusted")}>
          {trend.up ? "▲" : "▼"} {trend.value}
        </div>
      )}
    </Card>
  );
}

export function SectionTitle({ title, desc, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        {desc && <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-white/10 bg-surface/50 py-16 px-6 text-center">
      {Icon && <Icon size={40} weight="duotone" className="text-muted-foreground/60 mb-3" />}
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {desc && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ className }) {
  return (
    <div className={cn("flex items-center justify-center py-20", className)}>
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-trusted" />
    </div>
  );
}
