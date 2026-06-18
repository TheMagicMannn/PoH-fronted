import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetcher } from "@/lib/api";
import { fmtNum, fmtDateTime } from "@/lib/format";
import { Spinner, Card } from "@/components/common/Card";
import { MagnifyingGlass, ArrowRight, UserCircle } from "@phosphor-icons/react";

const ROLES = ["viewer", "analyst", "admin", "owner"]; // owner shown for filter only, not assignment
const ROLE_COLOR = { owner: "text-fraudulent border-fraudulent/30 bg-fraudulent/10", admin: "text-suspicious border-suspicious/30 bg-suspicious/10", analyst: "text-blue-400 border-blue-400/30 bg-blue-400/10", viewer: "text-slate-400 border-white/10 bg-white/5" };

export default function AdminUsers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, role],
    queryFn: () => fetcher(`/admin/users?${new URLSearchParams({ ...(search && { search }), ...(role && { role }) })}`),
  });

  const users = data?.users ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">All users across all workspaces — {fmtNum(data?.total ?? 0)} total</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-md border border-white/10 bg-surface pl-8 pr-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-trusted/40" />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)}
          className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm text-white outline-none focus:border-trusted/40">
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? <div className="p-8"><Spinner /></div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Workspace</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No users found</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/users/${u.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/8 text-xs font-mono font-semibold text-white shrink-0">
                        {(u.name || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{u.name}</p>
                        <p className="font-mono text-[10px] text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded border px-2 py-0.5 font-mono text-[11px] capitalize ${ROLE_COLOR[u.role] ?? "text-slate-400 border-white/10 bg-white/5"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">{u.workspace_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{u.workspace_plan}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{fmtDateTime(u.created_at)}</td>
                  <td className="px-4 py-3 text-slate-500 hover:text-white"><ArrowRight size={14} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
