import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { fetcher } from "@/lib/api";
import { fmtNum, fmtDateTime } from "@/lib/format";
import { Spinner, Card } from "@/components/common/Card";
import { ArrowLeft, Buildings, Users, Globe, ListBullets, ShieldCheck } from "@phosphor-icons/react";
import { toast } from "sonner";

const TABS = ["Members", "Sites", "Audit Log"];
const PLANS = ["Starter", "Growth", "Pro", "Enterprise"];

export default function AdminWorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("Members");
  const [editPlan, setEditPlan] = useState(false);
  const [plan, setPlan] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-workspace", id],
    queryFn: () => fetcher(`/admin/workspaces/${id}`),
  });

  useEffect(() => {
    if (data?.workspace?.plan) setPlan(data.workspace.plan);
  }, [data]);

  const updatePlan = useMutation({
    mutationFn: () => api.patch(`/admin/workspaces/${id}`, { plan }),
    onSuccess: () => { toast.success("Plan updated"); qc.invalidateQueries({ queryKey: ["admin-workspace", id] }); setEditPlan(false); },
    onError: () => toast.error("Failed to update plan"),
  });

  const resetPassword = useMutation({
    mutationFn: ({ uid, pwd }) => api.post(`/admin/users/${uid}/reset-password`, { new_password: pwd }),
    onSuccess: () => toast.success("Password reset successfully"),
    onError: () => toast.error("Failed to reset password"),
  });

  if (isLoading) return <Spinner />;
  if (!data) return <p className="text-muted-foreground p-8">Workspace not found</p>;

  const { workspace: ws, members = [], sites = [], audit_logs = [] } = data;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate("/admin/workspaces")}
            className="mb-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft size={12} /> All workspaces
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/8 border border-white/10">
              <Buildings size={20} className="text-slate-300" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-white">{ws.name}</h1>
              <p className="font-mono text-xs text-slate-500">{ws.id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-8">
          {editPlan ? (
            <div className="flex items-center gap-2">
              <select value={plan} onChange={(e) => setPlan(e.target.value)}
                className="rounded border border-white/10 bg-surface px-2 py-1.5 text-sm text-white outline-none">
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={() => updatePlan.mutate()}
                className="rounded bg-trusted px-3 py-1.5 text-xs font-semibold text-black hover:bg-trusted/80">Save</button>
              <button onClick={() => setEditPlan(false)} className="text-xs text-muted-foreground hover:text-white">Cancel</button>
            </div>
          ) : (
            <button onClick={() => { setEditPlan(true); setPlan(ws.plan); }}
              className="rounded border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:border-white/25 hover:text-white transition-colors">
              Change plan ({ws.plan})
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Members", value: fmtNum(members.length), icon: Users },
          { label: "Sites", value: fmtNum(sites.length), icon: Globe },
          { label: "Audit entries", value: fmtNum(audit_logs.length), icon: ListBullets },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex items-center gap-3 p-4">
            <Icon size={20} className="text-slate-500 shrink-0" />
            <div>
              <p className="font-mono text-lg font-semibold text-white">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/8">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
              ${tab === t ? "border-trusted text-white" : "border-transparent text-muted-foreground hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {tab === "Members" && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-right font-mono text-[11px] text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-white/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{m.name}</p>
                    <p className="font-mono text-xs text-slate-500">{m.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] capitalize text-slate-300">{m.role}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{fmtDateTime(m.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        const pwd = prompt(`New password for ${m.email} (min 8 chars):`);
                        if (pwd && pwd.length >= 8) resetPassword.mutate({ uid: m.id, pwd });
                        else if (pwd) alert("Password must be at least 8 characters");
                      }}
                      className="rounded border border-white/10 px-2 py-1 text-xs text-slate-400 hover:border-white/25 hover:text-white transition-colors">
                      Reset password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Sites tab */}
      {tab === "Sites" && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Site</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Domain</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">SDK Key</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {sites.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No sites configured</td></tr>
              )}
              {sites.map((s) => (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{s.domain}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.sdk_key?.slice(0, 16)}…</td>
                  <td className="px-4 py-3">
                    <div className={`flex items-center gap-1.5 ${s.verified ? "text-trusted" : "text-suspicious"}`}>
                      <ShieldCheck size={13} weight={s.verified ? "fill" : "regular"} />
                      <span className="font-mono text-xs">{s.verified ? "Verified" : "Pending"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Audit Log tab */}
      {tab === "Audit Log" && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Target</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              {audit_logs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No audit log entries</td></tr>
              )}
              {audit_logs.map((l) => (
                <tr key={l.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(l.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-slate-300">{l.user_name ?? "—"}</td>
                  <td className="px-4 py-3"><span className="font-mono text-xs text-white">{l.action}</span></td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{l.target ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{l.details ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
