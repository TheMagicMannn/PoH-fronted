import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  SquaresFour, Pulse, Target, Megaphone, ShieldCheck, MagnifyingGlass,
  PlugsConnected, GearSix, ShieldChevron, SignOut, Code,
} from "@phosphor-icons/react";
import pohMark from "@/assets/poh-mark.png";

const NAV = [
  { to: "/app", label: "Executive Overview", icon: SquaresFour, end: true },
  { to: "/app/sessions", label: "Session Intelligence", icon: Pulse },
  { to: "/app/conversions", label: "Conversions", icon: Target },
  { to: "/app/campaigns", label: "Campaign Quality", icon: Megaphone },
  { to: "/app/rules", label: "Rules & Actions", icon: ShieldCheck },
  { to: "/app/investigations", label: "Investigations", icon: MagnifyingGlass },
  { to: "/app/integrations", label: "Integrations", icon: PlugsConnected },
  { to: "/app/settings", label: "Workspace Settings", icon: GearSix },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex w-[248px] shrink-0 flex-col border-r border-white/8 bg-[#0A0B0D]">
      <div className="flex items-center px-4 h-16 border-b border-white/8">
        <NavLink to="/app" end className="inline-flex items-center" aria-label="PoH Intelligence">
          <img
            src={pohMark}
            alt="PoH Intelligence — Proof of Human"
            className="h-11 w-auto select-none"
            draggable="false"
          />
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            data-testid={`nav-${item.to === "/app" ? "overview" : item.to.split("/").pop()}`}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-trusted/10 text-white border border-trusted/20"
                  : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} weight={isActive ? "fill" : "regular"} className={isActive ? "text-trusted" : "text-muted-foreground group-hover:text-white"} />
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/8 p-3 space-y-1">
        <NavLink
          to="/app/onboarding"
          data-testid="nav-install-sdk"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
        >
          <Code size={18} /> Install SDK
        </NavLink>
        <div className="flex items-center gap-2.5 rounded-md px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-xs font-mono font-semibold text-white">
            {(user?.name || "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-xs font-medium text-white">{user?.name}</div>
            <div className="truncate text-[10px] font-mono text-muted-foreground capitalize">{user?.role}</div>
          </div>
          <button
            data-testid="logout-button"
            onClick={async () => { await logout(); navigate("/login"); }}
            className="rounded p-1.5 text-muted-foreground hover:text-fraudulent hover:bg-fraudulent/10 transition-colors"
            title="Sign out"
          >
            <SignOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
