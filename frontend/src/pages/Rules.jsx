import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { fetcher } from "@/lib/api";
import { Card, Spinner, EmptyState } from "@/components/common/Card";
import { ActionBadge } from "@/components/common/StatusBadge";
import { Select } from "@/components/common/Controls";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ShieldCheck, Plus, Trash, Sliders, Lightning, X } from "@phosphor-icons/react";

const FIELDS = [
  { value: "fraud_score", label: "Fraud score" },
  { value: "confidence", label: "Confidence" },
  { value: "trust_score", label: "Trust score" },
  { value: "classification", label: "Classification" },
  { value: "source", label: "Source" },
  { value: "country", label: "Country" },
  { value: "device_type", label: "Device" },
];
const OPS = [
  { value: "gte", label: "≥" }, { value: "gt", label: ">" }, { value: "lte", label: "≤" },
  { value: "lt", label: "<" }, { value: "eq", label: "=" }, { value: "neq", label: "≠" }, { value: "contains", label: "contains" },
];
const ACTIONS = [{ value: "observe", label: "Observe" }, { value: "flag", label: "Flag" }, { value: "review", label: "Route to review" }, { value: "block", label: "Block" }];

const SENSITIVITY = {
  conservative: { block: 85, review: 65, flag: 45 },
  balanced: { block: 75, review: 50, flag: 30 },
  aggressive: { block: 60, review: 35, flag: 20 },
};

function RuleDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", action: "flag", priority: 50 });
  const [conditions, setConditions] = useState([{ field: "fraud_score", op: "gte", value: "60" }]);
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: () => api.post("/rules", {
      ...form, priority: Number(form.priority), enabled: true,
      conditions: conditions.map((c) => ({ ...c, value: isNaN(Number(c.value)) ? c.value : Number(c.value) })),
    }),
    onSuccess: () => {
      toast.success("Rule created");
      qc.invalidateQueries({ queryKey: ["rules"] });
      setOpen(false); setForm({ name: "", description: "", action: "flag", priority: 50 });
      setConditions([{ field: "fraud_score", op: "gte", value: "60" }]);
      onCreated?.();
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Failed to create rule"),
  });

  const updateCond = (i, k, v) => setConditions(conditions.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button data-testid="new-rule-button" className="flex items-center gap-2 rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-black hover:bg-trusted transition-colors">
          <Plus size={16} weight="bold" /> New rule
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg border-white/10 bg-popover">
        <DialogHeader><DialogTitle className="font-heading text-white">Create trust policy</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <label className="block">
            <span className="data-label">Rule name</span>
            <input data-testid="rule-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Block headless automation" className="mt-1.5 w-full rounded-md border border-white/10 bg-surface px-3 py-2 text-sm text-white outline-none focus:border-white/30" />
          </label>
          <label className="block">
            <span className="data-label">Description</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional context" className="mt-1.5 w-full rounded-md border border-white/10 bg-surface px-3 py-2 text-sm text-white outline-none focus:border-white/30" />
          </label>

          <div>
            <span className="data-label">When ALL conditions match</span>
            <div className="mt-1.5 space-y-2">
              {conditions.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Select value={c.field} onChange={(v) => updateCond(i, "field", v)} options={FIELDS} placeholder="Field" className="flex-1" />
                  <Select value={c.op} onChange={(v) => updateCond(i, "op", v)} options={OPS} placeholder="Op" />
                  <input value={c.value} onChange={(e) => updateCond(i, "value", e.target.value)} className="w-24 rounded-md border border-white/10 bg-surface px-2 py-1.5 text-xs text-white outline-none focus:border-white/30 font-mono" />
                  {conditions.length > 1 && <button onClick={() => setConditions(conditions.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-fraudulent"><X size={16} /></button>}
                </div>
              ))}
              <button onClick={() => setConditions([...conditions, { field: "source", op: "eq", value: "" }])} className="flex items-center gap-1 text-xs text-trusted hover:underline"><Plus size={12} /> Add condition</button>
            </div>
          </div>

          <div className="flex gap-3">
            <label className="flex-1">
              <span className="data-label">Action</span>
              <Select value={form.action} onChange={(v) => setForm({ ...form, action: v })} options={ACTIONS} placeholder="Action" className="mt-1.5 w-full" />
            </label>
            <label className="w-28">
              <span className="data-label">Priority</span>
              <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="mt-1.5 w-full rounded-md border border-white/10 bg-surface px-3 py-2 text-sm text-white outline-none focus:border-white/30 font-mono" />
            </label>
          </div>
        </div>
        <DialogFooter>
          <button onClick={() => create.mutate()} disabled={!form.name || create.isPending} data-testid="rule-save" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-trusted disabled:opacity-50">
            {create.isPending ? "Creating…" : "Create rule"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Rules() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["rules"], queryFn: () => fetcher("/rules") });
  const { data: ws } = useQuery({ queryKey: ["workspace"], queryFn: () => fetcher("/workspace") });
  const sensitivity = ws?.workspace?.sensitivity_profile || "balanced";
  const t = SENSITIVITY[sensitivity];

  const toggle = useMutation({
    mutationFn: ({ id, enabled }) => api.patch(`/rules/${id}`, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rules"] }),
  });
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/rules/${id}`),
    onSuccess: () => { toast.success("Rule deleted"); qc.invalidateQueries({ queryKey: ["rules"] }); },
  });

  const rules = data?.rules || [];

  return (
    <div className="space-y-5" data-testid="rules-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Rules &amp; Actions</h1>
          <p className="mt-1 text-sm text-muted-foreground">If/then trust policies that decide observe, flag, review or block.</p>
        </div>
        <RuleDialog />
      </div>

      {/* Sensitivity baseline */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sliders size={16} className="text-trusted" />
          <h2 className="text-sm font-semibold text-white">Baseline sensitivity · <span className="capitalize text-trusted">{sensitivity}</span></h2>
          <span className="ml-2 text-xs text-muted-foreground">Default thresholds applied before custom rules</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { k: "flag", label: "Flag at", box: "border-suspicious/20", text: "text-suspicious" },
            { k: "review", label: "Review at", box: "border-review/20", text: "text-review" },
            { k: "block", label: "Block at", box: "border-fraudulent/20", text: "text-fraudulent" },
          ].map((x) => (
            <div key={x.k} className={cn("rounded-md border bg-surface p-3", x.box)}>
              <div className="data-label">{x.label}</div>
              <div className={cn("mt-1 font-mono text-xl font-semibold", x.text)}>≥ {t[x.k]}</div>
              <div className="text-[10px] text-muted-foreground">fraud score</div>
            </div>
          ))}
        </div>
      </Card>

      {isLoading ? <Spinner /> : rules.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No rules yet" desc="Create your first trust policy to automate actions." />
      ) : (
        <div className="space-y-3">
          {rules.map((r) => (
            <Card key={r.id} data-testid={`rule-${r.id}`} className="p-4 transition-colors hover:border-white/15">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-semibold text-white">{r.name}</h3>
                    <ActionBadge action={r.action} />
                    <span className="font-mono text-[10px] text-muted-foreground">P{r.priority}</span>
                  </div>
                  {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {r.conditions.map((c, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                        <Lightning size={10} className="text-trusted" /> {c.field} {OPS.find((o) => o.value === c.op)?.label || c.op} {String(c.value)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="font-mono text-sm text-white">{r.hits ?? 0}</div>
                    <div className="data-label">hits</div>
                  </div>
                  <Switch checked={r.enabled} onCheckedChange={(v) => toggle.mutate({ id: r.id, enabled: v })} data-testid={`rule-toggle-${r.id}`} className="data-[state=checked]:bg-trusted" />
                  <button onClick={() => remove.mutate(r.id)} data-testid={`rule-delete-${r.id}`} className="rounded p-1.5 text-muted-foreground hover:text-fraudulent hover:bg-fraudulent/10"><Trash size={16} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
