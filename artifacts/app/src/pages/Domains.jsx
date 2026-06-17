import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { fetcher } from "@/lib/api";
import { Card, Spinner } from "@/components/common/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  GlobeHemisphereWest, Plus, Copy, Check, ArrowsClockwise, Trash, ShieldCheck,
  Warning, Lightning, Code, CaretDown, CaretUp, Certificate, TestTube, Key,
} from "@phosphor-icons/react";

function CodeBlock({ code, mono = true }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="relative">
      <pre className={cn("overflow-x-auto rounded-md border border-white/10 bg-[#0A0B0D] p-3 pr-10 text-[11px] leading-relaxed text-slate-300", mono && "font-mono")}>{code}</pre>
      <button onClick={copy} className="absolute right-2 top-2 rounded border border-white/10 bg-surface p-1.5 text-muted-foreground hover:text-white">
        {copied ? <Check size={13} className="text-trusted" /> : <Copy size={13} />}
      </button>
    </div>
  );
}

function AddDomainDialog({ open, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", domain: "" });
  const create = useMutation({
    mutationFn: () => api.post("/sites", form),
    onSuccess: () => { toast.success("Domain added"); qc.invalidateQueries({ queryKey: ["sites"] }); onClose(); setForm({ name: "", domain: "" }); },
    onError: (e) => toast.error(e.response?.data?.detail || "Failed to add domain"),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-white/10 bg-popover">
        <DialogHeader>
          <DialogTitle className="font-heading text-white">Add domain</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">Each domain gets its own SDK key for isolated tracking.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block">
            <span className="data-label">Site name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Website" className="mt-1.5 w-full rounded-md border border-white/10 bg-surface px-3 py-2 text-sm text-white outline-none focus:border-white/30 placeholder:text-muted-foreground" />
          </label>
          <label className="block">
            <span className="data-label">Domain</span>
            <input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="app.example.com" className="mt-1.5 w-full rounded-md border border-white/10 bg-surface px-3 py-2 text-sm text-white font-mono outline-none focus:border-white/30 placeholder:text-muted-foreground" />
            <p className="mt-1 text-[11px] text-muted-foreground">Without https:// or trailing slash</p>
          </label>
        </div>
        <DialogFooter>
          <button onClick={onClose} className="rounded-md border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-white">Cancel</button>
          <button onClick={() => create.mutate()} disabled={!form.name || !form.domain || create.isPending} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-trusted disabled:opacity-50">
            {create.isPending ? "Adding…" : "Add domain"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialog({ open, title, description, onConfirm, onClose, dangerous }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm border-white/10 bg-popover">
        <DialogHeader>
          <DialogTitle className={cn("font-heading", dangerous ? "text-fraudulent" : "text-white")}>{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button onClick={onClose} className="rounded-md border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-white">Cancel</button>
          <button onClick={onConfirm} className={cn("rounded-md px-4 py-2 text-sm font-semibold", dangerous ? "bg-fraudulent/80 text-white hover:bg-fraudulent" : "bg-white text-black hover:bg-trusted")}>
            Confirm
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SiteRow({ site, base }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [dnsRecord, setDnsRecord] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: site.name, domain: site.domain });

  const rotateKey = useMutation({
    mutationFn: () => api.post(`/sites/${site.id}/rotate-key`),
    onSuccess: (r) => { toast.success("SDK key rotated"); qc.invalidateQueries({ queryKey: ["sites"] }); setRotateOpen(false); },
    onError: () => toast.error("Failed to rotate key"),
  });

  const deleteSite = useMutation({
    mutationFn: () => api.delete(`/sites/${site.id}`),
    onSuccess: () => { toast.success("Domain removed"); qc.invalidateQueries({ queryKey: ["sites"] }); setDeleteOpen(false); },
    onError: () => toast.error("Failed to delete domain"),
  });

  const startVerify = useMutation({
    mutationFn: () => api.post(`/sites/${site.id}/verify`),
    onSuccess: (r) => {
      if (r.data.verified) { toast.success("Domain verified!"); qc.invalidateQueries({ queryKey: ["sites"] }); }
      else { setDnsRecord(r.data.dns_record); setVerifyOpen(true); }
    },
    onError: () => toast.error("Verification failed"),
  });

  const confirmVerify = useMutation({
    mutationFn: () => api.post(`/sites/${site.id}/verify`, { confirm: true }),
    onSuccess: () => { toast.success("Domain verified!"); qc.invalidateQueries({ queryKey: ["sites"] }); setVerifyOpen(false); },
    onError: () => toast.error("Verification check failed"),
  });

  const updateSite = useMutation({
    mutationFn: () => api.patch(`/sites/${site.id}`, editForm),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["sites"] }); setEditing(false); },
    onError: () => toast.error("Failed to update"),
  });

  const testEvent = useMutation({
    mutationFn: () => api.post("/collect", {
      sdk_key: site.sdk_key,
      signals: { user_agent: navigator.userAgent, webdriver: false, plugins_count: navigator.plugins?.length || 2, languages_count: 1, hardware_concurrency: 4 },
      behavior: { mouse_event_count: 12, click_count: 3, session_duration_ms: 4500 },
      fingerprint: "fp_test_domains",
      page: `https://${site.domain}/test`,
      event_type: "page_view",
    }),
    onSuccess: (r) => toast.success(`Test scored — ${r.data.score?.classification ?? "ok"} (fraud: ${r.data.score?.fraud_score ?? 0})`),
    onError: () => toast.error("Test event failed"),
  });

  const snippet = `<script async src="${base}/api/poh.js" data-poh-key="${site.sdk_key}"></script>`;

  return (
    <div className="rounded-md border border-white/8 bg-surface overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5">
          <GlobeHemisphereWest size={18} className="text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded border border-white/20 bg-surface px-2 py-1 text-sm text-white outline-none focus:border-white/40 w-32" />
              <input value={editForm.domain} onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })} className="rounded border border-white/20 bg-surface px-2 py-1 text-xs font-mono text-white outline-none focus:border-white/40 w-44" />
              <button onClick={() => updateSite.mutate()} disabled={updateSite.isPending} className="text-xs text-trusted hover:underline">Save</button>
              <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-white text-sm">{site.name}</span>
              <span className="font-mono text-[12px] text-muted-foreground">{site.domain}</span>
              <button onClick={() => setEditing(true)} className="text-[10px] text-muted-foreground hover:text-white transition-colors">[edit]</button>
            </div>
          )}
          <div className="mt-0.5 flex items-center gap-3">
            <span className={cn("flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px]", site.verified ? "border-trusted/30 bg-trusted/10 text-trusted" : "border-amber-500/30 bg-amber-500/10 text-amber-400")}>
              {site.verified ? <ShieldCheck size={10} weight="fill" /> : <Warning size={10} />}
              {site.verified ? "Verified" : "Unverified"}
            </span>
            <span className="text-[11px] text-muted-foreground">{site.sessions_total?.toLocaleString() ?? 0} sessions</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => testEvent.mutate()} disabled={testEvent.isPending} title="Send test event" className="rounded-md border border-white/10 bg-surface px-2.5 py-1.5 text-xs text-muted-foreground hover:text-white hover:border-white/20 transition-colors flex items-center gap-1.5">
            <Lightning size={13} className={testEvent.isPending ? "animate-pulse text-trusted" : ""} />
            <span className="hidden sm:inline">Test</span>
          </button>
          {!site.verified && (
            <button onClick={() => startVerify.mutate()} disabled={startVerify.isPending} title="Verify domain" className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5">
              <Certificate size={13} />
              <span className="hidden sm:inline">Verify</span>
            </button>
          )}
          <button onClick={() => setDeleteOpen(true)} title="Delete domain" className="rounded-md border border-white/10 bg-surface p-1.5 text-muted-foreground hover:text-fraudulent hover:border-fraudulent/20 transition-colors">
            <Trash size={15} />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="rounded-md border border-white/10 bg-surface p-1.5 text-muted-foreground hover:text-white transition-colors">
            {expanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-white/8 px-4 py-4 space-y-4">
          {/* SDK snippet */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5"><Code size={14} className="text-trusted" /><span className="text-xs font-medium text-slate-300">Install snippet</span></div>
            <CodeBlock code={snippet} />
            <p className="mt-1.5 text-[11px] text-muted-foreground">Add before the closing <code className="text-slate-400">&lt;/head&gt;</code> tag on every page you want scored.</p>
          </div>

          {/* SDK key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5"><Key size={14} className="text-trusted" /><span className="text-xs font-medium text-slate-300">SDK key</span></div>
              <button onClick={() => setRotateOpen(true)} className="flex items-center gap-1.5 rounded border border-white/10 bg-surface px-2 py-1 text-[11px] text-muted-foreground hover:text-white transition-colors">
                <ArrowsClockwise size={12} /> Rotate key
              </button>
            </div>
            <CodeBlock code={site.sdk_key} />
            <p className="mt-1.5 text-[11px] text-muted-foreground">Keep this secret — it authenticates data from your domain.</p>
          </div>

          {/* Conversion tracking */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5"><Lightning size={14} className="text-trusted" /><span className="text-xs font-medium text-slate-300">Conversion tracking</span></div>
            <CodeBlock code={`window.poh.convert({ type: "lead", value: 49.00, currency: "USD" });`} />
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        open={rotateOpen}
        title="Rotate SDK key?"
        description={`This will generate a new SDK key for "${site.name}". Update your snippet immediately — the old key will stop working.`}
        onConfirm={() => rotateKey.mutate()}
        onClose={() => setRotateOpen(false)}
        dangerous
      />
      <ConfirmDialog
        open={deleteOpen}
        title={`Delete "${site.name}"?`}
        description="This permanently removes the domain, its SDK key, and stops all future scoring. Historical session data is retained."
        onConfirm={() => deleteSite.mutate()}
        onClose={() => setDeleteOpen(false)}
        dangerous
      />

      {/* DNS verification dialog */}
      <Dialog open={verifyOpen} onOpenChange={(v) => !v && setVerifyOpen(false)}>
        <DialogContent className="max-w-lg border-white/10 bg-popover">
          <DialogHeader>
            <DialogTitle className="font-heading text-white flex items-center gap-2"><Certificate size={18} className="text-amber-400" /> Verify domain ownership</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">Add the following DNS TXT record to <span className="font-mono text-slate-300">{site.domain}</span>, then click Confirm verification.</DialogDescription>
          </DialogHeader>
          {dnsRecord && (
            <div className="rounded-md border border-white/10 bg-[#0A0B0D] p-4 space-y-3">
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="data-label pt-0.5">Type</span><span className="font-mono text-white">{dnsRecord.type}</span>
                <span className="data-label pt-0.5">Name</span>
                <div className="min-w-0">
                  <code className="break-all font-mono text-[12px] text-trusted">{dnsRecord.name}</code>
                  <button onClick={() => { navigator.clipboard.writeText(dnsRecord.name); toast.success("Copied"); }} className="ml-2 text-[10px] text-muted-foreground hover:text-white">[copy]</button>
                </div>
                <span className="data-label pt-0.5">Value</span>
                <div className="min-w-0">
                  <code className="break-all font-mono text-[12px] text-trusted">{dnsRecord.value}</code>
                  <button onClick={() => { navigator.clipboard.writeText(dnsRecord.value); toast.success("Copied"); }} className="ml-2 text-[10px] text-muted-foreground hover:text-white">[copy]</button>
                </div>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">DNS propagation can take up to 48 hours. Once the record is live, click confirm.</p>
          <DialogFooter>
            <button onClick={() => setVerifyOpen(false)} className="rounded-md border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-white">Do this later</button>
            <button onClick={() => confirmVerify.mutate()} disabled={confirmVerify.isPending} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50">
              {confirmVerify.isPending ? "Checking…" : "Confirm verification"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Domains() {
  const [addOpen, setAddOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["sites"], queryFn: () => fetcher("/sites") });
  const sites = data?.sites ?? [];

  // Derive the base URL from the first site's snippet or fall back to current origin
  const base = sites[0]?.snippet?.match(/src="([^"]+\/api)/)?.[1]?.replace(/\/api$/, "") ?? window.location.origin;

  return (
    <div className="space-y-5" data-testid="domains-page">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Domains</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your tracked properties, SDK keys, and domain verification.</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-black hover:bg-trusted transition-colors">
          <Plus size={15} weight="bold" /> Add domain
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total domains", value: sites.length },
          { label: "Verified", value: sites.filter((s) => s.verified).length },
          { label: "Unverified", value: sites.filter((s) => !s.verified).length },
          { label: "Sessions tracked", value: sites.reduce((a, s) => a + (s.sessions_total ?? 0), 0).toLocaleString() },
        ].map((c) => (
          <Card key={c.label} className="p-4">
            <div className="data-label">{c.label}</div>
            <div className="mt-1.5 font-mono text-xl font-semibold text-white">{c.value}</div>
          </Card>
        ))}
      </div>

      {/* Sites list */}
      {isLoading ? <Spinner /> : sites.length === 0 ? (
        <Card className="p-10 text-center">
          <GlobeHemisphereWest size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-white">No domains yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first domain to start tracking fraud.</p>
          <button onClick={() => setAddOpen(true)} className="mt-4 flex items-center gap-2 rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-black hover:bg-trusted mx-auto">
            <Plus size={14} weight="bold" /> Add domain
          </button>
        </Card>
      ) : (
        <div className="space-y-2">
          {sites.map((s) => <SiteRow key={s.id} site={s} base={base} />)}
        </div>
      )}

      {/* Setup guide */}
      <Card className="p-5 border-white/5">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><TestTube size={16} className="text-trusted" /> How domain scoring works</h3>
        <div className="grid gap-3 sm:grid-cols-3 text-sm text-muted-foreground">
          {[
            ["1. Install snippet", "Drop the script tag into your site's <head>. It auto-collects signals on every page load."],
            ["2. Verify domain", "Add a DNS TXT record to prove ownership. Verified domains get a trust badge in reporting."],
            ["3. Read the data", "Every session is scored and attributed to this domain. Use the domain filter in the dashboard to isolate it."],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-md border border-white/8 bg-white/[0.02] p-3">
              <div className="font-medium text-slate-300 mb-1">{title}</div>
              <p className="text-[12px] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <AddDomainDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
