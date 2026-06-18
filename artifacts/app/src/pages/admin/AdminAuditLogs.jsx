import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import { fmtNum, fmtDateTime } from "@/lib/format";
import { Spinner, Card } from "@/components/common/Card";
import { MagnifyingGlass } from "@phosphor-icons/react";

const ACTION_COLORS = {
  admin_password_reset: "text-suspicious",
  admin_role_change: "text-blue-400",
  admin_user_deleted: "text-fraudulent",
  member_invited: "text-trusted",
  member_removed: "text-fraudulent",
  member_role_changed: "text-suspicious",
};

export default function AdminAuditLogs() {
  const [search, setSearch] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-logs", search, workspaceId],
    queryFn: () => fetcher(`/admin/audit-logs?${new URLSearchParams({
      limit: "200",
      ...(search && { search }),
      ...(workspaceId && { workspace_id: workspaceId }),
    })}`),
  });

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Global Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All platform activity across every workspace — {fmtNum(data?.total ?? 0)} entries
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, action, or target…"
            className="w-full rounded-md border border-white/10 bg-surface pl-8 pr-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-trusted/40" />
        </div>
        <input value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)}
          placeholder="Filter by workspace ID…"
          className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-trusted/40 w-56" />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? <div className="p-8"><Spinner /></div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Workspace</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Target</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No audit log entries found
                  </td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(l.created_at)}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-300">{l.workspace_name ?? l.workspace_id?.slice(0, 8) ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-300">{l.user_name ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`font-mono text-xs ${ACTION_COLORS[l.action] ?? "text-white"}`}>{l.action}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{l.target ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 max-w-xs truncate">{l.details ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
