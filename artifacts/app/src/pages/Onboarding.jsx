import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api, { fetcher, API } from "@/lib/api";
import { Card, Spinner } from "@/components/common/Card";
import { cn } from "@/lib/utils";
import { Copy, Check, Code, Lightning, PlugsConnected, Gauge, Database, ArrowRight, ShieldChevron } from "@phosphor-icons/react";

function CodeBlock({ code, testid }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="relative">
      <pre data-testid={testid} className="overflow-x-auto rounded-md border border-white/10 bg-[#0A0B0D] p-4 pr-12 font-mono text-[12px] leading-relaxed text-slate-300">{code}</pre>
      <button onClick={copy} className="absolute right-2.5 top-2.5 rounded-md border border-white/10 bg-surface p-2 text-muted-foreground hover:text-white">
        {copied ? <Check size={15} className="text-trusted" /> : <Copy size={15} />}
      </button>
    </div>
  );
}

function Step({ n, icon: Icon, title, desc, children }) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-trusted/10 border border-trusted/25 font-mono text-sm font-semibold text-trusted">{n}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><Icon size={17} className="text-trusted" /><h3 className="font-semibold text-white">{title}</h3></div>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </Card>
  );
}

export default function Onboarding() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["sites"], queryFn: () => fetcher("/sites") });
  const site = data?.sites?.[0];

  const seed = useMutation({
    mutationFn: () => api.post("/demo/seed"),
    onSuccess: (r) => { toast.success(`Loaded ${r.data.sessions} sessions`); qc.invalidateQueries(); navigate("/app"); },
    onError: () => toast.error("Failed to load sample data"),
  });

  const testEvent = useMutation({
    mutationFn: () => {
      const sig = {
        user_agent: navigator.userAgent, webdriver: !!navigator.webdriver,
        plugins_count: navigator.plugins?.length || 0, languages_count: navigator.languages?.length || 0,
        hardware_concurrency: navigator.hardwareConcurrency, interaction_depth: 42, time_on_page: 35,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, is_mobile: /Mobi/.test(navigator.userAgent),
      };
      return api.post("/collect", { sdk_key: site.sdk_key, signals: sig, fingerprint: "fp_test_live", page: window.location.href, utm: { source: "test", medium: "manual" } });
    },
    onSuccess: (r) => toast.success(`Live event scored — ${r.data.score.classification} (fraud ${r.data.score.fraud_score})`),
    onError: () => toast.error("Test event failed"),
  });

  if (isLoading) return <Spinner />;

  const snippet = site?.snippet || "";
  const convCode = `// Fire when a real conversion happens (lead, signup, purchase)\nwindow.poh.convert({\n  type: "lead",      // "signup" | "purchase"\n  value: 49.00,       // optional revenue\n  currency: "USD"\n});`;

  return (
    <div className="mx-auto max-w-3xl space-y-5" data-testid="onboarding-page">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-trusted/15 border border-trusted/30"><ShieldChevron size={22} weight="fill" className="text-trusted" /></div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Install PoH</h1>
          <p className="text-sm text-muted-foreground">Five minutes to your first scored session.</p>
        </div>
      </div>

      <Step n={1} icon={Code} title="Drop the SDK on your site" desc="Add this snippet before the closing </head> tag on every page you want scored.">
        {site ? <CodeBlock code={snippet} testid="sdk-snippet" /> : <p className="text-sm text-muted-foreground">No site found.</p>}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="data-label">SDK key</span>
          <code className="font-mono text-trusted">{site?.sdk_key}</code>
        </div>
      </Step>

      <Step n={2} icon={Lightning} title="Map your conversions" desc="Call this whenever a conversion fires so PoH can grade its authenticity.">
        <CodeBlock code={convCode} testid="conversion-snippet" />
      </Step>

      <Step n={3} icon={PlugsConnected} title="Connect ad platforms" desc="Link GA4, Google Ads and Meta to tie fraud to campaigns and spend.">
        <button onClick={() => navigate("/app/integrations")} className="flex items-center gap-1.5 rounded-md border border-white/10 bg-surface px-3 py-2 text-sm font-medium text-white hover:border-white/25">Go to integrations <ArrowRight size={14} /></button>
      </Step>

      <Step n={4} icon={Gauge} title="Pick a sensitivity profile" desc="Conservative, balanced or aggressive — tune false positives vs protection.">
        <button onClick={() => navigate("/app/settings")} className="flex items-center gap-1.5 rounded-md border border-white/10 bg-surface px-3 py-2 text-sm font-medium text-white hover:border-white/25">Open settings <ArrowRight size={14} /></button>
      </Step>

      <Card className="border-trusted/20 bg-trusted/[0.03] p-5">
        <div className="flex items-center gap-2"><Database size={18} className="text-trusted" /><h3 className="font-semibold text-white">Want to see it live right now?</h3></div>
        <p className="mt-1 text-sm text-muted-foreground">Fire a real scored event from this browser, or load a full sample dataset to explore the dashboard.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => testEvent.mutate()} disabled={!site || testEvent.isPending} data-testid="send-test-event" className="flex items-center gap-2 rounded-md border border-trusted/30 bg-trusted/10 px-3.5 py-2 text-sm font-medium text-trusted hover:bg-trusted/20 disabled:opacity-50">
            <Lightning size={15} /> {testEvent.isPending ? "Scoring…" : "Send test session"}
          </button>
          <button onClick={() => seed.mutate()} disabled={seed.isPending} data-testid="load-sample-data" className={cn("flex items-center gap-2 rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-black hover:bg-trusted disabled:opacity-50")}>
            <Database size={15} /> {seed.isPending ? "Loading…" : "Load sample data"}
          </button>
        </div>
      </Card>
    </div>
  );
}
