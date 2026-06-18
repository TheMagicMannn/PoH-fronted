import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSite } from "@/context/SiteContext";
import { fetcher } from "@/lib/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { Card, KpiCard, Spinner, SectionTitle } from "@/components/common/Card";
import { RangeSelect, ChartTooltip } from "@/components/common/Controls";
import { fmtNum, fmtCurrency, fmtPct, reasonLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Pulse, Prohibit, Coins, Target, ShieldWarning, Globe, Gauge, Certificate,
  DeviceMobile, Desktop, DeviceTablet, Browsers, Monitor, UserCircle, Brain, HardDrives, WifiHigh, ClockCountdown,
} from "@phosphor-icons/react";

const COLORS = { trusted: "#34D399", suspicious: "#FBBF24", fraudulent: "#F87171" };
const TRAFFIC_TIER_COLORS = {
  low: "#34D399", medium: "#60A5FA", elevated: "#FBBF24", high: "#F87171", critical: "#DC2626",
};

// Reverse map: full country name → ISO-2 code (for seeded data compatibility)
const COUNTRY_TO_ISO = {
  "United States": "US", "Germany": "DE", "United Kingdom": "GB", "France": "FR",
  "Canada": "CA", "Australia": "AU", "Brazil": "BR", "India": "IN", "China": "CN",
  "Japan": "JP", "Russia": "RU", "Netherlands": "NL", "Singapore": "SG",
  "Ukraine": "UA", "Poland": "PL", "Romania": "RO", "Turkey": "TR",
  "Vietnam": "VN", "Thailand": "TH", "Indonesia": "ID", "Mexico": "MX",
  "South Korea": "KR", "Spain": "ES", "Italy": "IT", "Sweden": "SE",
  "Nigeria": "NG", "Argentina": "AR", "Philippines": "PH", "Pakistan": "PK",
};

// Produce a flag emoji from either an ISO-2 code ("US") or a full country name
function countryFlag(value) {
  if (!value) return "🌐";
  const iso = value.length === 2 ? value.toUpperCase() : (COUNTRY_TO_ISO[value] ?? null);
  if (!iso) return "🌐";
  return iso.split("").map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join("");
}

// Display a human-readable country name from ISO code or full name
const isoNames = typeof Intl !== "undefined" && Intl.DisplayNames
  ? new Intl.DisplayNames(["en"], { type: "region" })
  : null;

function countryName(value) {
  if (!value) return "Unknown";
  if (value.length === 2) {
    try { return isoNames?.of(value.toUpperCase()) ?? value; } catch { return value; }
  }
  return value;
}

// Color a fraud rate value
function fraudColor(rate) {
  if (rate >= 30) return "text-fraudulent";
  if (rate >= 15) return "text-suspicious";
  return "text-trusted";
}

// Score bucket → color
function bucketColor(min) {
  if (min >= 60) return "#F87171";
  if (min >= 40) return "#FBBF24";
  if (min >= 20) return "#60A5FA";
  return "#34D399";
}

function BreakdownBar({ name, total, bad, fraud_rate, maxTotal }) {
  const pct = maxTotal ? (total / maxTotal) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className="w-24 shrink-0 truncate font-mono text-[11px] text-slate-300">{name}</div>
      <div className="relative flex-1 h-5 rounded overflow-hidden bg-white/5">
        <div className="absolute inset-y-0 left-0 rounded transition-all duration-300"
          style={{ width: `${pct}%`, background: fraud_rate >= 30 ? "rgba(248,113,113,0.2)" : fraud_rate >= 15 ? "rgba(251,191,36,0.2)" : "rgba(52,211,153,0.15)" }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-2">
          <span className="font-mono text-[10px] text-slate-400">{fmtNum(total)}</span>
          <span className={cn("font-mono text-[10px] font-medium", fraudColor(fraud_rate))}>{fmtPct(fraud_rate)}</span>
        </div>
      </div>
    </div>
  );
}

export default function Overview() {
  const [range, setRange] = useState("7d");
  const { siteId } = useSite();
  const navigate = useNavigate();
  const siteParam = siteId ? `&site_id=${siteId}` : "";
  const { data, isLoading } = useQuery({
    queryKey: ["overview", range, siteId],
    queryFn: () => fetcher(`/overview?range=${range}${siteParam}`),
  });

  if (isLoading || !data) return <Spinner />;
  const k = data.kpis;
  const totalDist = data.distribution.reduce((s, d) => s + d.value, 0) || 1;

  const geoData = data.by_country ?? [];
  const deviceData = data.by_device ?? [];
  const browserData = data.by_browser ?? [];
  const osData = data.by_os ?? [];
  const hourlyData = data.hourly ?? [];
  const scoreDist = data.score_distribution ?? [];
  const humanBreakdown = data.human_classification_breakdown ?? [];
  const avgHuman = data.avg_human_scores;
  const totalHuman = humanBreakdown.reduce((s, d) => s + d.value, 0) || 1;
  const trafficTierBreakdown = data.traffic_risk_tier_breakdown ?? [];
  const avgTrafficScores = data.avg_traffic_scores;
  const totalTrafficTier = trafficTierBreakdown.reduce((s, d) => s + d.value, 0) || 1;
  const avgTrafficScore = k.avg_traffic_trust_score;

  const maxGeoTotal = Math.max(...geoData.map((r) => r.total), 1);
  const maxDeviceTotal = Math.max(...deviceData.map((r) => r.total), 1);
  const maxBrowserTotal = Math.max(...browserData.map((r) => r.total), 1);
  const maxOsTotal = Math.max(...osData.map((r) => r.total), 1);

  // Find peak 3 hours for annotation
  const peakHours = [...hourlyData]
    .sort((a, b) => (b.suspicious + b.fraudulent) - (a.suspicious + a.fraudulent))
    .slice(0, 3)
    .map((h) => h.hour);

  return (
    <div className="space-y-6" data-testid="overview-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Executive Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Traffic quality, invalid conversions and wasted spend at a glance.</p>
        </div>
        <RangeSelect value={range} onChange={setRange} />
      </div>

      {/* KPI row — 7 cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
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
        <KpiCard testid="kpi-trust-score" label="Avg Human Score" value={`${k.avg_human_score ?? k.avg_trust_score ?? 0}`} icon={UserCircle}
          accent={(k.avg_human_score ?? k.avg_trust_score ?? 0) >= 70 ? "text-trusted" : (k.avg_human_score ?? k.avg_trust_score ?? 0) >= 50 ? "text-suspicious" : "text-fraudulent"}
          sub="0–100 authenticity" />
        <KpiCard testid="kpi-confidence" label="Score Confidence" value={`${k.avg_confidence ?? 0}%`} icon={Certificate}
          accent="text-review" sub="model certainty" />
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

      {/* ── NEW: Geographic Intelligence ── */}
      <Card className="p-5" data-testid="panel-geo">
        <SectionTitle title="Geographic Intelligence" desc="Session volume and fraud rate by country — top 15" icon={Globe} />
        {geoData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No geographic data in range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {["Country", "Sessions", "Fraud rate", "Fraudulent"].map((h) => (
                    <th key={h} className="px-3 py-2 data-label font-normal text-left last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {geoData.map((row) => (
                  <tr
                    key={row.country}
                    className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer transition-colors group"
                    onClick={() => navigate(`/app/sessions?country=${encodeURIComponent(row.country)}`)}
                    title={`View all sessions from ${countryName(row.country)}`}
                  >
                    <td className="px-3 py-2.5">
                      <span className="mr-2">{countryFlag(row.country)}</span>
                      <span className="text-slate-200 group-hover:text-white transition-colors">{countryName(row.country)}</span>
                      <span className="ml-1.5 opacity-0 group-hover:opacity-60 transition-opacity text-[10px] font-mono text-slate-400">→ sessions</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-300">{fmtNum(row.total)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="relative h-4 w-28 overflow-hidden rounded bg-white/5">
                          <div className="absolute inset-y-0 left-0 rounded transition-all"
                            style={{ width: `${row.fraud_rate}%`, background: row.fraud_rate >= 30 ? "rgba(248,113,113,0.4)" : row.fraud_rate >= 15 ? "rgba(251,191,36,0.4)" : "rgba(52,211,153,0.3)" }}
                          />
                        </div>
                        <span className={cn("font-mono text-xs tabular-nums w-10", fraudColor(row.fraud_rate))}>{fmtPct(row.fraud_rate)}</span>
                      </div>
                    </td>
                    <td className={cn("px-3 py-2.5 text-right font-mono text-xs tabular-nums", row.bad > 0 ? "text-fraudulent" : "text-muted-foreground")}>{row.bad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── NEW: Device & Browser Intel ── */}
      <Card className="p-5" data-testid="panel-device">
        <SectionTitle title="Device & Browser Intelligence" desc="Fraud rates across device types, browsers and operating systems" />
        <div className="grid gap-6 md:grid-cols-3">
          {/* Device type */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <DeviceMobile size={14} className="text-trusted" />
              <span className="text-xs font-medium text-slate-300">Device Type</span>
            </div>
            {deviceData.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-0.5">
                {deviceData.map((r) => (
                  <BreakdownBar key={r.name} {...r} maxTotal={maxDeviceTotal} />
                ))}
              </div>
            )}
          </div>
          {/* Browser */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Browsers size={14} className="text-trusted" />
              <span className="text-xs font-medium text-slate-300">Browser</span>
            </div>
            {browserData.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-0.5">
                {browserData.map((r) => (
                  <BreakdownBar key={r.name} {...r} maxTotal={maxBrowserTotal} />
                ))}
              </div>
            )}
          </div>
          {/* OS */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Monitor size={14} className="text-trusted" />
              <span className="text-xs font-medium text-slate-300">Operating System</span>
            </div>
            {osData.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-0.5">
                {osData.map((r) => (
                  <BreakdownBar key={r.name} {...r} maxTotal={maxOsTotal} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Human Authenticity Intelligence ── */}
      {(humanBreakdown.some((d) => d.value > 0) || avgHuman) && (
        <Card className="p-5" data-testid="panel-human-intel">
          <SectionTitle title="Human Authenticity Intelligence" desc="Engine classification breakdown and average feature-group scores" icon={UserCircle} />
          <div className="grid gap-6 md:grid-cols-2">
            {/* Classification donut */}
            <div>
              <p className="text-xs font-medium text-slate-300 mb-3">Classification Breakdown</p>
              {humanBreakdown.some((d) => d.value > 0) ? (
                <>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={humanBreakdown} dataKey="value" nameKey="label" innerRadius={52} outerRadius={76} paddingAngle={2} strokeWidth={0}>
                          {humanBreakdown.map((d) => (
                            <Cell key={d.name} fill={
                              d.name === "human" ? "#34D399"
                              : d.name === "suspicious_human" ? "#FBBF24"
                              : d.name === "automation" ? "#60A5FA"
                              : "#F87171"
                            } />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono text-xl font-semibold text-white">{fmtNum(totalHuman)}</span>
                      <span className="data-label">scored</span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {[
                      { name: "human", label: "Human", color: "#34D399" },
                      { name: "suspicious_human", label: "Suspicious Human", color: "#FBBF24" },
                      { name: "automation", label: "Automation", color: "#60A5FA" },
                      { name: "bot", label: "Bot", color: "#F87171" },
                    ].map(({ name, label, color }) => {
                      const d = humanBreakdown.find((x) => x.name === name);
                      return (
                        <div key={name} className="flex items-center gap-2 text-sm">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
                          <span className="text-slate-300">{label}</span>
                          <span className="ml-auto font-mono text-white tabular-nums">{fmtNum(d?.value ?? 0)}</span>
                          <span className="w-12 text-right font-mono text-xs text-muted-foreground">{fmtPct(((d?.value ?? 0) / totalHuman) * 100)}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No Human Authenticity data yet. Seed demo data or collect live sessions.</p>
              )}
            </div>

            {/* Avg sub-scores */}
            <div>
              <p className="text-xs font-medium text-slate-300 mb-3">Avg Feature-Group Scores (Fleet)</p>
              {avgHuman ? (
                <div className="space-y-3 pt-1">
                  {[
                    { label: "Browser Integrity", key: "browser_integrity", icon: Browsers, weight: "25%" },
                    { label: "Human Behavior", key: "behavior", icon: Brain, weight: "25%" },
                    { label: "Device Consistency", key: "device_consistency", icon: HardDrives, weight: "15%" },
                    { label: "Network Reputation", key: "network", icon: WifiHigh, weight: "20%" },
                    { label: "Historical Auth.", key: "historical", icon: ClockCountdown, weight: "15%" },
                  ].map(({ label, key, icon: Icon, weight }) => {
                    const score = avgHuman[key] ?? 0;
                    const color = score >= 75 ? "#34D399" : score >= 50 ? "#FBBF24" : "#F87171";
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Icon size={12} style={{ color }} />
                            <span className="font-mono text-[11px] text-slate-400">{label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-muted-foreground">{weight}</span>
                            <span className="font-mono text-xs font-medium tabular-nums" style={{ color }}>{score}</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: color, opacity: 0.75 }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-3 pt-3 border-t border-white/8 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-400">Composite Human Score</span>
                    <span className={cn("font-mono text-sm font-bold tabular-nums",
                      avgHuman.human >= 75 ? "text-trusted" : avgHuman.human >= 50 ? "text-suspicious" : "text-fraudulent"
                    )}>{avgHuman.human}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No scored sessions in range.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── NEW: Score Distribution + Hourly Pattern ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Score Distribution */}
        <Card className="p-5" data-testid="panel-score-dist">
          <SectionTitle title="Fraud Score Distribution" desc="How scores cluster across the 0–100 range" />
          {scoreDist.every((b) => b.count === 0) ? (
            <p className="text-sm text-muted-foreground">No sessions in range.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreDist} margin={{ left: -20, right: 4, top: 4 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div className="rounded-md border border-white/10 bg-[#121417] px-3 py-2 text-xs shadow-lg">
                          <p className="font-mono text-white">Score {d?.range}</p>
                          <p className="text-muted-foreground mt-1">{fmtNum(d?.count)} sessions</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {scoreDist.map((entry) => (
                      <Cell key={entry.range} fill={bucketColor(entry.min)} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-3">
                {scoreDist.map((b) => (
                  <div key={b.range} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: bucketColor(b.min) }} />
                    <span className="font-mono text-[11px] text-slate-400">{b.range}</span>
                    <span className="font-mono text-[11px] text-white">{fmtNum(b.count)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Hourly Attack Pattern */}
        <Card className="p-5" data-testid="panel-hourly">
          <SectionTitle title="Hourly Attack Pattern" desc="Session volume by UTC hour — reveals peak bot activity windows" />
          {hourlyData.every((h) => h.total === 0) ? (
            <p className="text-sm text-muted-foreground">No sessions in range.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyData} margin={{ left: -20, right: 4, top: 4 }} barCategoryGap="8%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "#64748B", fontSize: 9, fontFamily: "IBM Plex Mono" }}
                    tickFormatter={(h) => (h % 4 === 0 ? `${String(h).padStart(2, "0")}h` : "")}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: "#64748B", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      const isPeak = peakHours.includes(d?.hour);
                      return (
                        <div className="rounded-md border border-white/10 bg-[#121417] px-3 py-2 text-xs shadow-lg">
                          <p className="font-mono text-white">{d?.label}{isPeak ? " ⚠ peak" : ""}</p>
                          <p className="text-trusted mt-1">Trusted: {d?.trusted}</p>
                          <p className="text-suspicious">Suspicious: {d?.suspicious}</p>
                          <p className="text-fraudulent">Fraudulent: {d?.fraudulent}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="trusted" stackId="h" fill="#34D399" fillOpacity={0.7} />
                  <Bar dataKey="suspicious" stackId="h" fill="#FBBF24" fillOpacity={0.8} />
                  <Bar dataKey="fraudulent" stackId="h" fill="#F87171" fillOpacity={0.9} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {peakHours.length > 0 && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Peak hours:{" "}
                  {peakHours.map((h) => (
                    <span key={h} className="font-mono text-suspicious mx-0.5">{String(h).padStart(2, "0")}:00</span>
                  ))}
                  {" "}UTC — highest invalid traffic windows
                </p>
              )}
            </>
          )}
        </Card>
      </div>

      {/* ── Traffic Intelligence Engine ── */}
      <div className="grid gap-4 lg:grid-cols-2" data-testid="panel-traffic-intel">
        {/* Risk tier donut */}
        <Card className="p-5">
          <SectionTitle title="Traffic Intelligence" desc="Risk tier distribution across all scored sessions" icon={Gauge} />
          <div className="relative mt-2">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={trafficTierBreakdown.filter((d) => d.value > 0)}
                  dataKey="value" nameKey="label"
                  innerRadius={62} outerRadius={88} paddingAngle={2} strokeWidth={0}
                >
                  {trafficTierBreakdown.map((d) => (
                    <Cell key={d.name} fill={TRAFFIC_TIER_COLORS[d.name] ?? "#475569"} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              {avgTrafficScore != null ? (
                <>
                  <span className="font-mono text-2xl font-semibold text-white">{avgTrafficScore}</span>
                  <span className="data-label">avg / 1000</span>
                </>
              ) : (
                <span className="data-label text-center">no data</span>
              )}
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {trafficTierBreakdown.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: TRAFFIC_TIER_COLORS[d.name] ?? "#475569" }} />
                <span className="capitalize text-slate-300">{d.label}</span>
                <span className="ml-auto font-mono text-white tabular-nums">{fmtNum(d.value)}</span>
                <span className="w-12 text-right font-mono text-xs text-muted-foreground">
                  {fmtPct((d.value / totalTrafficTier) * 100)}
                </span>
              </div>
            ))}
            {trafficTierBreakdown.every((d) => d.value === 0) && (
              <p className="text-sm text-muted-foreground">No traffic scores in range. Run demo seed to populate.</p>
            )}
          </div>
        </Card>

        {/* 8 sub-score breakdown */}
        <Card className="p-5">
          <SectionTitle title="Sub-Score Breakdown" desc="Average across the 8 Traffic Intelligence groups (0–100 each)" />
          {avgTrafficScores ? (
            <div className="mt-2 space-y-0">
              {[
                { key: "source",         label: "Source Intelligence",    weight: "15%", icon: Globe },
                { key: "campaign",       label: "Campaign Intelligence",  weight: "15%", icon: Target },
                { key: "engagement",     label: "Engagement",             weight: "15%", icon: Pulse },
                { key: "conversion",     label: "Conversion Integrity",   weight: "15%", icon: ShieldWarning },
                { key: "referral",       label: "Referral Intelligence",  weight: "10%", icon: WifiHigh },
                { key: "geo",            label: "Geographic Intel.",      weight: "10%", icon: Globe },
                { key: "temporal",       label: "Temporal Patterns",      weight: "10%", icon: ClockCountdown },
                { key: "device_network", label: "Device / Network",       weight: "10%", icon: HardDrives },
              ].map(({ key, label, weight, icon: Icon }) => {
                const score = avgTrafficScores[key];
                const color = score >= 75 ? "#34D399" : score >= 50 ? "#FBBF24" : "#F87171";
                return (
                  <div key={key} className="flex items-center gap-2.5 py-1.5">
                    <Icon size={13} style={{ color }} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[11px] text-slate-400">{label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-muted-foreground">{weight}</span>
                          <span className="font-mono text-xs font-medium tabular-nums" style={{ color }}>
                            {score ?? "—"}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${score ?? 0}%`, background: color, opacity: 0.8 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No traffic scores yet. Run demo seed to populate.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
