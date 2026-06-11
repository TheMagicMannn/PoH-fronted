import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { fetcher } from "@/lib/api";
import { Card, Spinner, EmptyState, SectionTitle } from "@/components/common/Card";
import { ReasonCodes } from "@/components/common/Score";
import { Select } from "@/components/common/Controls";
import { fmtDateTime, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MagnifyingGlass, Fingerprint, Users, Warning, FolderOpen } from "@phosphor-icons/react";

const RISK = {
  critical: "text-fraudulent border-fraudulent/30 bg-fraudulent/10",
  high: "text-suspicious border-suspicious/30 bg-suspicious/10",
  medium: "text-review border-review/30 bg-review/10",
};
const INV_STATUS = {
  open: "text-suspicious border-suspicious/30 bg-suspicious/10",
  in_review: "text-review border-review/30 bg-review/10",
  resolved: "text-trusted border-trusted/30 bg-trusted/10",
};
const STATUS_OPTS = [{ value: "open", label: "Open" }, { value: "in_review", label: "In review" }, { value: "resolved", label: "Resolved" }];

export default function Investigations() {
  const qc = useQueryClient();
  const { data: cl, isLoading: l1 } = useQuery({ queryKey: ["clusters"], queryFn: () => fetcher("/clusters") });
  const { data: inv, isLoading: l2 } = useQuery({ queryKey: ["investigations"], queryFn: () => fetcher("/investigations") });

  const openInv = useMutation({
    mutationFn: (cluster) => api.post("/investigations", { title: `Investigate: ${cluster.name}`, severity: cluster.risk, cluster_id: cluster.id, notes: `Opened from cluster ${cluster.fingerprint_hash}` }),
    onSuccess: () => { toast.success("Investigation opened"); qc.invalidateQueries({ queryKey: ["investigations"] }); },
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/investigations/${id}`, { status }),
    onSuccess: () => { toast.success("Investigation updated"); qc.invalidateQueries({ queryKey: ["investigations"] }); },
  });

  const clusters = cl?.clusters || [];
  const investigations = inv?.investigations || [];

  return (
    <div className="space-y-6" data-testid="investigations-page">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Investigations</h1>
        <p className="mt-1 text-sm text-muted-foreground">Fraud clusters, repeated fingerprints and bot pattern groups — your network memory evidence.</p>
      </div>

      {/* Clusters */}
      <section>
        <SectionTitle title="Fraud Clusters" desc="Recurring fingerprints grouped by attack pattern" />
        {l1 ? <Spinner /> : clusters.length === 0 ? (
          <EmptyState icon={Fingerprint} title="No clusters detected" desc="Clusters appear when the same fingerprint recurs across sessions." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clusters.map((c) => (
              <Card key={c.id} data-testid={`cluster-${c.id}`} className="p-4 transition-colors hover:border-white/15">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-fraudulent/10 border border-fraudulent/20">
                      <Fingerprint size={18} className="text-fraudulent" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white leading-tight">{c.name}</h3>
                      <span className="font-mono text-[10px] text-muted-foreground">{c.fingerprint_hash}</span>
                    </div>
                  </div>
                  <span className={cn("rounded border px-2 py-0.5 font-mono text-[10px] uppercase", RISK[c.risk] || RISK.high)}>{c.risk}</span>
                </div>

                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{c.pattern}</p>

                <div className="mt-3 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300"><Users size={14} className="text-muted-foreground" /> {c.session_count} sessions</span>
                  <span className="flex items-center gap-1.5 text-slate-300"><Warning size={14} className="text-muted-foreground" /> {c.conversion_count} conv.</span>
                </div>

                <div className="mt-3"><ReasonCodes codes={c.reason_codes} max={3} /></div>

                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="font-mono text-[10px] text-muted-foreground">last {timeAgo(c.last_seen)}</span>
                  <button onClick={() => openInv.mutate(c)} data-testid={`investigate-${c.id}`} className="flex items-center gap-1.5 rounded-md border border-white/10 bg-surface px-2.5 py-1.5 text-xs font-medium text-white hover:border-trusted/40 hover:text-trusted transition-colors">
                    <MagnifyingGlass size={13} /> Investigate
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Investigations */}
      <section>
        <SectionTitle title="Open Investigations" desc="Case workspace for analysts" />
        {l2 ? <Spinner /> : investigations.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No investigations" desc="Open one from a fraud cluster above." />
        ) : (
          <div className="space-y-3">
            {investigations.map((i) => (
              <Card key={i.id} data-testid={`investigation-${i.id}`} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{i.title}</h3>
                      <span className={cn("rounded border px-2 py-0.5 font-mono text-[10px] uppercase", INV_STATUS[i.status] || INV_STATUS.open)}>{i.status.replace("_", " ")}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Assignee: {i.assignee} · opened {fmtDateTime(i.created_at)}</p>
                    {i.notes?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {i.notes.slice(-2).map((n, idx) => (
                          <p key={idx} className="text-xs text-slate-400"><span className="text-slate-300">{n.author}:</span> {n.text}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  <Select value={i.status} onChange={(status) => setStatus.mutate({ id: i.id, status })} options={STATUS_OPTS} placeholder="Status" testid={`inv-status-${i.id}`} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
