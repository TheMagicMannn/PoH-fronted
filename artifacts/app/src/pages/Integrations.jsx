import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { fetcher } from "@/lib/api";
import { Card, Spinner } from "@/components/common/Card";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSite } from "@/context/SiteContext";
import {
  GoogleLogo, MetaLogo, ChartLineUp, LinkSimple, Buildings, CheckCircle, Plug,
  GlobeHemisphereWest, Info, ArrowsClockwise, Plus,
} from "@phosphor-icons/react";

const PROVIDERS = [
  {
    id: "ga4",
    name: "Google Analytics 4",
    category: "analytics",
    Icon: ChartLineUp,
    color: "text-[#E37400]",
    bg: "bg-[#E37400]/10 border-[#E37400]/25",
    desc: "Pull conversion events & sync trust verdicts back to GA4 audiences. Excluded conversions are flagged as invalid_traffic events.",
    metrics: ["Conversions synced", "Audiences updated"],
  },
  {
    id: "google_ads",
    name: "Google Ads",
    category: "ads",
    Icon: GoogleLogo,
    color: "text-[#4285F4]",
    bg: "bg-[#4285F4]/10 border-[#4285F4]/25",
    desc: "Link campaigns, ad groups, and keywords to fraud scoring. Invalid traffic reports flow back into Google Ads for bid adjustment.",
    metrics: ["Campaigns linked", "Invalid clicks reported"],
  },
  {
    id: "meta_ads",
    name: "Meta Ads",
    category: "ads",
    Icon: MetaLogo,
    color: "text-[#0866FF]",
    bg: "bg-[#0866FF]/10 border-[#0866FF]/25",
    desc: "Map ad sets and creatives to invalid traffic. Fraudulent events are excluded from Meta's conversion API to protect ROAS.",
    metrics: ["Ad sets mapped", "Events excluded"],
  },
  {
    id: "webhook",
    name: "Outbound Webhook",
    category: "developer",
    Icon: LinkSimple,
    color: "text-trusted",
    bg: "bg-trusted/10 border-trusted/25",
    desc: "Push real-time fraud verdicts to your own stack. Fires on every scored session with full reason codes and TIE score.",
    metrics: ["Events delivered", "Avg latency"],
  },
  {
    id: "hubspot",
    name: "HubSpot CRM",
    category: "crm",
    Icon: Buildings,
    color: "text-[#FF7A59]",
    bg: "bg-[#FF7A59]/10 border-[#FF7A59]/25",
    desc: "Enrich CRM leads with PoH trust and quality scores. Suspicious leads are flagged; fraudulent leads are suppressed automatically.",
    metrics: ["Leads enriched", "Leads suppressed"],
  },
];

const METRIC_DEMO = {
  ga4: "52 conversions synced",
  google_ads: "14 campaigns linked",
  meta_ads: "31 ad sets mapped",
  webhook: "Endpoint active",
  hubspot: "Syncing lead quality scores",
};

function IntegrationCard({ item, provider, siteLabel, onAction, loading }) {
  const connected = item?.status === "connected";
  return (
    <Card className={cn("flex flex-col p-5 transition-colors hover:border-white/15", connected && "border-white/12")}>
      <div className="flex items-start justify-between gap-2">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-md border shrink-0", provider.bg)}>
          <provider.Icon size={22} weight="bold" className={provider.color} />
        </div>
        <div className="flex flex-col items-end gap-1">
          {connected ? (
            <span className="flex items-center gap-1.5 rounded-md border border-trusted/25 bg-trusted/10 px-2 py-0.5 text-[11px] font-mono text-trusted">
              <CheckCircle size={12} weight="fill" /> Connected
            </span>
          ) : (
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
              Not connected
            </span>
          )}
          {siteLabel && (
            <span className="flex items-center gap-1 rounded border border-white/8 bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              <GlobeHemisphereWest size={10} />
              {siteLabel}
            </span>
          )}
        </div>
      </div>

      <h3 className="mt-3 font-semibold text-white">{provider.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed flex-1">{provider.desc}</p>

      {connected && item && (
        <div className="mt-3 space-y-1 rounded-md border border-white/8 bg-surface px-3 py-2">
          <div className="flex justify-between text-xs">
            <span className="data-label">Status</span>
            <span className="flex items-center gap-1 font-mono text-trusted">
              <ArrowsClockwise size={10} className="animate-spin" style={{ animationDuration: "3s" }} />
              {item.metric ?? METRIC_DEMO[provider.id]}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="data-label">Last sync</span>
            <span className="font-mono text-slate-300">{fmtDateTime(item.last_sync)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="data-label">Connected</span>
            <span className="font-mono text-slate-300">{fmtDateTime(item.connected_at)}</span>
          </div>
        </div>
      )}

      <button
        onClick={onAction}
        disabled={loading}
        data-testid={`${connected ? "disconnect" : "connect"}-${provider.id}`}
        className={cn(
          "mt-4 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50",
          connected
            ? "border border-white/10 bg-surface text-muted-foreground hover:text-fraudulent hover:border-fraudulent/30"
            : "bg-white text-black hover:bg-trusted"
        )}
      >
        <Plug size={15} /> {connected ? "Disconnect" : "Connect"}
      </button>
    </Card>
  );
}

export default function Integrations() {
  const qc = useQueryClient();
  const { siteId, sites } = useSite();
  const activeSite = sites.find((s) => s.id === siteId);

  const { data, isLoading } = useQuery({
    queryKey: ["integrations", siteId],
    queryFn: () => fetcher(`/integrations${siteId ? `?site_id=${siteId}` : ""}`),
  });

  const connect = useMutation({
    mutationFn: ({ provider, action }) =>
      api.post(`/integrations/${provider}/${action}`, siteId ? { site_id: siteId } : {}),
    onSuccess: (_, { action, provider }) => {
      toast.success(action === "connect" ? `${provider} connected` : "Disconnected");
      qc.invalidateQueries({ queryKey: ["integrations"] });
    },
    onError: () => toast.error("Action failed"),
  });

  const items = data?.integrations || [];
  const byProvider = Object.fromEntries(items.map((i) => [i.provider, i]));
  const siteLabel = activeSite?.domain ?? null;

  const categories = [
    { label: "Ad Platforms", ids: ["google_ads", "meta_ads"], desc: "Connect your ad accounts to route invalid traffic data back to your campaigns and protect ROAS across every domain." },
    { label: "Analytics", ids: ["ga4"], desc: "Sync trust verdicts and conversion quality into your analytics stack." },
    { label: "CRM & Developer", ids: ["hubspot", "webhook"], desc: "Enrich leads and push real-time scoring events to your own tools." },
  ];

  return (
    <div className="space-y-6" data-testid="integrations-page">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Integrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect ad platforms and downstream tools.
            {siteLabel ? (
              <span className="ml-1 inline-flex items-center gap-1 font-mono text-[11px] text-review">
                <GlobeHemisphereWest size={11} /> Showing config for <strong>{siteLabel}</strong>
              </span>
            ) : (
              <span className="ml-1 text-muted-foreground text-xs">Select a domain from the top bar to configure per-domain integrations.</span>
            )}
          </p>
        </div>
      </div>

      {/* Multi-domain notice */}
      {sites.length > 1 && !siteId && (
        <div className="flex items-start gap-2.5 rounded-md border border-review/20 bg-review/5 px-4 py-3">
          <Info size={18} className="text-review shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-0.5">
            <p className="font-medium text-white">You have {sites.length} domains configured.</p>
            <p>Use the domain picker in the top bar to configure integrations per domain — e.g., connect Google Ads only to your main conversion domain, or use different Meta ad accounts per property.</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => (
            <div key={cat.label}>
              <div className="mb-1">
                <h2 className="text-sm font-semibold text-white">{cat.label}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{cat.desc}</p>
              </div>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cat.ids.map((id) => {
                  const provider = PROVIDERS.find((p) => p.id === id);
                  return (
                    <IntegrationCard
                      key={id}
                      item={byProvider[id]}
                      provider={provider}
                      siteLabel={siteLabel}
                      loading={connect.isPending}
                      onAction={() => connect.mutate({
                        provider: id,
                        action: byProvider[id]?.status === "connected" ? "disconnect" : "connect",
                      })}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
