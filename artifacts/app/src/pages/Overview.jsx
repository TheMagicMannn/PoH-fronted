import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { Card, KpiCard, Spinner, SectionTitle } from "@/components/common/Card";
import { RangeSelect, ChartTooltip } from "@/components/common/Controls";
import { fmtNum, fmtCurrency, fmtPct, reasonLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Pulse, Prohibit, Coins, Target, ShieldWarning } from "@phosphor-icons/react";

const COLORS = { trusted: "#34D399", suspicious: "#FBBF24", fraudulent: "#F87171" };

export default function Overview() {
  const [range, setRange] = useState("7d");
  const { data, isLoading } = useQuery({ queryKey: ["overview", range], queryFn: () => fetcher(`/overview?range=${range}`) });

  if (isLoading || !data) return <Spinner />;
  const k = data.kpis;
  const totalDist = data.distribution.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="space-y-6" data-testid="overview-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Executive Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Traffic quality, invalid conversions and wasted spend at a glance.</p>
        </div>
        <RangeSelect value={range} onChange={setRange} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard testid="kpi-total-sessions" label="Sessions Scored" value={fmtNum(k.total_sessions)} icon={Pulse}
                 sub={`${fmtNum(k.trusted)} trusted`} />
        <KpiCard testid="kpi-invalid-traffic" label="Invalid Traffic" value={fmtPct(k.invalid_traffic_rate)} icon={ShieldWarning}
                 accent="text-suspicious" sub={`${fmtNum(k.suspicious + k.fraudulent)} sessions`} />
        <KpiCard testid="kpi-wasted-spend" label="Est. Wasted Spend" value={fmtCurrency(k.estimated_wasted_spend)} icon={Coins}
                 accent="text-fraudulent" sub="across paid sources" />
        <KpiCard testid="kpi-invalid-conv" label="Invalid Conversions" value={fmtPct(k.invalid_conversion_rate)} icon={Target}
                 accent="text-suspicious" sub={`${fmtNum(k.invalid_conversions)} of ${fmtNum(k.total_conversions)}`} />
        <KpiCard testid="kpi-blocked" label="Blocked Sessions" value={fmtNum(k.blocked_sessions)} icon={Prohibit}
                 accent="text-fraudulent" sub={`${fmtNum(k.suppressed_conversions)} conv. suppressed`} />
      </div>

      {/* Trend + distribution */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <SectionTitle title="Traffic Quality Trend" desc="Daily classification of scored sessions" />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.trend} margin={{ left: -18, right: 6, top: 4 }}>
              <defs>
                {Object.entries(COLORS).map(([k2, c]) => (
                  <linearGradient key={k2} id={`g-${k2}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10, fontFamily: "IBM Plex Mono" }} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="trusted" stackId="1" stroke={COLORS.trusted} fill="url(#g-trusted)" strokeWidth={2} />
              <Area type="monotone" dataKey="suspicious" stackId="1" stroke={COLORS.suspicious} fill="url(#g-suspicious)" strokeWidth={2} />
              <Area type="monotone" dataKey="fraudulent" stackId="1" stroke={COLORS.fraudulent} fill="url(#g-fraudulent)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <SectionTitle title="Trust Distribution" />
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.distribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={2} strokeWidth={0}>
                  {data.distribution.map((d) => <Cell key={d.name} fill={COLORS[d.name]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-2xl font-semibold text-white">{fmtNum(totalDist)}</span>
              <span className="data-label">sessions</span>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {data.distribution.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[d.name] }} />
                <span className="capitalize text-slate-300">{d.name}</span>
                <span className="ml-auto font-mono text-white tabular-nums">{fmtNum(d.value)}</span>
                <span className="w-12 text-right font-mono text-xs text-muted-foreground">{fmtPct((d.value / totalDist) * 100)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Source quality + reason codes */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <SectionTitle title="Fraud by Source" desc="Where invalid traffic & wasted spend concentrate" />
          <div className="space-y-3">
            {data.by_source.slice(0, 6).map((s) => (
              <div key={s.source} className="flex items-center gap-3" data-testid={`source-row-${s.source}`}>
                <div className="w-24 truncate font-mono text-xs text-slate-300">{s.source}</div>
                <div className="relative h-6 flex-1 overflow-hidden rounded bg-white/5">
                  <div className="absolute inset-y-0 left-0 bg-fraudulent/25" style={{ width: `${s.fraud_rate}%` }} />
                  <div className="absolute inset-0 flex items-center justify-between px-2">
                    <span className="font-mono text-[11px] text-slate-300">{s.bad} flagged / {s.total}</span>
                    <span className={cn("font-mono text-[11px] font-medium", s.fraud_rate > 25 ? "text-fraudulent" : s.fraud_rate > 12 ? "text-suspicious" : "text-trusted")}>{fmtPct(s.fraud_rate)}</span>
                  </div>
                </div>
                <div className="w-20 text-right font-mono text-xs text-fraudulent">{fmtCurrency(s.wasted)}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle title="Top Reason Codes" />
          <div className="space-y-2.5">
            {data.top_reasons.map((r, i) => (
              <div key={r.code} className="flex items-start gap-3">
                <span className="mt-0.5 font-mono text-xs text-muted-foreground w-4">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200 leading-snug">{r.label || reasonLabel(r.code)}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{r.code}</p>
                </div>
                <span className="font-mono text-sm font-medium text-white tabular-nums">{r.count}</span>
              </div>
            ))}
            {data.top_reasons.length === 0 && <p className="text-sm text-muted-foreground">No risk signals in range.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
