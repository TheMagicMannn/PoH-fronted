import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { fetcher } from "@/lib/api";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TrustGauge, ReasonCodeList } from "@/components/common/Score";
import { StatusBadge, ActionBadge } from "@/components/common/StatusBadge";
import { Spinner } from "@/components/common/Card";
import { fmtDateTime, fmtCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  MapPin, DeviceMobile, Browsers, Fingerprint, Globe, Clock, ShieldCheck, Eye, Prohibit, X,
  UserCircle, Brain, HardDrives, WifiHigh, ClockCountdown, Pulse, Target,
  ArrowRight, Path, CurrencyDollar, ChartLine,
} from "@phosphor-icons/react";

function fmtDuration(ms) {
  if (!ms || ms <= 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function SignalRow({ label, value, bad }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1.5">
      <span className="data-label">{label}</span>
      <span className={cn("font-mono text-xs", bad ? "text-fraudulent" : "text-slate-200")}>{value}</span>
    </div>
  );
}

function SubScoreBar({ label, score, icon: Icon, weight }) {
  const color = score >= 75 ? "#34D399" : score >= 50 ? "#FBBF24" : score != null ? "#F87171" : "#475569";
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {Icon && <Icon size={13} style={{ color }} className="shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[11px] text-slate-400">{label}</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-muted-foreground">{weight}</span>
            <span className="font-mono text-xs font-medium tabular-nums" style={{ color }}>
              {score != null ? score : "—"}
            </span>
          </div>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${score ?? 0}%`, background: color, opacity: 0.8 }}
          />
        </div>
      </div>
    </div>
  );
}

const HUMAN_CLS_COLORS = {
  human: "text-trusted",
  suspicious_human: "text-suspicious",
  automation: "text-review",
  bot: "text-fraudulent",
  uncertain: "text-muted-foreground",
};

const HUMAN_DECISION_COLORS = {
  allow: "text-trusted",
  step_up: "text-suspicious",
  challenge: "text-review",
  block: "text-fraudulent",
};

const yn = (v) => (v ? "yes" : "no");

export default function SessionDrawer({ sessionId, open, onClose }) {
  const qc = useQueryClient();
  const { data: s, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => fetcher(`/sessions/${sessionId}`),
    enabled: !!sessionId && open,
  });

  const act = useMutation({
    mutationFn: (action) => api.post(`/sessions/${sessionId}/action`, { action }),
    onSuccess: (_, action) => {
      toast.success(`Session marked: ${action}`);
      qc.invalidateQueries({ queryKey: ["session", sessionId] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["audit-logs"] });
    },
    onError: () => toast.error("Action failed"),
  });

  const { data: journeyData } = useQuery({
    queryKey: ["session-journey", sessionId],
    queryFn: () => fetcher(`/sessions/${sessionId}/journey`),
    enabled: !!sessionId && open,
  });
  const journey = journeyData?.pages ?? [];

  const sig = s?.signals || {};
  const hasHumanScore = s?.human_score != null;
  const hasTrafficScore = s?.traffic_trust_score != null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl border-l border-white/10 bg-[#0A0B0D] p-0 overflow-y-auto">
        <SheetTitle className="sr-only">Session details</SheetTitle>
        <SheetDescription className="sr-only">Forensic breakdown of the selected session</SheetDescription>
        {isLoading || !s ? (
          <Spinner />
        ) : (
          <div data-testid="session-drawer">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/8 bg-[#0A0B0D]/90 px-6 py-5 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <TrustGauge score={s.fraud_score} classification={s.classification} size={64} />
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={s.classification} />
                    <ActionBadge action={s.action} />
                  </div>
                  <p className="mt-1.5 font-mono text-xs text-muted-foreground">{s.session_id}</p>
                  <p className="font-mono text-[11px] text-slate-500">Confidence {Math.round((s.human_confidence ?? s.confidence) * 100)}% · Trust {s.trust_score}</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded p-1.5 text-muted-foreground hover:text-white hover:bg-white/5"><X size={18} /></button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* TIE Composite Engine */}
              {s?.tie_trust_score != null && (
                <section>
                  <h3 className="data-label mb-2.5 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-trusted" />
                    Trust Intelligence Engine
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">Composite · 0–1000</span>
                  </h3>
                  <div className="rounded-md border border-trusted/20 bg-trusted/[0.03] p-4">
                    {/* Score hero */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/8">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <span className={cn("font-mono text-3xl font-bold tabular-nums",
                            s.tie_trust_score >= 800 ? "text-trusted"
                            : s.tie_trust_score >= 600 ? "text-review"
                            : s.tie_trust_score >= 400 ? "text-suspicious"
                            : "text-fraudulent"
                          )}>
                            {s.tie_trust_score}
                          </span>
                          <span className="text-slate-500 font-mono text-sm">/1000</span>
                        </div>
                        <div>
                          <p className={cn("text-sm font-semibold capitalize",
                            s.tie_trust_score >= 800 ? "text-trusted"
                            : s.tie_trust_score >= 600 ? "text-review"
                            : s.tie_trust_score >= 400 ? "text-suspicious"
                            : "text-fraudulent"
                          )}>
                            {(s.tie_risk_tier ?? "—").replace(/_/g, " ")}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            Decision: <span className="font-medium text-slate-300 capitalize">{(s.tie_decision ?? "—").replace(/_/g, " ")}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs text-muted-foreground">Confidence</p>
                        <p className="font-mono text-sm font-medium text-white">{Math.round((s.tie_confidence ?? 0) * 100)}%</p>
                        <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Fraud {s.tie_fraud_score ?? 0}</p>
                      </div>
                    </div>

                    {/* 8 module scores */}
                    <div className="space-y-1">
                      <SubScoreBar label="Human Intelligence"    score={s.tie_human_score}        icon={UserCircle}    weight="20%" />
                      <SubScoreBar label="Behavioral"            score={s.tie_behavior_score}     icon={Brain}         weight="15%" />
                      <SubScoreBar label="Device Intelligence"   score={s.tie_device_score}       icon={HardDrives}    weight="15%" />
                      <SubScoreBar label="Network Intelligence"  score={s.tie_network_score}      icon={WifiHigh}      weight="10%" />
                      <SubScoreBar label="Identity Intelligence" score={s.tie_identity_score}     icon={ShieldCheck}   weight="10%" />
                      <SubScoreBar label="Traffic Intelligence"  score={s.tie_traffic_score}      icon={Globe}         weight="10%" />
                      <SubScoreBar label="Graph Intelligence"    score={s.tie_graph_score}        icon={Path}          weight="10%" />
                      <SubScoreBar label="Fraud Inverse"         score={s.tie_fraud_inverse_score} icon={Eye}          weight="10%" />
                    </div>

                    {/* Signals */}
                    {((s.tie_positive_signals?.length > 0) || (s.tie_negative_signals?.length > 0)) && (
                      <div className="mt-3 pt-3 border-t border-white/8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {s.tie_positive_signals?.length > 0 && (
                          <div>
                            <p className="font-mono text-[10px] text-trusted mb-1.5">Positive signals</p>
                            <ul className="space-y-1">
                              {s.tie_positive_signals.map((sig, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                                  <span className="text-trusted shrink-0 mt-0.5">✓</span>{sig}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {s.tie_negative_signals?.length > 0 && (
                          <div>
                            <p className="font-mono text-[10px] text-fraudulent mb-1.5">Risk signals</p>
                            <ul className="space-y-1">
                              {s.tie_negative_signals.map((sig, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                                  <span className="text-fraudulent shrink-0 mt-0.5">✗</span>{sig}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Why flagged */}
              <section>
                <h3 className="data-label mb-2.5">Why this score</h3>
                <div className="rounded-md border border-white/8 bg-surface p-4">
                  <ReasonCodeList codes={s.reason_codes} />
                </div>
              </section>

              {/* Human Authenticity Engine */}
              {hasHumanScore && (
                <section>
                  <h3 className="data-label mb-2.5 flex items-center gap-1.5">
                    <UserCircle size={13} className="text-muted-foreground" />
                    Human Authenticity Score
                  </h3>
                  <div className="rounded-md border border-white/8 bg-surface p-4 space-y-1">
                    {/* Score header */}
                    <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/8">
                      <div className="flex items-center gap-3">
                        <span className={cn("font-mono text-2xl font-bold tabular-nums", HUMAN_CLS_COLORS[s.human_classification] ?? "text-white")}>
                          {s.human_score}
                        </span>
                        <div>
                          <p className={cn("text-sm font-medium capitalize", HUMAN_CLS_COLORS[s.human_classification] ?? "text-white")}>
                            {(s.human_classification ?? "—").replace("_", " ")}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            Decision:{" "}
                            <span className={cn("font-medium", HUMAN_DECISION_COLORS[s.human_decision] ?? "text-white")}>
                              {s.human_decision ?? "—"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs text-muted-foreground">Confidence</p>
                        <p className="font-mono text-sm font-medium text-white">{Math.round((s.human_confidence ?? 0) * 100)}%</p>
                      </div>
                    </div>

                    {/* 5 sub-scores */}
                    <SubScoreBar label="Browser Integrity" score={s.browser_integrity_score} icon={Browsers} weight="25%" />
                    <SubScoreBar label="Human Behavior" score={s.behavior_score} icon={Brain} weight="25%" />
                    <SubScoreBar label="Device Consistency" score={s.device_consistency_score} icon={HardDrives} weight="15%" />
                    <SubScoreBar label="Network Reputation" score={s.network_score} icon={WifiHigh} weight="20%" />
                    <SubScoreBar label="Historical Auth." score={s.historical_score} icon={ClockCountdown} weight="15%" />
                  </div>
                </section>
              )}

              {/* Traffic Intelligence Engine */}
              {hasTrafficScore && (
                <section>
                  <h3 className="data-label mb-2.5 flex items-center gap-1.5">
                    <Globe size={13} className="text-muted-foreground" />
                    Traffic Intelligence Score
                  </h3>
                  <div className="rounded-md border border-white/8 bg-surface p-4 space-y-1">
                    <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/8">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-2xl font-bold tabular-nums text-white">
                          {s.traffic_trust_score}
                          <span className="text-sm text-muted-foreground font-normal">/1000</span>
                        </span>
                        <div>
                          <p className="text-sm font-medium capitalize" style={{
                            color: s.traffic_risk_tier === "low" ? "#34D399"
                              : s.traffic_risk_tier === "medium" ? "#60A5FA"
                              : s.traffic_risk_tier === "elevated" ? "#FBBF24"
                              : s.traffic_risk_tier === "high" ? "#F87171"
                              : "#DC2626"
                          }}>
                            {(s.traffic_risk_tier ?? "—").replace("_", " ")} risk
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            Decision:{" "}
                            <span className="font-medium text-slate-300">
                              {(s.traffic_decision ?? "—").replace(/_/g, " ")}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs text-muted-foreground">Confidence</p>
                        <p className="font-mono text-sm font-medium text-white">{Math.round((s.traffic_confidence ?? 0) * 100)}%</p>
                      </div>
                    </div>
                    <SubScoreBar label="Source Intelligence"   score={s.traffic_source_score}        icon={Globe}          weight="15%" />
                    <SubScoreBar label="Campaign Intelligence" score={s.traffic_campaign_score}      icon={Target}         weight="15%" />
                    <SubScoreBar label="Engagement"           score={s.traffic_engagement_score}    icon={Pulse}          weight="15%" />
                    <SubScoreBar label="Conversion Integrity" score={s.traffic_conversion_score}    icon={ShieldCheck}    weight="15%" />
                    <SubScoreBar label="Referral Intel."      score={s.traffic_referral_score}      icon={WifiHigh}       weight="10%" />
                    <SubScoreBar label="Geographic Intel."    score={s.traffic_geo_score}           icon={MapPin}         weight="10%" />
                    <SubScoreBar label="Temporal Patterns"    score={s.traffic_temporal_score}      icon={ClockCountdown} weight="10%" />
                    <SubScoreBar label="Device / Network"     score={s.traffic_device_network_score} icon={HardDrives}    weight="10%" />
                  </div>
                </section>
              )}

              {/* Revenue Protection Engine */}
              {s?.revenue_protection_score != null && (
                <section>
                  <h3 className="data-label mb-2.5 flex items-center gap-1.5">
                    <CurrencyDollar size={13} className="text-muted-foreground" />
                    Revenue Protection Score
                  </h3>
                  <div className="rounded-md border border-white/8 bg-surface p-4 space-y-1">
                    <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/8">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-2xl font-bold tabular-nums" style={{
                          color: s.revenue_protection_score >= 80 ? "#34D399"
                            : s.revenue_protection_score >= 65 ? "#60A5FA"
                            : s.revenue_protection_score >= 50 ? "#FBBF24"
                            : s.revenue_protection_score >= 35 ? "#F87171"
                            : "#DC2626",
                        }}>
                          {s.revenue_protection_score}
                        </span>
                        <div>
                          <p className="text-sm font-medium capitalize" style={{
                            color: s.revenue_risk_tier === "safe" ? "#34D399"
                              : s.revenue_risk_tier === "low" ? "#60A5FA"
                              : s.revenue_risk_tier === "moderate" ? "#FBBF24"
                              : s.revenue_risk_tier === "elevated" ? "#F87171"
                              : "#DC2626",
                          }}>
                            {(s.revenue_risk_tier ?? "—")} risk
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            Decision:{" "}
                            <span className="font-medium text-slate-300">
                              {(s.revenue_decision ?? "—").replace(/_/g, " ")}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <SubScoreBar label="Session Integrity"    score={s.session_integrity_score}         icon={ShieldCheck}    weight="25%" />
                    <SubScoreBar label="Network Trust"        score={s.network_trust_score}             icon={WifiHigh}       weight="20%" />
                    <SubScoreBar label="Traffic Quality"      score={s.revenue_traffic_quality_score}   icon={Pulse}          weight="20%" />
                    <SubScoreBar label="Behavioral Financial" score={s.behavioral_financial_score}      icon={Brain}          weight="20%" />
                    <SubScoreBar label="Identity Signals"     score={s.identity_signals_score}          icon={UserCircle}     weight="15%" />
                    <div className="mt-2 pt-2 border-t border-white/8 grid grid-cols-2 gap-1.5">
                      {[
                        { label: "Chargeback Risk",  score: s.chargeback_risk_score },
                        { label: "Refund Abuse",     score: s.refund_abuse_score },
                        { label: "Promo Abuse",      score: s.promo_abuse_score },
                        { label: "Billing Anomaly",  score: s.billing_anomaly_score },
                      ].map(({ label, score }) => {
                        const col = score >= 60 ? "#F87171" : score >= 35 ? "#FBBF24" : "#34D399";
                        return (
                          <div key={label} className="rounded bg-white/5 p-1.5">
                            <p className="font-mono text-[10px] text-slate-500">{label}</p>
                            <p className="font-mono text-sm font-medium mt-0.5" style={{ color: col }}>{score ?? "—"}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* Device Intelligence Engine */}
              {s?.device_intel_score != null && (
                <section>
                  <h3 className="data-label mb-2.5 flex items-center gap-1.5">
                    <Fingerprint size={13} className="text-muted-foreground" />
                    Device Intelligence Score
                  </h3>
                  <div className="rounded-md border border-white/8 bg-surface p-4 space-y-1">
                    <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/8">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-2xl font-bold tabular-nums" style={{
                          color: s.device_intel_score >= 80 ? "#34D399"
                            : s.device_intel_score >= 60 ? "#60A5FA"
                            : s.device_intel_score >= 40 ? "#FBBF24"
                            : s.device_intel_score >= 20 ? "#F87171"
                            : "#DC2626",
                        }}>
                          {s.device_intel_score}
                        </span>
                        <div>
                          <p className="text-sm font-medium capitalize" style={{
                            color: s.device_risk_tier === "clean" ? "#34D399"
                              : s.device_risk_tier === "watch" ? "#60A5FA"
                              : s.device_risk_tier === "suspicious" ? "#FBBF24"
                              : s.device_risk_tier === "flagged" ? "#F87171"
                              : "#DC2626",
                          }}>
                            {(s.device_risk_tier ?? "—")} device
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            Sessions from device:{" "}
                            <span className="font-medium text-slate-300">{s.device_session_count ?? 1}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <SubScoreBar label="Velocity Control"    score={s.device_velocity_score}    icon={ChartLine}      weight="30%" />
                    <SubScoreBar label="Fraud Rate History"  score={s.device_fraud_rate_score}  icon={ShieldCheck}    weight="30%" />
                    <SubScoreBar label="Geographic Spread"   score={s.device_spread_score}      icon={Globe}          weight="20%" />
                    <SubScoreBar label="Recurrence Pattern"  score={s.device_recurrence_score}  icon={ClockCountdown} weight="20%" />
                  </div>
                </section>
              )}

              {/* Context grid */}
              <section className="grid grid-cols-2 gap-3">
                {[
                  { icon: Globe, label: "Source / Medium", value: [s.source, s.medium].filter(v => v && v !== "null").join(" / ") || "—" },
                  { icon: MapPin, label: "Geo", value: [s.city, s.country].filter(v => v && v !== "null").join(", ") || "—" },
                  { icon: DeviceMobile, label: "Device", value: [s.device_type, s.os].filter(v => v && v !== "null").join(" · ") || "—" },
                  { icon: Browsers, label: "Browser", value: s.browser },
                  { icon: Fingerprint, label: "Fingerprint", value: s.fingerprint_hash },
                  { icon: Clock, label: "First seen", value: fmtDateTime(s.started_at) },
                ].map((c) => (
                  <div key={c.label} className="rounded-md border border-white/8 bg-surface p-3">
                    <div className="flex items-center gap-1.5"><c.icon size={13} className="text-muted-foreground" /><span className="data-label">{c.label}</span></div>
                    <p className="mt-1 truncate font-mono text-xs text-slate-200">{c.value}</p>
                  </div>
                ))}
              </section>

              {/* Campaign */}
              <section>
                <h3 className="data-label mb-2.5">Campaign Mapping</h3>
                <div className="grid grid-cols-2 gap-x-6 rounded-md border border-white/8 bg-surface px-4 py-1">
                  <SignalRow label="Campaign" value={s.campaign || "—"} />
                  <SignalRow label="Ad set" value={s.ad_set || "—"} />
                  <SignalRow label="Keyword" value={s.keyword || "—"} />
                  <SignalRow label="Landing page" value={s.landing_page || "—"} />
                </div>
              </section>

              {/* Forensic signals */}
              <section>
                <h3 className="data-label mb-2.5">Device &amp; Behavioral Signals</h3>
                <div className="grid grid-cols-2 gap-x-6 rounded-md border border-white/8 bg-surface px-4 py-1">
                  <SignalRow label="WebDriver" value={yn(sig.webdriver)} bad={sig.webdriver} />
                  <SignalRow label="Headless" value={yn(sig.headless)} bad={sig.headless} />
                  <SignalRow label="Plugins" value={sig.plugins_count ?? "—"} bad={sig.plugins_count === 0} />
                  <SignalRow label="Languages" value={sig.languages_count ?? "—"} bad={sig.languages_count === 0} />
                  <SignalRow label="Interaction depth" value={sig.interaction_depth ?? "—"} bad={sig.interaction_depth < 3} />
                  <SignalRow label="Time on page" value={`${sig.time_on_page ?? 0}s`} bad={sig.time_on_page < 2} />
                  <SignalRow label="Scroll depth" value={`${sig.scroll_depth ?? 0}%`} />
                  <SignalRow label="HW concurrency" value={sig.hardware_concurrency ?? "—"} />
                  <SignalRow label="Proxy" value={yn(sig.proxy)} bad={sig.proxy} />
                  <SignalRow label="VPN" value={yn(sig.vpn)} bad={sig.vpn} />
                  <SignalRow label="Datacenter IP" value={yn(sig.datacenter_ip)} bad={sig.datacenter_ip} />
                  <SignalRow label="IP" value={s.ip} />
                </div>
              </section>

              {/* Page Journey */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Path size={14} className="text-review" />
                  <h3 className="data-label">Page Journey</h3>
                  {journey.length > 0 && (
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">{journey.length} page{journey.length !== 1 ? "s" : ""}</span>
                  )}
                </div>

                {journey.length === 0 ? (
                  <div className="rounded-lg border border-white/8 bg-white/[0.02] px-4 py-5 text-center">
                    <Path size={20} className="mx-auto mb-2 text-slate-600" />
                    <p className="font-mono text-xs text-slate-500">No page views recorded yet.</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-600">
                      Page views are sent when the visitor navigates away or closes the tab.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {journey.map((pv, idx) => {
                      const isLast = idx === journey.length - 1;
                      const scroll = pv.scroll_depth_pct ?? 0;
                      const scrollColor = scroll >= 75 ? "#34D399" : scroll >= 40 ? "#60A5FA" : "#6B7280";
                      return (
                        <div key={pv.id} className="relative">
                          {/* Connector line */}
                          {!isLast && (
                            <div className="absolute left-[15px] top-[32px] bottom-[-4px] w-px bg-white/10" />
                          )}
                          <div className="flex items-start gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition-colors">
                            {/* Step indicator */}
                            <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] font-mono text-[9px] text-slate-400 mt-0.5">
                              {idx + 1}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1.5">
                              {/* Path + title */}
                              <div>
                                <p className="font-mono text-xs text-slate-100 truncate" title={pv.url}>
                                  {pv.path || pv.url}
                                </p>
                                {pv.title && pv.title !== pv.path && (
                                  <p className="font-mono text-[10px] text-slate-500 truncate">{pv.title}</p>
                                )}
                              </div>

                              {/* Metrics row */}
                              <div className="flex items-center gap-3 flex-wrap">
                                {/* Time on page */}
                                <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                                  <Clock size={9} className="text-slate-600" />
                                  {fmtDuration(pv.time_on_page_ms)}
                                </span>

                                {/* Scroll depth bar */}
                                {pv.scroll_depth_pct != null && (
                                  <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: scrollColor }}>
                                    <span className="flex h-1.5 w-16 rounded-full overflow-hidden bg-white/10">
                                      <span
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${scroll}%`, background: scrollColor }}
                                      />
                                    </span>
                                    {scroll}%
                                  </span>
                                )}

                                {/* Timestamp */}
                                <span className="ml-auto font-mono text-[10px] text-slate-600">
                                  {pv.entered_at
                                    ? new Date(pv.entered_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                                    : "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Total time */}
                    {journey.length > 1 && (
                      <div className="flex items-center justify-between rounded-md bg-white/[0.02] px-3 py-1.5 mt-1">
                        <span className="font-mono text-[10px] text-slate-500">Total session time</span>
                        <span className="font-mono text-[10px] text-slate-300">
                          {fmtDuration(journey.reduce((acc, pv) => acc + (pv.time_on_page_ms ?? 0), 0))}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Conversions */}
              {s.conversions?.length > 0 && (
                <section>
                  <h3 className="data-label mb-2.5">Conversions in this session</h3>
                  <div className="space-y-2">
                    {s.conversions.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-md border border-white/8 bg-surface px-3 py-2">
                        <span className="font-mono text-xs text-slate-200 capitalize">{c.type}</span>
                        <span className="font-mono text-xs text-muted-foreground">{c.value ? fmtCurrency(c.value) : "—"}</span>
                        <StatusBadge status={c.classification} />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Action bar */}
            <div className="sticky bottom-0 flex items-center gap-2 border-t border-white/8 bg-[#0A0B0D]/90 px-6 py-4 backdrop-blur-xl">
              <button onClick={() => act.mutate("trust")} data-testid="action-trust" className="flex flex-1 items-center justify-center gap-2 rounded-md border border-trusted/25 bg-trusted/10 px-3 py-2 text-sm font-medium text-trusted hover:bg-trusted/20 transition-colors">
                <ShieldCheck size={16} /> Trust
              </button>
              <button onClick={() => act.mutate("review")} data-testid="action-review" className="flex flex-1 items-center justify-center gap-2 rounded-md border border-review/25 bg-review/10 px-3 py-2 text-sm font-medium text-review hover:bg-review/20 transition-colors">
                <Eye size={16} /> Review
              </button>
              <button onClick={() => act.mutate("block")} data-testid="action-block" className="flex flex-1 items-center justify-center gap-2 rounded-md border border-fraudulent/25 bg-fraudulent/10 px-3 py-2 text-sm font-medium text-fraudulent hover:bg-fraudulent/20 transition-colors">
                <Prohibit size={16} /> Block
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
