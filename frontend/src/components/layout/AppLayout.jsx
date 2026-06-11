import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const navigate = useNavigate();
  useEffect(() => {
    if (localStorage.getItem("poh_just_registered")) {
      localStorage.removeItem("poh_just_registered");
      navigate("/app/onboarding", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#08090A]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] px-5 py-6 animate-fade-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
