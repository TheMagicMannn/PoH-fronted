import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetcher } from "@/lib/api";
import { fmtNum, fmtDateTime } from "@/lib/format";
import { Spinner, Card } from "@/components/common/Card";
import { MagnifyingGlass, Buildings, ArrowRight } from "@phosphor-icons/react";

const PLANS = ["Growth", "Pro", "Enterprise", "Starter"];

export default function AdminWorkspaces() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-workspaces", search, plan],
    queryFn: () => fetcher(`/admin/workspaces?${new URLSearchParams({ ...(search && { search }), ...(plan && { plan }) })}`),
  });

  const workspaces = data?.workspaces ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Workspaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">All customer workspaces — {fmtNum(data?.total ?? 0)} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspaces…"
            className="w-full rounded-md border border-white/10 bg-surface pl-8 pr-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-trusted/40"
          />
        </div>
        <select value={plan} onChange={(e) => setPlan(e.target.value)}
          className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm text-white outline-none focus:border-trusted/40">
          <option value="">All plans</option>
          {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? <div className="p-8"><Spinner /></div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Workspace</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-right font-mono text-[11px] text-slate-500 uppercase tracking-wider">Members</th>
                <th className="px-4 py-3 text-right font-mono text-[11px] text-slate-500 uppercase tracking-wider">Sessions</th>
                <th className="px-4 py-3 text-right font-mono text-[11px] text-slate-500 uppercase tracking-wider">Sites</th>
                <th className="px-4 py-3 text-left font-mono text-[11px] text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {workspaces.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No workspaces found</td></tr>
              )}
              {workspaces.map((w) => (
                <tr key={w.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/workspaces/${w.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-white/8">
                        <Buildings size={14} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{w.name}</p>
                        <p className="font-mono text-[10px] text-slate-500">{w.id.slice(0, 8)}…</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded border px-2 py-0.5 font-mono text-[11px] capitalize
                      ${w.plan === "Enterprise" ? "border-trusted/30 bg-trusted/10 text-trusted"
                      : w.plan === "Pro" ? "border-blue-400/30 bg-blue-400/10 text-blue-400"
                      : "border-white/10 bg-white/5 text-slate-300"}`}>
                      {w.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-slate-300">{fmtNum(w.member_count)}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-slate-300">{fmtNum(w.session_count)}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-slate-300">{fmtNum(w.site_count)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{fmtDateTime(w.created_at)}</td>
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
