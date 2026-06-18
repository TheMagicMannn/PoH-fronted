import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { fetcher } from "@/lib/api";
import { Card, Spinner } from "@/components/common/Card";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { GoogleLogo, MetaLogo, ChartLineUp, LinkSimple, Buildings, Info, CheckCircle, Plug } from "@phosphor-icons/react";

const ICONS = {
  ga4: { Icon: ChartLineUp, color: "text-[#E37400]", bg: "bg-[#E37400]/10 border-[#E37400]/25" },
  google_ads: { Icon: GoogleLogo, color: "text-[#4285F4]", bg: "bg-[#4285F4]/10 border-[#4285F4]/25" },
  meta_ads: { Icon: MetaLogo, color: "text-[#0866FF]", bg: "bg-[#0866FF]/10 border-[#0866FF]/25" },
  webhook: { Icon: LinkSimple, color: "text-trusted", bg: "bg-trusted/10 border-trusted/25" },
  hubspot: { Icon: Buildings, color: "text-[#FF7A59]", bg: "bg-[#FF7A59]/10 border-[#FF7A59]/25" },
};

const DESC = {
  ga4: "Pull conversion events & sync trust verdicts back to GA4 audiences.",
  google_ads: "Link campaigns, keywords and ad groups to fraud reporting.",
  meta_ads: "Map ad sets & creatives to invalid traffic and wasted spend.",
  webhook: "Push real-time fraud verdicts to your own stack.",
  hubspot: "Enrich CRM leads with PoH trust & quality scores.",
};

export default function Integrations() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["integrations"], queryFn: () => fetcher("/integrations") });

  const connect = useMutation({
    mutationFn: ({ provider, action }) => api.post(`/integrations/${provider}/${action}`),
    onSuccess: (_, { action }) => { toast.success(action === "connect" ? "Connected (simulated)" : "Disconnected"); qc.invalidateQueries({ queryKey: ["integrations"] }); },
    onError: () => toast.error("Action failed"),
  });

  const items = data?.integrations || [];

  return (
    <div className="space-y-5" data-testid="integrations-page">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">Connect your ad platforms and downstream tools.</p>
      </div>

      <div className="flex items-start gap-2.5 rounded-md border border-review/20 bg-review/5 px-4 py-3">
        <Info size={18} className="text-review shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300">Connections in this demo are <span className="font-medium text-review">simulated</span> — toggling them populates example sync metrics. Production OAuth for GA4, Google Ads &amp; Meta is wired into the same UI.</p>
      </div>

      {isLoading ? <Spinner /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((it) => {
            const meta = ICONS[it.provider] || ICONS.webhook;
            const connected = it.status === "connected";
            return (
              <Card key={it.id} data-testid={`integration-${it.provider}`} className="flex flex-col p-5 transition-colors hover:border-white/15">
                <div className="flex items-start justify-between">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-md border", meta.bg)}>
                    <meta.Icon size={22} weight="bold" className={meta.color} />
                  </div>
                  {connected ? (
                    <span className="flex items-center gap-1.5 rounded-md border border-trusted/25 bg-trusted/10 px-2 py-0.5 text-[11px] font-mono text-trusted"><CheckCircle size={12} weight="fill" /> Connected</span>
                  ) : (
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">Not connected</span>
                  )}
                </div>

                <h3 className="mt-3 font-semibold text-white">{it.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed flex-1">{DESC[it.provider]}</p>

                {connected && (
                  <div className="mt-3 space-y-1 rounded-md border border-white/8 bg-surface px-3 py-2">
                    <div className="flex justify-between text-xs"><span className="data-label">Status</span><span className="font-mono text-trusted">{it.metric}</span></div>
                    <div className="flex justify-between text-xs"><span className="data-label">Last sync</span><span className="font-mono text-slate-300">{fmtDateTime(it.last_sync)}</span></div>
                  </div>
                )}

                <button
                  onClick={() => connect.mutate({ provider: it.provider, action: connected ? "disconnect" : "connect" })}
                  data-testid={`${connected ? "disconnect" : "connect"}-${it.provider}`}
                  className={cn("mt-4 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    connected ? "border border-white/10 bg-surface text-muted-foreground hover:text-fraudulent hover:border-fraudulent/30" : "bg-white text-black hover:bg-trusted")}
                >
                  <Plug size={15} /> {connected ? "Disconnect" : "Connect"}
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
