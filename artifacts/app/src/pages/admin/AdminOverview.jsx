import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import { fmtNum, fmtPct } from "@/lib/format";
import { Spinner, Card, KpiCard } from "@/components/common/Card";
import { Buildings, Users, Pulse, ShieldWarning, Gauge, Warning } from "@phosphor-icons/react";

export default function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetcher("/admin/stats"),
    refetchInterval: 30000,
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Platform Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real-time stats across all workspaces and customers.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Workspaces"   value={fmtNum(data?.total_workspaces)}   icon={Buildings}     />
        <KpiCard label="Users"        value={fmtNum(data?.total_users)}         icon={Users}         />
        <KpiCard label="Total Sessions" value={fmtNum(data?.total_sessions)}   icon={Pulse}         />
        <KpiCard label="Fraud Rate"   value={`${data?.fraud_rate ?? 0}%`}       icon={ShieldWarning} accent="text-suspicious" />
        <KpiCard label="Avg Trust Score" value={fmtNum(data?.avg_trust_score)} icon={Gauge}         accent={(data?.avg_trust_score ?? 0) >= 70 ? "text-trusted" : "text-suspicious"} />
        <KpiCard label="Active Alerts" value={fmtNum(data?.active_alerts ?? 0)} icon={Warning}      accent="text-suspicious" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-heading text-base font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: "View all workspaces", href: "/admin/workspaces" },
              { label: "View all users", href: "/admin/users" },
              { label: "Global audit log", href: "/admin/audit-logs" },
            ].map(({ label, href }) => (
              <a key={href} href={href}
                className="flex items-center justify-between rounded-md border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-slate-300 hover:border-white/20 hover:text-white transition-colors">
                {label}
                <span className="text-muted-foreground">→</span>
              </a>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-heading text-base font-semibold text-white mb-4">Platform Health</h2>
          <div className="space-y-3">
            {[
              { label: "Fraud detection rate", value: `${data?.fraud_rate ?? 0}%`, ok: (data?.fraud_rate ?? 0) < 30 },
              { label: "Avg session trust score", value: fmtNum(data?.avg_trust_score ?? 0), ok: (data?.avg_trust_score ?? 0) >= 60 },
              { label: "Active workspaces", value: fmtNum(data?.total_workspaces ?? 0), ok: true },
            ].map(({ label, value, ok }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${ok ? "bg-trusted" : "bg-suspicious"}`} />
                  <span className="text-sm text-slate-300">{label}</span>
                </div>
                <span className="font-mono text-sm font-medium text-white">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
