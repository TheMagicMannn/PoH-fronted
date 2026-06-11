import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { fetcher } from "@/lib/api";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TrustGauge, ReasonCodeList } from "@/components/common/Score";
import { StatusBadge, ActionBadge } from "@/components/common/StatusBadge";
import { Spinner } from "@/components/common/Card";
import { fmtDateTime, fmtCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  MapPin, DeviceMobile, Browsers, Fingerprint, Globe, Clock, ShieldCheck, Eye, Prohibit, X,
} from "@phosphor-icons/react";

function SignalRow({ label, value, bad }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1.5">
      <span className="data-label">{label}</span>
      <span className={cn("font-mono text-xs", bad ? "text-fraudulent" : "text-slate-200")}>{value}</span>
    </div>
  );
}

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

  const sig = s?.signals || {};

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl border-l border-white/10 bg-[#0A0B0D] p-0 overflow-y-auto">
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
                  <p className="font-mono text-[11px] text-slate-500">Confidence {s.confidence}% · Trust {s.trust_score}</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded p-1.5 text-muted-foreground hover:text-white hover:bg-white/5"><X size={18} /></button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Why flagged */}
              <section>
                <h3 className="data-label mb-2.5">Why this score</h3>
                <div className="rounded-md border border-white/8 bg-surface p-4">
                  <ReasonCodeList codes={s.reason_codes} />
                </div>
              </section>

              {/* Context grid */}
              <section className="grid grid-cols-2 gap-3">
                {[
                  { icon: Globe, label: "Source / Medium", value: `${s.source} / ${s.medium}` },
                  { icon: MapPin, label: "Geo", value: `${s.city}, ${s.country}` },
                  { icon: DeviceMobile, label: "Device", value: `${s.device_type} · ${s.os}` },
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
