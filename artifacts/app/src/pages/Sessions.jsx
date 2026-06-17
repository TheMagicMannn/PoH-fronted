import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSite } from "@/context/SiteContext";
import { fetcher } from "@/lib/api";
import { Card, Spinner, EmptyState } from "@/components/common/Card";
import { RangeSelect, Select, SearchInput } from "@/components/common/Controls";
import { StatusBadge, ActionBadge } from "@/components/common/StatusBadge";
import { ScoreBar, ReasonCodes } from "@/components/common/Score";
import { fmtDateTime, timeAgo } from "@/lib/format";
import SessionDrawer from "./SessionDrawer";
import { Pulse, CaretLeft, CaretRight } from "@phosphor-icons/react";

const CLASSES = [{ value: "trusted", label: "Trusted" }, { value: "suspicious", label: "Suspicious" }, { value: "fraudulent", label: "Fraudulent" }];
const SOURCES = ["google", "meta", "bing", "direct", "newsletter"];
const DEVICES = ["Desktop", "Mobile", "Tablet"];
const ACTIONS = [{ value: "observe", label: "Observe" }, { value: "flag", label: "Flag" }, { value: "review", label: "Review" }, { value: "block", label: "Block" }];

export default function Sessions() {
  const [filters, setFilters] = useState({ range: "30d", classification: "", source: "", device: "", action: "", search: "" });
  const [page, setPage] = useState(1);
  const [activeId, setActiveId] = useState(null);
  const { siteId } = useSite();
  const pageSize = 20;

  const params = new URLSearchParams({ range: filters.range, page, page_size: pageSize });
  ["classification", "source", "device", "action", "search"].forEach((k) => filters[k] && params.set(k, filters[k]));
  if (siteId) params.set("site_id", siteId);

  const { data, isLoading } = useQuery({ queryKey: ["sessions", filters, page, siteId], queryFn: () => fetcher(`/sessions?${params}`) });

  const set = (k) => (v) => { setFilters({ ...filters, [k]: v }); setPage(1); };
  const items = data?.items || [];
  const total = data?.total || 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5" data-testid="sessions-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Session Intelligence</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every scored session with fingerprint signals, reason codes and recommended action.</p>
        </div>
        <RangeSelect value={filters.range} onChange={set("range")} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={filters.search} onChange={set("search")} placeholder="IP, fingerprint, campaign…" testid="sessions-search" />
        <Select value={filters.classification} onChange={set("classification")} options={CLASSES} placeholder="All classifications" testid="filter-classification" />
        <Select value={filters.source} onChange={set("source")} options={SOURCES} placeholder="All sources" testid="filter-source" />
        <Select value={filters.device} onChange={set("device")} options={DEVICES} placeholder="All devices" testid="filter-device" />
        <Select value={filters.action} onChange={set("action")} options={ACTIONS} placeholder="All actions" testid="filter-action" />
        <span className="ml-auto font-mono text-xs text-muted-foreground">{total.toLocaleString()} sessions</span>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState icon={Pulse} title="No sessions match" desc="Adjust filters or widen the time range." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left">
                  {["Session", "Source / Campaign", "Geo · Device", "Fingerprint", "Fraud", "Signals", "Status", "Action"].map((h) => (
                    <th key={h} className="px-4 py-2.5 data-label font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setActiveId(s.id)}
                    data-testid={`session-row-${s.id}`}
                    className="group cursor-pointer border-b border-white/5 transition-colors hover:bg-surfacehover"
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-slate-200">{s.session_id.slice(0, 14)}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{timeAgo(s.started_at)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-200">{s.source} · {s.medium}</div>
                      <div className="truncate max-w-[160px] text-[11px] text-muted-foreground">{s.campaign}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-200">{s.country}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{s.device_type} · {s.browser}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{s.fingerprint_hash}</td>
                    <td className="px-4 py-3"><ScoreBar score={s.fraud_score} /></td>
                    <td className="px-4 py-3"><ReasonCodes codes={s.reason_codes} max={2} /></td>
                    <td className="px-4 py-3"><StatusBadge status={s.classification} /></td>
                    <td className="px-4 py-3"><ActionBadge action={s.action} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">Page {page} of {pages}</span>
          <div className="flex gap-1.5">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="flex items-center gap-1 rounded-md border border-white/10 bg-surface px-3 py-1.5 text-xs text-white disabled:opacity-40 hover:border-white/25">
              <CaretLeft size={14} /> Prev
            </button>
            <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="flex items-center gap-1 rounded-md border border-white/10 bg-surface px-3 py-1.5 text-xs text-white disabled:opacity-40 hover:border-white/25">
              Next <CaretRight size={14} />
            </button>
          </div>
        </div>
      )}

      <SessionDrawer sessionId={activeId} open={!!activeId} onClose={() => setActiveId(null)} />
    </div>
  );
}
