import { createContext, useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [siteId, setSiteId] = useState(null);
  const { data } = useQuery({ queryKey: ["sites"], queryFn: () => fetcher("/sites") });
  const sites = data?.sites ?? [];

  return (
    <SiteContext.Provider value={{ siteId, setSiteId, sites }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used within SiteProvider");
  return ctx;
}
