import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import { Card, Spinner, EmptyState, KpiCard } from "@/components/common/Card";
import { RangeSelect } from "@/components/common/Controls";
import { fmtCurrency, fmtNum, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Megaphone, Coins, ShieldWarning, GoogleLogo, MetaLogo, GlobeHemisphereWest } from "@phosphor-icons/react";

function SourceIcon({ source }) {
  if (source === "google") return <GoogleLogo size={15} weight="bold" className="text-[#4285F4]" />;
  if (source === "meta") return <MetaLogo size={15} weight="bold" className="text-[#0866FF]" />;
  return <GlobeHemisphereWest size={15} className="text-muted-foreground" />;
}

function QualityBar({ trusted, suspicious, fraudulent, total }) {
  const pct = (n) => (total ? (n / total) * 100 : 0);
  return (
    <div className="flex h-2 w-28 overflow-hidden rounded-full bg-white/5">
      <div className="bg-trusted" style={{ width: `${pct(trusted)}%` }} />
      <div className="bg-suspicious" style={{ width: `${pct(suspicious)}%` }} />
      <div className="bg-fraudulent" style={{ width: `${pct(fraudulent)}%` }} />
    </div>
  );
}

export default function Campaigns() {
  const [range, setRange] = useState("30d");
  const { data, isLoading } = useQuery({ queryKey: ["campaigns", range], queryFn: () => fetcher(`/campaigns?range=${range}`) });
  const rows = data?.campaigns || [];
  const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
  const totalWasted = rows.reduce((s, r) => s + r.wasted, 0);
  const totalSessions = rows.reduce((s, r) => s + r.total, 0);
  const totalBad = rows.reduce((s, r) => s + r.suspicious + r.fraudulent, 0);

  return (
    <div className="space-y-5" data-testid="campaigns-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Campaign Quality</h1>
          <p className="mt-1 text-sm text-muted-foreground">Fraud by source, campaign and ad set — linked from GA4, Google Ads &amp; Meta.</p>
        </div>
        <RangeSelect value={range} onChange={setRange} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Tracked Spend" value={fmtCurrency(totalSpend)} icon={Coins} />
        <KpiCard label="Wasted Spend" value={fmtCurrency(totalWasted)} accent="text-fraudulent" icon={ShieldWarning} sub={fmtPct(totalSpend ? (totalWasted / totalSpend) * 100 : 0)} />
        <KpiCard label="Sessions" value={fmtNum(totalSessions)} icon={Megaphone} />
        <KpiCard label="Blended Fraud Rate" value={fmtPct(totalSessions ? (totalBad / totalSessions) * 100 : 0)} accent="text-suspicious" />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? <Spinner /> : rows.length === 0 ? (
          <EmptyState icon={Megaphone} title="No campaign data" desc="No traffic recorded for this range yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left">
                  {["Source", "Campaign / Ad set", "Sessions", "Quality mix", "Fraud rate", "Spend", "Wasted"].map((h) => (
                    <th key={h} className="px-4 py-2.5 data-label font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} data-testid={`campaign-row-${i}`} className="border-b border-white/5 transition-colors hover:bg-surfacehover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <SourceIcon source={r.source} />
                        <span className="text-xs text-slate-200">{r.source}</span>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">{r.medium}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-200">{r.campaign}</div>
                      <div className="text-[11px] text-muted-foreground">{r.ad_set || "—"}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-200">{fmtNum(r.total)}</td>
                    <td className="px-4 py-3"><QualityBar {...r} /></td>
                    <td className="px-4 py-3">
                      <span className={cn("font-mono text-sm font-medium", r.fraud_rate > 25 ? "text-fraudulent" : r.fraud_rate > 12 ? "text-suspicious" : "text-trusted")}>{fmtPct(r.fraud_rate)}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-200">{fmtCurrency(r.spend)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-fraudulent">{fmtCurrency(r.wasted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
