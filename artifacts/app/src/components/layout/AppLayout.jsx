import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { SiteProvider } from "@/context/SiteContext";

export default function AppLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("poh_just_registered")) {
      localStorage.removeItem("poh_just_registered");
      navigate("/app/onboarding", { replace: true });
    }
  }, [navigate]);

  return (
    <SiteProvider>
      <div className="flex h-screen w-full overflow-hidden bg-[#08090A]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-5 py-5 sm:py-6 animate-fade-up">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SiteProvider>
  );
}
