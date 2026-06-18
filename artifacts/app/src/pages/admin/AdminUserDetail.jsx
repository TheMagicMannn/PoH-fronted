import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { fetcher } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { Spinner, Card } from "@/components/common/Card";
import { ArrowLeft, LockKey, UserCircle, Buildings, ListBullets, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

const ROLES = ["viewer", "analyst", "admin", "owner"];
const ROLE_COLOR = { owner: "text-fraudulent", admin: "text-suspicious", analyst: "text-blue-400", viewer: "text-slate-400" };

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [newPwd, setNewPwd] = useState("");
  const [newRole, setNewRole] = useState("");
  const [showPwdForm, setShowPwdForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => fetcher(`/admin/users/${id}`),
  });

  useEffect(() => {
    if (data?.user?.role) setNewRole(data.user.role);
  }, [data]);

  const resetPwd = useMutation({
    mutationFn: () => api.post(`/admin/users/${id}/reset-password`, { new_password: newPwd }),
    onSuccess: () => { toast.success("Password reset successfully"); setNewPwd(""); setShowPwdForm(false); },
    onError: (e) => toast.error(e?.response?.data?.detail ?? "Failed"),
  });

  const changeRole = useMutation({
    mutationFn: () => api.patch(`/admin/users/${id}`, { role: newRole }),
    onSuccess: () => { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["admin-user", id] }); },
    onError: (e) => toast.error(e?.response?.data?.detail ?? "Failed"),
  });

  const deleteUser = useMutation({
    mutationFn: () => api.delete(`/admin/users/${id}`),
    onSuccess: () => { toast.success("User deleted"); navigate("/admin/users"); },
    onError: (e) => toast.error(e?.response?.data?.detail ?? "Failed"),
  });

  if (isLoading) return <Spinner />;
  if (!data) return <p className="text-muted-foreground p-8">User not found</p>;

  const { user, workspace, audit_logs = [] } = data;

  return (
    <div className="space-y-5">
      <div>
        <button onClick={() => navigate("/admin/users")}
          className="mb-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft size={12} /> All users
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-lg font-mono font-semibold text-white">
              {(user.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-white">{user.name}</h1>
              <p className="font-mono text-sm text-slate-400">{user.email}</p>
              <p className={`font-mono text-xs capitalize mt-0.5 ${ROLE_COLOR[user.role] ?? "text-slate-400"}`}>{user.role}</p>
            </div>
          </div>
          <button
            onClick={() => { if (confirm(`Delete user ${user.email}? This cannot be undone.`)) deleteUser.mutate(); }}
            className="flex items-center gap-1.5 rounded border border-fraudulent/25 bg-fraudulent/10 px-3 py-1.5 text-xs font-medium text-fraudulent hover:bg-fraudulent/20 transition-colors">
            <Trash size={13} /> Delete user
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Workspace */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 mb-3">
            <Buildings size={15} />
            <span className="font-mono text-xs uppercase tracking-wider">Workspace</span>
          </div>
          {workspace ? (
            <>
              <p className="font-medium text-white">{workspace.name}</p>
              <p className="font-mono text-xs text-slate-500">{workspace.plan}</p>
              <button onClick={() => navigate(`/admin/workspaces/${workspace.id}`)}
                className="mt-1 text-xs text-trusted hover:underline">View workspace →</button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No workspace</p>
          )}
        </Card>

        {/* Change role */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 mb-3">
            <UserCircle size={15} />
            <span className="font-mono text-xs uppercase tracking-wider">Change Role</span>
          </div>
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
            className="w-full rounded border border-white/10 bg-surface px-2 py-1.5 text-sm text-white outline-none">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={() => changeRole.mutate()} disabled={newRole === user.role || changeRole.isPending}
            className="w-full rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50 transition-colors">
            {changeRole.isPending ? "Saving…" : "Update role"}
          </button>
        </Card>

        {/* Reset password */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 mb-3">
            <LockKey size={15} />
            <span className="font-mono text-xs uppercase tracking-wider">Reset Password</span>
          </div>
          {showPwdForm ? (
            <div className="space-y-2">
              <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                placeholder="New password (min 8 chars)"
                className="w-full rounded border border-white/10 bg-surface px-2 py-1.5 text-sm text-white placeholder:text-slate-600 outline-none" />
              <div className="flex gap-2">
                <button onClick={() => resetPwd.mutate()} disabled={newPwd.length < 8 || resetPwd.isPending}
                  className="flex-1 rounded bg-trusted px-3 py-1.5 text-xs font-semibold text-black hover:bg-trusted/80 disabled:opacity-50">
                  {resetPwd.isPending ? "Saving…" : "Reset"}
                </button>
                <button onClick={() => { setShowPwdForm(false); setNewPwd(""); }}
                  className="text-xs text-muted-foreground hover:text-white px-2">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowPwdForm(true)}
              className="w-full rounded border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-white/25 hover:text-white transition-colors">
              Set new password
            </button>
          )}
        </Card>
      </div>

      {/* Audit log */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
          <ListBullets size={15} className="text-slate-400" />
          <h2 className="text-sm font-medium text-white">Workspace Audit Log</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="px-4 py-2.5 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Time</th>
              <th className="px-4 py-2.5 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Action</th>
              <th className="px-4 py-2.5 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Target</th>
              <th className="px-4 py-2.5 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody>
            {audit_logs.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">No audit log entries</td></tr>
            )}
            {audit_logs.map((l) => (
              <tr key={l.id} className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(l.created_at)}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-white">{l.action}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{l.target ?? "—"}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{l.details ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
