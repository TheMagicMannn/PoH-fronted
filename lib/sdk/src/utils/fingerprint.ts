import type { DeviceSignal } from "../types/common.js";

function safeGet<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

async function getCanvasFingerprint(): Promise<string | undefined> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("PoH Intelligence SDK", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("PoH Intelligence SDK", 4, 17);
    return canvas.toDataURL().slice(-32);
  } catch {
    return undefined;
  }
}

async function getWebGLFingerprint(): Promise<string | undefined> {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
    if (!gl || !(gl instanceof WebGLRenderingContext)) return undefined;
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return undefined;
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    return `${vendor}::${renderer}`.slice(0, 64);
  } catch {
    return undefined;
  }
}

function getInstalledFonts(): string[] {
  const testFonts = [
    "Arial", "Arial Black", "Comic Sans MS", "Courier New",
    "Georgia", "Impact", "Times New Roman", "Trebuchet MS",
    "Verdana", "Helvetica", "Palatino", "Garamond",
  ];
  if (typeof document === "undefined") return [];
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  const baseFonts = ["monospace", "sans-serif", "serif"];
  const testString = "mmmmmmmmmmlli";
  const testSize = "72px";
  const defaultWidths = new Map<string, number>();
  baseFonts.forEach((base) => {
    ctx.font = `${testSize} ${base}`;
    defaultWidths.set(base, ctx.measureText(testString).width);
  });
  return testFonts.filter((font) =>
    baseFonts.some((base) => {
      ctx.font = `${testSize} '${font}', ${base}`;
      return ctx.measureText(testString).width !== defaultWidths.get(base);
    }),
  );
}

export async function collectDeviceSignals(): Promise<DeviceSignal> {
  if (typeof window === "undefined") {
    return {};
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    userAgentData?: { platform?: string; mobile?: boolean };
  };

  const screen = window.screen;
  const [canvasFp, webglFp] = await Promise.all([
    getCanvasFingerprint(),
    getWebGLFingerprint(),
  ]);

  const fonts = safeGet(() => getInstalledFonts(), []);

  return {
    userAgent: safeGet(() => nav.userAgent, undefined),
    language: safeGet(() => nav.language, undefined),
    languages: safeGet(() => Array.from(nav.languages), undefined),
    timezone: safeGet(() => Intl.DateTimeFormat().resolvedOptions().timeZone, undefined),
    screenWidth: safeGet(() => screen.width, undefined),
    screenHeight: safeGet(() => screen.height, undefined),
    pixelRatio: safeGet(() => window.devicePixelRatio, undefined),
    colorDepth: safeGet(() => screen.colorDepth, undefined),
    hardwareConcurrency: safeGet(() => nav.hardwareConcurrency, undefined),
    deviceMemory: safeGet(() => nav.deviceMemory, undefined),
    touchSupport: safeGet(() => "ontouchstart" in window || nav.maxTouchPoints > 0, undefined),
    cookiesEnabled: safeGet(() => nav.cookieEnabled, undefined),
    doNotTrack: safeGet(() => nav.doNotTrack, undefined),
    deviceId: canvasFp ?? webglFp,
  };
}

export function detectHeadlessIndicators(): {
  webdriverPresent: boolean;
  navigatorAnomalies: string[];
  headlessProbability: number;
} {
  if (typeof window === "undefined") {
    return { webdriverPresent: false, navigatorAnomalies: [], headlessProbability: 0 };
  }

  const nav = navigator as Navigator & { webdriver?: boolean };
  const anomalies: string[] = [];
  let headlessScore = 0;

  const webdriverPresent = safeGet(() => !!nav.webdriver, false);
  if (webdriverPresent) {
    anomalies.push("webdriver_property_present");
    headlessScore += 40;
  }

  if (safeGet(() => nav.plugins.length === 0, false)) {
    anomalies.push("no_plugins");
    headlessScore += 10;
  }

  if (safeGet(() => !("ondeviceorientation" in window) && nav.maxTouchPoints === 0, false)) {
    anomalies.push("no_orientation_support");
    headlessScore += 5;
  }

  if (safeGet(() => window.outerWidth === 0 && window.outerHeight === 0, false)) {
    anomalies.push("zero_outer_dimensions");
    headlessScore += 20;
  }

  try {
    const perm = (window as typeof window & { Notification?: { permission?: string } }).Notification;
    if (perm && perm.permission === "denied") {
      headlessScore += 5;
    }
  } catch {
  }

  return {
    webdriverPresent,
    navigatorAnomalies: anomalies,
    headlessProbability: Math.min(100, headlessScore),
  };
}
