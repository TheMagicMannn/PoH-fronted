import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  ShieldChevron, SquaresFour, Buildings, Users, ListBullets, ArrowLeft,
} from "@phosphor-icons/react";

const ADMIN_NAV = [
  { to: "/admin",            label: "Overview",   icon: SquaresFour, end: true },
  { to: "/admin/workspaces", label: "Workspaces", icon: Buildings },
  { to: "/admin/users",      label: "Users",      icon: Users },
  { to: "/admin/audit-logs", label: "Audit Log",  icon: ListBullets },
];

export default function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== "owner") navigate("/app", { replace: true });
  }, [user, navigate]);

  if (!user || user.role !== "owner") return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#08090A]">
      {/* Admin Sidebar */}
      <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-white/8 bg-[#0A0B0D]">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/8">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-fraudulent/15 border border-fraudulent/30">
            <ShieldChevron size={18} weight="fill" className="text-fraudulent" />
          </div>
          <div className="leading-none">
            <div className="font-heading text-sm font-extrabold tracking-tight text-white">Platform Admin</div>
            <div className="data-label mt-0.5 text-[9px] text-fraudulent">restricted access</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-fraudulent/10 text-white border border-fraudulent/20"
                    : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={17} weight={isActive ? "fill" : "regular"}
                    className={isActive ? "text-fraudulent" : "text-muted-foreground group-hover:text-white"} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/8 p-3">
          <button
            onClick={() => navigate("/app")}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={17} /> Back to Dashboard
          </button>
          <div className="mt-2 px-3 py-1.5">
            <p className="font-mono text-[10px] text-slate-600 truncate">Signed in as {user.email}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-16 items-center border-b border-white/8 px-6">
          <div className="flex items-center gap-2">
            <span className="rounded border border-fraudulent/30 bg-fraudulent/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-fraudulent uppercase tracking-wider">
              Admin Console
            </span>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
