import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import api from "@/lib/api";
import { Bell, Broadcast, GlobeHemisphereWest, CaretUpDown, Check, List } from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSite } from "@/context/SiteContext";

const sevColor = {
  critical: "text-fraudulent border-fraudulent/30 bg-fraudulent/10",
  high: "text-suspicious border-suspicious/30 bg-suspicious/10",
  medium: "text-review border-review/30 bg-review/10",
};

export default function Topbar({ onMenuClick }) {
  const qc = useQueryClient();
  const { data: ws } = useQuery({ queryKey: ["workspace"], queryFn: () => fetcher("/workspace") });
  const { data: alertsData } = useQuery({ queryKey: ["alerts"], queryFn: () => fetcher("/alerts"), refetchInterval: 30000 });
  const { siteId, setSiteId, sites } = useSite();

  const workspace = ws?.workspace;
  const alerts = alertsData?.alerts || [];
  const unread = alertsData?.unread || 0;
  const activeSite = sites.find((s) => s.id === siteId);
  const domainLabel = activeSite ? activeSite.domain : "All domains";

  const markRead = async (id) => {
    await api.post(`/alerts/${id}/read`);
    qc.invalidateQueries({ queryKey: ["alerts"] });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-white/8 bg-[#08090A]/80 px-4 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors"
          aria-label="Open navigation"
        >
          <List size={20} weight="regular" />
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-md border border-white/10 bg-surface px-3 py-1.5 min-w-0">
          <span className="h-2 w-2 rounded-full bg-trusted animate-pulse-dot shrink-0" />
          <span className="text-sm font-medium text-white truncate max-w-[160px] sm:max-w-[200px]">{workspace?.name || "Workspace"}</span>
          <span className="data-label ml-1 border-l border-white/10 pl-2 shrink-0">{workspace?.plan || "—"}</span>
        </div>

        {/* Mobile workspace name */}
        <div className="sm:hidden flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 rounded-full bg-trusted animate-pulse-dot shrink-0" />
          <span className="text-sm font-medium text-white truncate max-w-[120px]">{workspace?.name || "Workspace"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Domain picker */}
        {sites.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md border border-white/10 bg-surface px-2.5 py-1.5 text-sm text-white hover:border-white/20 transition-colors">
                <GlobeHemisphereWest size={14} className="text-muted-foreground shrink-0" />
                <span className="hidden sm:inline max-w-[120px] truncate">{domainLabel}</span>
                <CaretUpDown size={12} className="text-muted-foreground shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 border-white/10 bg-popover p-1">
              <button
                onClick={() => setSiteId(null)}
                className={cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-white/5 transition-colors", !siteId && "text-white", siteId && "text-muted-foreground")}
              >
                <GlobeHemisphereWest size={14} className="shrink-0" />
                <span className="flex-1 text-left">All domains</span>
                {!siteId && <Check size={13} className="text-trusted shrink-0" />}
              </button>
              <div className="my-1 border-t border-white/8" />
              {sites.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSiteId(s.id)}
                  className={cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-white/5 transition-colors", siteId === s.id ? "text-white" : "text-muted-foreground")}
                >
                  <span className="flex-1 truncate text-left font-mono text-[12px]">{s.domain}</span>
                  {siteId === s.id && <Check size={13} className="text-trusted shrink-0" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        )}

        <div className="hidden lg:flex items-center gap-1.5 rounded-md border border-trusted/20 bg-trusted/5 px-2.5 py-1.5">
          <Broadcast size={14} className="text-trusted" />
          <span className="font-mono text-[11px] text-trusted">Scoring live</span>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button data-testid="alerts-bell" className="relative rounded-md border border-white/10 bg-surface p-2 text-muted-foreground hover:text-white hover:border-white/20 transition-colors">
              <Bell size={18} weight="regular" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fraudulent px-1 text-[9px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[320px] sm:w-[360px] border-white/10 bg-popover p-0">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <span className="font-semibold text-white text-sm">Alerts</span>
              <span className="data-label">{unread} unread</span>
            </div>
            <div className="max-h-[360px] sm:max-h-[400px] overflow-y-auto divide-y divide-white/5">
              {alerts.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">No alerts</div>}
              {alerts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => markRead(a.id)}
                  className={cn("flex w-full gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors", !a.read && "bg-white/[0.02]")}
                >
                  <span className={cn("mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase", sevColor[a.severity] || sevColor.medium)}>{a.severity}</span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-200 leading-snug">{a.message}</p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">{timeAgo(a.created_at)}</p>
                  </div>
                  {!a.read && <span className="ml-auto mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-trusted" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
