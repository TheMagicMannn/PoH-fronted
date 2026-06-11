// Formatting helpers + shared status/action maps

export const fmtNum = (n) =>
  n == null ? "—" : new Intl.NumberFormat("en-US").format(Math.round(n));

export const fmtCurrency = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: n >= 1000 ? 0 : 2 }).format(n || 0);

export const fmtPct = (n) => (n == null ? "—" : `${Number(n).toFixed(1)}%`);

export function timeAgo(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// classification -> visual config
export const statusConfig = {
  trusted: { label: "Trusted", text: "text-trusted", bg: "bg-trusted/10", border: "border-trusted/25", dot: "bg-trusted", ring: "stroke-trusted", hex: "#34D399" },
  suspicious: { label: "Suspicious", text: "text-suspicious", bg: "bg-suspicious/10", border: "border-suspicious/25", dot: "bg-suspicious", ring: "stroke-suspicious", hex: "#FBBF24" },
  fraudulent: { label: "Fraudulent", text: "text-fraudulent", bg: "bg-fraudulent/10", border: "border-fraudulent/25", dot: "bg-fraudulent", ring: "stroke-fraudulent", hex: "#F87171" },
  review: { label: "Under Review", text: "text-review", bg: "bg-review/10", border: "border-review/25", dot: "bg-review", ring: "stroke-review", hex: "#60A5FA" },
};

// engine action -> visual config
export const actionConfig = {
  observe: { label: "Observe", text: "text-muted-foreground", bg: "bg-white/5", border: "border-white/10" },
  flag: { label: "Flag", text: "text-suspicious", bg: "bg-suspicious/10", border: "border-suspicious/25" },
  review: { label: "Review", text: "text-review", bg: "bg-review/10", border: "border-review/25" },
  block: { label: "Block", text: "text-fraudulent", bg: "bg-fraudulent/10", border: "border-fraudulent/25" },
};

// conversion status -> visual config
export const convStatusConfig = {
  accepted: { label: "Accepted", text: "text-trusted", bg: "bg-trusted/10", border: "border-trusted/25", dot: "bg-trusted" },
  review: { label: "Review", text: "text-review", bg: "bg-review/10", border: "border-review/25", dot: "bg-review" },
  suppressed: { label: "Suppressed", text: "text-suspicious", bg: "bg-suspicious/10", border: "border-suspicious/25", dot: "bg-suspicious" },
  blocked: { label: "Blocked", text: "text-fraudulent", bg: "bg-fraudulent/10", border: "border-fraudulent/25", dot: "bg-fraudulent" },
};

export const REASON_LABELS = {
  browser_automation_detected: "Browser automation indicators (WebDriver) present",
  headless_browser_indicators: "Headless browser signature detected",
  missing_browser_plugins: "No browser plugins on a desktop client",
  no_language_preferences: "Browser reports no language preferences",
  low_human_interaction_depth: "Low human interaction depth (no mouse/scroll/keys)",
  instant_bounce_timing: "Session ended near-instantly (sub-second)",
  tor_exit_node: "Connection originates from a Tor exit node",
  proxy_detected: "Anonymizing proxy detected",
  vpn_usage: "Commercial VPN in use",
  datacenter_ip_origin: "Traffic originates from a hosting / datacenter IP",
  repeated_fingerprint_short_window: "Same device fingerprint repeated in a short window",
  recurring_fingerprint_pattern: "Recurring device fingerprint across sessions",
  abnormal_click_to_conversion_timing: "Abnormally fast click-to-conversion timing",
  anomalous_hardware_profile: "Anomalous hardware concurrency profile",
  high_velocity_source: "High request velocity from traffic source",
};

export const reasonLabel = (code) => REASON_LABELS[code] || code.replace(/_/g, " ");

export function classify(score) {
  if (score >= 70) return "fraudulent";
  if (score >= 40) return "suspicious";
  return "trusted";
}
