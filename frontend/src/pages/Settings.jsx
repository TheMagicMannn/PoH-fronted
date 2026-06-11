import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { fetcher } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, Spinner, SectionTitle } from "@/components/common/Card";
import { Select } from "@/components/common/Controls";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { UserPlus, Trash, ShieldCheck, Scroll, Gauge } from "@phosphor-icons/react";

const PROFILES = [
  { value: "conservative", label: "Conservative", desc: "Fewer false positives. Block only the clearest fraud." },
  { value: "balanced", label: "Balanced", desc: "Recommended. Strong protection with low friction." },
  { value: "aggressive", label: "Aggressive", desc: "Maximum protection. Higher chance of false positives." },
];
const ROLES = [{ value: "viewer", label: "Viewer" }, { value: "analyst", label: "Analyst" }, { value: "admin", label: "Admin" }];

function InviteDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "analyst", password: "ChangeMe2026!" });
  const invite = useMutation({
    mutationFn: () => api.post("/workspace/members", form),
    onSuccess: () => { toast.success("Member invited"); qc.invalidateQueries({ queryKey: ["members"] }); setOpen(false); },
    onError: (e) => toast.error(e.response?.data?.detail || "Invite failed"),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button data-testid="invite-member-button" className="flex items-center gap-2 rounded-md border border-white/10 bg-surface px-3 py-1.5 text-sm font-medium text-white hover:border-white/25"><UserPlus size={16} /> Invite</button>
      </DialogTrigger>
      <DialogContent className="max-w-md border-white/10 bg-popover">
        <DialogHeader><DialogTitle className="font-heading text-white">Invite teammate</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {[["name", "Full name", "text"], ["email", "Work email", "email"], ["password", "Temp password", "text"]].map(([k, label, type]) => (
            <label key={k} className="block">
              <span className="data-label">{label}</span>
              <input type={type} value={form[k]} data-testid={`invite-${k}`} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="mt-1.5 w-full rounded-md border border-white/10 bg-surface px-3 py-2 text-sm text-white outline-none focus:border-white/30" />
            </label>
          ))}
          <label className="block">
            <span className="data-label">Role</span>
            <Select value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={ROLES} placeholder="Role" className="mt-1.5 w-full" />
          </label>
        </div>
        <DialogFooter>
          <button onClick={() => invite.mutate()} disabled={!form.name || !form.email || invite.isPending} data-testid="invite-submit" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-trusted disabled:opacity-50">Send invite</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Settings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: ws } = useQuery({ queryKey: ["workspace"], queryFn: () => fetcher("/workspace") });
  const { data: mem, isLoading: lm } = useQuery({ queryKey: ["members"], queryFn: () => fetcher("/workspace/members") });
  const { data: audit, isLoading: la } = useQuery({ queryKey: ["audit-logs"], queryFn: () => fetcher("/audit-logs") });

  const setSensitivity = useMutation({
    mutationFn: (sensitivity_profile) => api.patch("/workspace", { sensitivity_profile }),
    onSuccess: () => { toast.success("Sensitivity updated"); qc.invalidateQueries({ queryKey: ["workspace"] }); qc.invalidateQueries({ queryKey: ["audit-logs"] }); },
  });
  const removeMember = useMutation({
    mutationFn: (id) => api.delete(`/workspace/members/${id}`),
    onSuccess: () => { toast.success("Member removed"); qc.invalidateQueries({ queryKey: ["members"] }); },
    onError: (e) => toast.error(e.response?.data?.detail || "Failed"),
  });

  const workspace = ws?.workspace;
  const members = mem?.members || [];
  const logs = audit?.logs || [];
  const current = workspace?.sensitivity_profile || "balanced";

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Workspace Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sensitivity, team access and audit history.</p>
      </div>

      {/* Sensitivity */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4"><Gauge size={18} className="text-trusted" /><h2 className="font-semibold text-white">Detection Sensitivity</h2></div>
        <div className="grid gap-3 md:grid-cols-3">
          {PROFILES.map((p) => (
            <button
              key={p.value}
              data-testid={`sensitivity-${p.value}`}
              onClick={() => setSensitivity.mutate(p.value)}
              className={cn("rounded-md border p-4 text-left transition-all", current === p.value ? "border-trusted/40 bg-trusted/5 ring-1 ring-trusted/20" : "border-white/10 bg-surface hover:border-white/20")}
            >
              <div className="flex items-center justify-between">
                <span className={cn("font-semibold", current === p.value ? "text-trusted" : "text-white")}>{p.label}</span>
                {current === p.value && <ShieldCheck size={16} weight="fill" className="text-trusted" />}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Members */}
      <Card className="p-5">
        <SectionTitle title="Team Members" desc="Role-based workspace access">
          <InviteDialog />
        </SectionTitle>
        {lm ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/8 text-left">{["Member", "Email", "Role", ""].map((h) => <th key={h} className="px-3 py-2 data-label font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} data-testid={`member-${m.id}`} className="border-b border-white/5">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 font-mono text-xs font-semibold text-white">{m.name?.slice(0, 1).toUpperCase()}</div>
                        <span className="text-slate-200">{m.name}{m.id === user?.id && <span className="ml-1.5 text-[10px] text-trusted">you</span>}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{m.email}</td>
                    <td className="px-3 py-3"><span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] capitalize text-slate-300">{m.role}</span></td>
                    <td className="px-3 py-3 text-right">
                      {m.id !== user?.id && <button onClick={() => removeMember.mutate(m.id)} data-testid={`remove-member-${m.id}`} className="rounded p-1.5 text-muted-foreground hover:text-fraudulent hover:bg-fraudulent/10"><Trash size={15} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Audit log */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4"><Scroll size={18} className="text-trusted" /><h2 className="font-semibold text-white">Audit Log</h2></div>
        {la ? <Spinner /> : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <div className="space-y-0.5">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center gap-3 border-b border-white/5 py-2.5 text-sm">
                <span className="font-mono text-[11px] text-muted-foreground w-28 shrink-0">{fmtDateTime(l.created_at)}</span>
                <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-400 shrink-0">{l.action}</span>
                <span className="text-slate-300 truncate"><span className="text-white">{l.user_name}</span> · {l.details}</span>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground truncate max-w-[160px] shrink-0">{l.target}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
