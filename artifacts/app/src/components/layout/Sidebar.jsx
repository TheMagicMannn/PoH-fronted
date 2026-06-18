import { NavLink, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  SquaresFour, Pulse, Target, Megaphone, ShieldCheck, MagnifyingGlass,
  PlugsConnected, GearSix, ShieldChevron, SignOut, Code, GlobeHemisphereWest,
  Broadcast, ShieldWarning, X,
} from "@phosphor-icons/react";

const NAV = [
  { to: "/app",              label: "Executive Overview",   icon: SquaresFour,        end: true },
  { to: "/app/live",         label: "Live Feed",            icon: Broadcast           },
  { to: "/app/sessions",     label: "Session Intelligence", icon: Pulse               },
  { to: "/app/conversions",  label: "Conversions",          icon: Target              },
  { to: "/app/campaigns",    label: "Campaign Quality",     icon: Megaphone           },
  { to: "/app/rules",        label: "Rules & Actions",      icon: ShieldCheck         },
  { to: "/app/investigations",label: "Investigations",      icon: MagnifyingGlass     },
  { to: "/app/integrations", label: "Integrations",         icon: PlugsConnected      },
  { to: "/app/domains",      label: "Domains",              icon: GlobeHemisphereWest },
  { to: "/app/settings",     label: "Workspace Settings",   icon: GearSix             },
];

function SidebarContent({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-trusted/15 border border-trusted/30">
            <ShieldChevron size={18} weight="fill" className="text-trusted" />
          </div>
          <div className="leading-none">
            <div className="font-heading text-base font-extrabold tracking-tight text-white">PoH</div>
            <div className="data-label mt-0.5 text-[9px]">Trust Intelligence</div>
          </div>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main nav — min-h-0 is critical to allow overflow-y-auto to work in flex column */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
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

      {/* Bottom section */}
      <div className="border-t border-white/8 p-3 space-y-1 shrink-0">
        {user?.role === "owner" && (
          <NavLink
            to="/admin"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors border",
                isActive
                  ? "bg-fraudulent/10 text-white border-fraudulent/20"
                  : "text-muted-foreground hover:text-white hover:bg-white/5 border-transparent"
              )
            }
          >
            {({ isActive }) => (
              <>
                <ShieldWarning size={18} weight={isActive ? "fill" : "regular"}
                  className={isActive ? "text-fraudulent" : "text-muted-foreground"} />
                <span>Platform Admin</span>
              </>
            )}
          </NavLink>
        )}

        <NavLink
          to="/app/onboarding"
          onClick={onClose}
          data-testid="nav-install-sdk"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
        >
          <Code size={18} /> Install SDK
        </NavLink>

        <NavLink
          to="/app/profile"
          onClick={onClose}
          data-testid="nav-profile"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors group",
              isActive ? "bg-white/8 border border-white/10" : "hover:bg-white/5 border border-transparent"
            )
          }
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-xs font-mono font-semibold text-white shrink-0">
            {(user?.name || "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-xs font-medium text-white">{user?.name}</div>
            <div className="truncate text-[10px] font-mono text-muted-foreground capitalize">{user?.role}</div>
          </div>
          <button
            data-testid="logout-button"
            onClick={async (e) => { e.preventDefault(); await logout(); navigate("/login"); }}
            className="rounded p-1.5 text-muted-foreground hover:text-fraudulent hover:bg-fraudulent/10 transition-colors"
            title="Sign out"
          >
            <SignOut size={16} />
          </button>
        </NavLink>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  // Close on route change (already handled via onClick on NavLinks)
  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && open) onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Desktop sidebar — always visible, static */}
      <aside className="hidden md:flex w-[248px] shrink-0 flex-col border-r border-white/8 bg-[#0A0B0D]">
        <SidebarContent onClose={null} />
      </aside>

      {/* Mobile sidebar — slide-in drawer */}
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col border-r border-white/8 bg-[#0A0B0D] transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent onClose={onClose} />
      </aside>
    </>
  );
}
