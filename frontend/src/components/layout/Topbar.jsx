import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import api from "@/lib/api";
import { Bell, Broadcast } from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import pohMark from "@/assets/poh-mark.png";

const sevColor = {
  critical: "text-fraudulent border-fraudulent/30 bg-fraudulent/10",
  high: "text-suspicious border-suspicious/30 bg-suspicious/10",
  medium: "text-review border-review/30 bg-review/10",
};

export default function Topbar() {
  const qc = useQueryClient();
  const { data: ws } = useQuery({ queryKey: ["workspace"], queryFn: () => fetcher("/workspace") });
  const { data: alertsData } = useQuery({ queryKey: ["alerts"], queryFn: () => fetcher("/alerts"), refetchInterval: 30000 });

  const workspace = ws?.workspace;
  const alerts = alertsData?.alerts || [];
  const unread = alertsData?.unread || 0;

  const markRead = async (id) => {
    await api.post(`/alerts/${id}/read`);
    qc.invalidateQueries({ queryKey: ["alerts"] });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/8 bg-[#08090A]/80 px-5 backdrop-blur-xl">
      <div className="flex items-center gap-3 min-w-0">
        <img src={pohMark} alt="PoH Intelligence" className="md:hidden h-8 w-auto select-none" draggable="false" />
        <div className="hidden sm:flex items-center gap-2 rounded-md border border-white/10 bg-surface px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-trusted animate-pulse-dot" />
          <span className="text-sm font-medium text-white truncate max-w-[200px]">{workspace?.name || "Workspace"}</span>
          <span className="data-label ml-1 border-l border-white/10 pl-2">{workspace?.plan || "—"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
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
          <PopoverContent align="end" className="w-[360px] border-white/10 bg-popover p-0">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <span className="font-semibold text-white text-sm">Alerts</span>
              <span className="data-label">{unread} unread</span>
            </div>
            <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
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
