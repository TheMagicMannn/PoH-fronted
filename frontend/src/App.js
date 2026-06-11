import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/common/Card";
import AppLayout from "@/components/layout/AppLayout";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Overview from "@/pages/Overview";
import Sessions from "@/pages/Sessions";
import Conversions from "@/pages/Conversions";
import Campaigns from "@/pages/Campaigns";
import Rules from "@/pages/Rules";
import Investigations from "@/pages/Investigations";
import Integrations from "@/pages/Integrations";
import Settings from "@/pages/Settings";
import Onboarding from "@/pages/Onboarding";

function FullScreenLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#08090A]">
      <Spinner />
    </div>
  );
}

function Protected({ children }) {
  const { user } = useAuth();
  if (user === null) return <FullScreenLoader />;
  if (user === false) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user } = useAuth();
  if (user === null) return <FullScreenLoader />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
            <Route element={<Protected><AppLayout /></Protected>}>
              <Route path="/" element={<Overview />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/conversions" element={<Conversions />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/investigations" element={<Investigations />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/onboarding" element={<Onboarding />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster theme="dark" position="top-right" toastOptions={{ style: { background: "#121417", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontFamily: "IBM Plex Sans" } }} />
      </AuthProvider>
    </div>
  );
}

export default App;
