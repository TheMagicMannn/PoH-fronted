import { cn } from "@/lib/utils";
import { statusConfig, actionConfig, convStatusConfig } from "@/lib/format";

export function StatusBadge({ status, className }) {
  const c = statusConfig[status] || statusConfig.trusted;
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium font-mono whitespace-nowrap", c.bg, c.border, c.text, className)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

export function ActionBadge({ action, className }) {
  const c = actionConfig[action] || actionConfig.observe;
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium font-mono uppercase tracking-wide", c.bg, c.border, c.text, className)}>
      {c.label}
    </span>
  );
}

export function ConvStatusBadge({ status, className }) {
  const c = convStatusConfig[status] || convStatusConfig.accepted;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium font-mono", c.bg, c.border, c.text, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
