import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { fetcher } from "@/lib/api";
import { Card, Spinner, EmptyState, KpiCard } from "@/components/common/Card";
import { RangeSelect, Select } from "@/components/common/Controls";
import { StatusBadge, ConvStatusBadge } from "@/components/common/StatusBadge";
import { ScoreBar, ReasonCodes } from "@/components/common/Score";
import { fmtCurrency, timeAgo, fmtNum, fmtPct } from "@/lib/format";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Target, DotsThreeVertical, CheckCircle, Eye, ProhibitInset, MinusCircle } from "@phosphor-icons/react";

const STATUSES = [{ value: "accepted", label: "Accepted" }, { value: "review", label: "Review" }, { value: "suppressed", label: "Suppressed" }, { value: "blocked", label: "Blocked" }];
const TYPES = [{ value: "lead", label: "Lead" }, { value: "signup", label: "Signup" }, { value: "purchase", label: "Purchase" }];
const CLASSES = [{ value: "trusted", label: "Trusted" }, { value: "suspicious", label: "Suspicious" }, { value: "fraudulent", label: "Fraudulent" }];

export default function Conversions() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ range: "30d", status: "", classification: "", type: "" });
  const params = new URLSearchParams({ range: filters.range, page_size: 100 });
  ["status", "classification", "type"].forEach((k) => filters[k] && params.set(k, filters[k]));
  const { data, isLoading } = useQuery({ queryKey: ["conversions", filters], queryFn: () => fetcher(`/conversions?${params}`) });
  const set = (k) => (v) => setFilters({ ...filters, [k]: v });

  const act = useMutation({
    mutationFn: ({ id, status }) => api.post(`/conversions/${id}/action`, { status }),
    onSuccess: (_, { status }) => {
      toast.success(`Conversion set to ${status}`);
      qc.invalidateQueries({ queryKey: ["conversions"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
    },
    onError: () => toast.error("Action failed"),
  });

  const items = data?.items || [];
  const totalValue = items.filter((c) => c.status === "accepted").reduce((s, c) => s + (c.value || 0), 0);
  const invalid = items.filter((c) => c.classification !== "trusted").length;
  const suppressed = items.filter((c) => ["suppressed", "blocked"].includes(c.status)).length;

  return (
    <div className="space-y-5" data-testid="conversions-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Conversions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Conversion trust scoring with suppression &amp; block decisions.</p>
        </div>
        <RangeSelect value={filters.range} onChange={set("range")} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Conversions" value={fmtNum(items.length)} icon={Target} />
        <KpiCard label="Trusted Value" value={fmtCurrency(totalValue)} accent="text-trusted" sub="accepted only" />
        <KpiCard label="Invalid" value={fmtNum(invalid)} accent="text-suspicious" sub={fmtPct(items.length ? (invalid / items.length) * 100 : 0)} />
        <KpiCard label="Suppressed / Blocked" value={fmtNum(suppressed)} accent="text-fraudulent" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filters.status} onChange={set("status")} options={STATUSES} placeholder="All statuses" testid="filter-status" />
        <Select value={filters.classification} onChange={set("classification")} options={CLASSES} placeholder="All classifications" testid="filter-class" />
        <Select value={filters.type} onChange={set("type")} options={TYPES} placeholder="All types" testid="filter-type" />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? <Spinner /> : items.length === 0 ? (
          <EmptyState icon={Target} title="No conversions" desc="No conversions match the current filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left">
                  {["Conversion", "Type", "Value", "Source / Campaign", "Fraud", "Reason codes", "Trust", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 data-label font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} data-testid={`conversion-row-${c.id}`} className="border-b border-white/5 transition-colors hover:bg-surfacehover">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-slate-200">#{c.id.slice(0, 8)}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize text-slate-200">{c.type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-200">{c.value ? fmtCurrency(c.value) : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-200">{c.source}</div>
                      <div className="truncate max-w-[150px] text-[11px] text-muted-foreground">{c.campaign}</div>
                    </td>
                    <td className="px-4 py-3"><ScoreBar score={c.fraud_score} /></td>
                    <td className="px-4 py-3"><ReasonCodes codes={c.reason_codes} max={2} /></td>
                    <td className="px-4 py-3"><StatusBadge status={c.classification} /></td>
                    <td className="px-4 py-3"><ConvStatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button data-testid={`conv-action-${c.id}`} className="rounded p-1 text-muted-foreground hover:text-white hover:bg-white/10"><DotsThreeVertical size={18} weight="bold" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-white/10 bg-popover">
                          <DropdownMenuItem onClick={() => act.mutate({ id: c.id, status: "accepted" })} className="gap-2 text-trusted focus:text-trusted focus:bg-trusted/10"><CheckCircle size={15} /> Accept</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => act.mutate({ id: c.id, status: "review" })} className="gap-2 text-review focus:text-review focus:bg-review/10"><Eye size={15} /> Route to review</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => act.mutate({ id: c.id, status: "suppressed" })} className="gap-2 text-suspicious focus:text-suspicious focus:bg-suspicious/10"><MinusCircle size={15} /> Suppress</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => act.mutate({ id: c.id, status: "blocked" })} className="gap-2 text-fraudulent focus:text-fraudulent focus:bg-fraudulent/10"><ProhibitInset size={15} /> Block</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
