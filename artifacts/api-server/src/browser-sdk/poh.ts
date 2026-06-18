/**
 * PoH Browser SDK — Human Authenticity Intelligence
 * Auto-bundled IIFE, served at /api/poh.js
 * Collects device signals + behavioral biometrics for the Human Authenticity Engine.
 * Also tracks full page journey (every URL visited, time on page, scroll depth).
 */

/* ---------- helpers ---------- */
function safe<T>(fn: () => T, fallback: T): T {
  try { return fn(); } catch { return fallback; }
}

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/* ---------- fingerprint ---------- */
async function canvasFp(): Promise<string | undefined> {
  try {
    const c = document.createElement("canvas");
    c.width = 200; c.height = 50;
    const ctx = c.getContext("2d");
    if (!ctx) return undefined;
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60"; ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069"; ctx.fillText("PoH 🛡️", 2, 15);
    ctx.fillStyle = "rgba(102,204,0,0.7)"; ctx.fillText("PoH 🛡️", 4, 17);
    return c.toDataURL().slice(-32);
  } catch { return undefined; }
}

/* ---------- browser integrity checks ---------- */
function automationMarkers(): string[] {
  const markers: string[] = [];
  const w = window as Record<string, unknown>;
  const d = document as Record<string, unknown>;

  if (safe(() => !!w["__webdriver_evaluate"], false))     markers.push("__webdriver_evaluate");
  if (safe(() => !!w["__selenium_evaluate"], false))      markers.push("__selenium_evaluate");
  if (safe(() => !!w["__selenium_unwrapped"], false))     markers.push("__selenium_unwrapped");
  if (safe(() => !!w["_selenium"], false))                markers.push("_selenium");
  if (safe(() => !!w["_Selenium_IDE_Recorder"], false))   markers.push("selenium_ide");
  if (safe(() => !!w["selenium"], false))                 markers.push("selenium");
  if (safe(() => !!w["_phantom"], false))                 markers.push("phantom");
  if (safe(() => !!w["callPhantom"], false))              markers.push("callPhantom");
  if (safe(() => !!w["__nightmare"], false))              markers.push("nightmare");
  const hasCdc = safe(() => Object.keys(d).some((k) => k.startsWith("$cdc_")), false);
  if (hasCdc) markers.push("cdp_runtime");
  if (safe(() => !!w["domAutomation"], false))            markers.push("domAutomation");
  if (safe(() => !!w["domAutomationController"], false))  markers.push("domAutomationController");

  return markers;
}

function headlessChecks(): { score: number; flags: string[]; automation_markers: string[] } {
  const nav = navigator as Navigator & { webdriver?: boolean };
  const flags: string[] = [];
  let score = 0;

  if (safe(() => !!nav.webdriver, false))                                    { flags.push("webdriver"); score += 40; }
  if (safe(() => nav.plugins.length === 0, false))                          { flags.push("no_plugins"); score += 10; }
  if (safe(() => window.outerWidth === 0, false))                           { flags.push("zero_outer_size"); score += 20; }
  if (safe(() => !nav.languages || nav.languages.length === 0, false))      { flags.push("no_languages"); score += 10; }
  if (safe(() => window.outerHeight > 0 && window.outerHeight === window.innerHeight, false)) {
    flags.push("no_browser_chrome"); score += 10;
  }
  const notifPermission = safe(() => (Notification as { permission?: string }).permission, undefined);
  if (notifPermission === "denied") { flags.push("notification_denied"); score += 5; }

  return { score: Math.min(100, score), flags, automation_markers: automationMarkers() };
}

function deviceSignals() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    user_agent:           safe(() => nav.userAgent, undefined),
    language:             safe(() => nav.language, undefined),
    languages_count:      safe(() => nav.languages?.length, 0),
    timezone:             safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone, undefined),
    screen_width:         safe(() => screen.width, undefined),
    screen_height:        safe(() => screen.height, undefined),
    pixel_ratio:          safe(() => window.devicePixelRatio, undefined),
    hardware_concurrency: safe(() => nav.hardwareConcurrency, undefined),
    device_memory:        safe(() => nav.deviceMemory, undefined),
    touch_support:        safe(() => "ontouchstart" in window || nav.maxTouchPoints > 0, undefined),
    cookies_enabled:      safe(() => nav.cookieEnabled, undefined),
    is_mobile:            safe(() => /Mobi|Android/i.test(nav.userAgent), false),
    plugins_count:        safe(() => nav.plugins?.length ?? 0, 0),
  };
}

/* ---------- math helpers ---------- */
function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function directionEntropy(pts: Array<[number, number]>): number {
  if (pts.length < 3) return 0;
  const angles: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i]![0] - pts[i - 1]![0];
    const dy = pts[i]![1] - pts[i - 1]![1];
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) angles.push(Math.atan2(dy, dx));
  }
  if (angles.length < 2) return 0;
  return Math.min(1, stddev(angles) / Math.PI);
}

/* ---------- behavior tracker ---------- */
class BehaviorTracker {
  private startMs = Date.now();
  private firstInteractionMs: number | null = null;
  private lastEventMs = Date.now();
  private mouseCount = 0;
  private clickCount = 0;
  private keyCount = 0;
  private scrollCount = 0;
  private pasteCount = 0;
  private focusBlurCount = 0;
  private maxScrollY = 0;
  private idlePeriods = 0;

  private mousePts: Array<[number, number]> = [];
  private mouseSampleTimer: ReturnType<typeof setInterval> | null = null;
  private clickTs: number[] = [];
  private scrollTs: number[] = [];
  private keydowns: Array<{ down: number; up?: number }> = [];
  private attached = false;

  private track(fn: EventListener): EventListener {
    return (e) => {
      const now = Date.now();
      if (this.firstInteractionMs === null) this.firstInteractionMs = now - this.startMs;
      if (now - this.lastEventMs > 5000) this.idlePeriods++;
      this.lastEventMs = now;
      fn(e);
    };
  }

  attach() {
    if (this.attached) return;
    this.attached = true;

    document.addEventListener("mousemove", this.track(() => this.mouseCount++), { passive: true });
    document.addEventListener("click", this.track(() => {
      this.clickCount++;
      if (this.clickTs.length < 50) this.clickTs.push(Date.now());
    }), { passive: true });
    document.addEventListener("scroll", this.track(() => {
      this.scrollCount++;
      if (window.scrollY > this.maxScrollY) this.maxScrollY = window.scrollY;
      if (this.scrollTs.length < 100) this.scrollTs.push(Date.now());
    }), { passive: true });
    document.addEventListener("keydown", this.track((_e) => {
      this.keyCount++;
      if (this.keydowns.length < 200) this.keydowns.push({ down: Date.now() });
    }), { passive: true });
    document.addEventListener("keyup", this.track((_e) => {
      const open = [...this.keydowns].reverse().find((k) => !k.up);
      if (open) open.up = Date.now();
    }), { passive: true });
    document.addEventListener("paste", this.track(() => this.pasteCount++), { passive: true });
    window.addEventListener("focus", this.track(() => this.focusBlurCount++), { passive: true });
    window.addEventListener("blur", this.track(() => this.focusBlurCount++), { passive: true });

    this.mouseSampleTimer = setInterval(() => {}, 100);

    let moveSample = 0;
    document.addEventListener("mousemove", (e: Event) => {
      const me = e as MouseEvent;
      moveSample++;
      if (moveSample % 10 === 0 && this.mousePts.length < 200) {
        this.mousePts.push([me.clientX, me.clientY]);
      }
    }, { passive: true });
  }

  collect() {
    if (this.mouseSampleTimer) { clearInterval(this.mouseSampleTimer); this.mouseSampleTimer = null; }
    const duration = Date.now() - this.startMs;
    const cadence = this.keydowns.filter((k) => k.up).map((k) => k.up! - k.down).filter((d) => d > 0 && d < 2000);
    const scrollDepth = Math.round((this.maxScrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)) * 100);
    const mousePathEntropy = directionEntropy(this.mousePts);
    const clickIntervals = this.clickTs.slice(1).map((t, i) => t - this.clickTs[i]!).filter((d) => d > 0);
    const clickIntervalEntropy = clickIntervals.length >= 2 ? Math.round(stddev(clickIntervals)) : undefined;
    const interKeyVariance = cadence.length >= 3 ? Math.round(stddev(cadence)) : undefined;
    const scrollIntervals = this.scrollTs.slice(1).map((t, i) => t - this.scrollTs[i]!).filter((d) => d > 0 && d < 5000);
    const scrollVariance = scrollIntervals.length >= 3 ? Math.round(stddev(scrollIntervals) * 10) / 10 : undefined;

    return {
      mouse_event_count: this.mouseCount,
      click_count: this.clickCount,
      key_event_count: this.keyCount,
      scroll_event_count: this.scrollCount,
      paste_count: this.pasteCount,
      focus_blur_count: this.focusBlurCount,
      idle_periods: this.idlePeriods,
      session_duration_ms: duration,
      first_interaction_ms: this.firstInteractionMs ?? undefined,
      scroll_depth_percent: Math.min(100, scrollDepth),
      avg_keystroke_ms: cadence.length ? Math.round(cadence.reduce((a, b) => a + b, 0) / cadence.length) : undefined,
      mouse_path_entropy: Math.round(mousePathEntropy * 1000) / 1000,
      click_interval_entropy: clickIntervalEntropy,
      inter_key_variance: interKeyVariance,
      scroll_variance: scrollVariance,
    };
  }
}

/* ---------- page view tracker ---------- */
interface PageState {
  url: string;
  path: string;
  title: string;
  referrer: string;
  enteredAt: number;
  maxScrollDepth: number;
}

class PageViewTracker {
  private apiBase: string;
  private sdkKey: string;
  private sessionId: string;
  private current: PageState | null = null;
  private scrollHandler: (() => void) | null = null;
  private flushed = new Set<string>(); // guard against double-send for same enteredAt

  constructor(apiBase: string, sdkKey: string, sessionId: string) {
    this.apiBase = apiBase;
    this.sdkKey = sdkKey;
    this.sessionId = sessionId;
  }

  /** Call once on SDK init — records the landing page and hooks navigation events */
  start() {
    this.beginPage();
    this.hookNavigation();

    // Flush when tab goes hidden (covers most tab-close / navigate-away cases)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.flush();
    });
    // Flush on pagehide (mobile Safari, bfcache)
    window.addEventListener("pagehide", () => this.flush());
  }

  private beginPage() {
    // Remove old scroll listener
    if (this.scrollHandler) {
      window.removeEventListener("scroll", this.scrollHandler);
    }

    const page: PageState = {
      url: location.href,
      path: location.pathname + location.search,
      title: document.title,
      referrer: document.referrer || "",
      enteredAt: Date.now(),
      maxScrollDepth: 0,
    };
    this.current = page;

    // Track scroll depth for this page
    this.scrollHandler = () => {
      const pct = Math.round(
        (window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      page.maxScrollDepth = Math.max(page.maxScrollDepth, Math.min(100, pct));
    };
    window.addEventListener("scroll", this.scrollHandler, { passive: true });

    // Update title after a tick (SPA frameworks set it asynchronously)
    setTimeout(() => { if (this.current === page) page.title = document.title; }, 300);
  }

  flush() {
    const page = this.current;
    if (!page) return;

    // Deduplicate: same page, same entry time
    const key = `${page.url}:${page.enteredAt}`;
    if (this.flushed.has(key)) return;
    this.flushed.add(key);

    this.current = null;
    if (this.scrollHandler) {
      window.removeEventListener("scroll", this.scrollHandler);
      this.scrollHandler = null;
    }

    const timeOnPageMs = Date.now() - page.enteredAt;
    const payload = JSON.stringify({
      sdk_key:          this.sdkKey,
      session_id:       this.sessionId,
      url:              page.url,
      path:             page.path,
      title:            page.title || document.title,
      referrer:         page.referrer,
      time_on_page_ms:  timeOnPageMs,
      scroll_depth_pct: page.maxScrollDepth,
      entered_at:       new Date(page.enteredAt).toISOString(),
    });

    // sendBeacon survives page unload; fall back to keepalive fetch
    const endpoint = `${this.apiBase}/api/pageview`;
    const sent = safe(
      () => navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" })),
      false
    );
    if (!sent) {
      safe(() => {
        fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true })
          .catch(() => {});
        return true;
      }, false);
    }
  }

  /** Navigate to a new page within the same session (SPA route change) */
  navigate() {
    this.flush();
    this.beginPage();
  }

  private hookNavigation() {
    // Intercept SPA pushState / replaceState
    const origPush    = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      this.flush();
      origPush(...args);
      // Small delay so the framework can update document.title
      setTimeout(() => this.beginPage(), 80);
    };

    history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
      origReplace(...args);
      // replaceState is usually URL-only changes (query params); don't count as new page
    };

    // Browser back / forward
    window.addEventListener("popstate", () => {
      this.flush();
      setTimeout(() => this.beginPage(), 80);
    });
  }
}

/* ---------- session storage ---------- */
const SESSION_KEY = "poh_sid";
function getOrCreateSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) { sid = uuid(); sessionStorage.setItem(SESSION_KEY, sid); }
  return sid;
}

/* ---------- UTM reading ---------- */
function readUtm() {
  const p = new URLSearchParams(location.search);
  return {
    source: p.get("utm_source") ?? undefined,
    medium: p.get("utm_medium") ?? undefined,
    campaign: p.get("utm_campaign") ?? undefined,
    ad_set: p.get("utm_content") ?? undefined,
  };
}

/* ---------- main SDK class ---------- */
class PoH {
  private apiBase: string;
  private sdkKey: string;
  private sessionId: string;
  private behavior: BehaviorTracker;
  private pageViews: PageViewTracker;
  private sent = false;

  constructor(apiBase: string, sdkKey: string) {
    this.apiBase = apiBase.replace(/\/$/, "");
    this.sdkKey = sdkKey;
    this.sessionId = getOrCreateSessionId();
    this.behavior = new BehaviorTracker();
    this.behavior.attach();
    this.pageViews = new PageViewTracker(this.apiBase, this.sdkKey, this.sessionId);
    this.pageViews.start();
  }

  private async sendCollect(extra: Record<string, unknown> = {}) {
    const { score, flags, automation_markers } = headlessChecks();
    const fp = await canvasFp();
    const payload = {
      sdk_key: this.sdkKey,
      session_id: this.sessionId,
      page: location.href,
      referrer: document.referrer || undefined,
      utm: readUtm(),
      signals: {
        ...deviceSignals(),
        webdriver: flags.includes("webdriver"),
        headless_score: score,
        headless_flags: flags,
        automation_markers,
      },
      behavior: this.behavior.collect(),
      fingerprint: fp,
      ...extra,
    };

    try {
      await fetch(`${this.apiBase}/api/collect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch { /* fire-and-forget */ }
  }

  async track() {
    if (this.sent) return;
    this.sent = true;
    await this.sendCollect({ event_type: "page_view" });
  }

  async convert(opts: { type?: string; value?: number; currency?: string } = {}) {
    await this.sendCollect({ event_type: "conversion", conversion: opts });
  }

  getSessionId() { return this.sessionId; }
}

/* ---------- auto-init ---------- */
declare global {
  interface Window { poh: PoH; }
}

(function init() {
  const script = (document.currentScript as HTMLScriptElement | null)
    ?? document.querySelector<HTMLScriptElement>("script[data-poh-key]");

  const sdkKey = script?.getAttribute("data-poh-key") ?? "";
  if (!sdkKey) {
    console.warn("[PoH] Missing data-poh-key attribute on the script tag.");
    return;
  }

  let apiBase = "";
  if (script?.src) {
    try {
      const u = new URL(script.src);
      apiBase = `${u.protocol}//${u.host}`;
    } catch { /* relative src — same origin */ }
  }

  const poh = new PoH(apiBase, sdkKey);
  window.poh = poh;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => poh.track());
  } else {
    poh.track();
  }
})();
