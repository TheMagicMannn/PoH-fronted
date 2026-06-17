"""The drop-in PoH client SDK served at /api/poh.js.

Self-configuring: reads its own <script> tag for data-poh-key and derives the
ingestion endpoint from the script's own origin. Collects privacy-safe device,
browser and behavioral signals and posts them to /api/collect on unload, plus
exposes window.poh.convert() for conversion events.
"""

POH_SDK_JS = r"""
(function () {
  "use strict";
  var script = document.currentScript;
  if (!script) {
    var all = document.getElementsByTagName("script");
    for (var i = 0; i < all.length; i++) {
      if (all[i].src && all[i].src.indexOf("/api/poh.js") !== -1) { script = all[i]; break; }
    }
  }
  var KEY = script ? script.getAttribute("data-poh-key") : null;
  var ORIGIN = script ? new URL(script.src).origin : window.location.origin;
  var API = ORIGIN + "/api";

  if (!KEY) { console.warn("[PoH] missing data-poh-key on script tag"); return; }

  function uid() {
    return "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
  }

  var SESSION_KEY = "__poh_sid";
  var sid;
  try {
    sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) { sid = uid(); sessionStorage.setItem(SESSION_KEY, sid); }
  } catch (e) { sid = uid(); }

  var start = Date.now();
  var interaction = 0, mouse = 0, keys = 0, scrolls = 0, maxScroll = 0;
  window.addEventListener("mousemove", function () { mouse++; interaction++; }, { passive: true });
  window.addEventListener("keydown", function () { keys++; interaction++; }, { passive: true });
  window.addEventListener("scroll", function () {
    scrolls++; interaction++;
    var d = document.documentElement;
    var pct = (window.scrollY + window.innerHeight) / (d.scrollHeight || 1);
    if (pct > maxScroll) maxScroll = pct;
  }, { passive: true });

  function canvasHash() {
    try {
      var c = document.createElement("canvas");
      var ctx = c.getContext("2d");
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = "#f60"; ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069"; ctx.fillText("PoH-fp-\u26A1", 2, 15);
      var data = c.toDataURL();
      var h = 0;
      for (var i = 0; i < data.length; i++) { h = (h << 5) - h + data.charCodeAt(i); h |= 0; }
      return (h >>> 0).toString(16);
    } catch (e) { return "0"; }
  }

  function webglVendor() {
    try {
      var gl = document.createElement("canvas").getContext("webgl");
      var ext = gl.getExtension("WEBGL_debug_renderer_info");
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "";
    } catch (e) { return ""; }
  }

  function fingerprint(sig) {
    var parts = [
      navigator.userAgent, sig.languages_count, screen.width + "x" + screen.height,
      sig.timezone, sig.hardware_concurrency, sig.device_memory, sig.canvas, sig.webgl
    ].join("|");
    var h = 0;
    for (var i = 0; i < parts.length; i++) { h = (h << 5) - h + parts.charCodeAt(i); h |= 0; }
    return "fp_" + (h >>> 0).toString(16);
  }

  function utmParams() {
    var p = new URLSearchParams(window.location.search);
    return {
      source: p.get("utm_source") || "", medium: p.get("utm_medium") || "",
      campaign: p.get("utm_campaign") || "", term: p.get("utm_term") || "",
      content: p.get("utm_content") || ""
    };
  }

  function collectSignals(extra) {
    var sig = {
      user_agent: navigator.userAgent,
      webdriver: !!navigator.webdriver,
      headless: /HeadlessChrome/.test(navigator.userAgent),
      plugins_count: (navigator.plugins && navigator.plugins.length) || 0,
      languages_count: (navigator.languages && navigator.languages.length) || 0,
      hardware_concurrency: navigator.hardwareConcurrency || null,
      device_memory: navigator.deviceMemory || null,
      touch_support: ("ontouchstart" in window) || navigator.maxTouchPoints > 0,
      is_mobile: /Mobi|Android|iPhone|iPad/.test(navigator.userAgent),
      timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone) || "",
      screen: screen.width + "x" + screen.height,
      interaction_depth: interaction,
      mouse_moves: mouse, key_presses: keys, scroll_events: scrolls,
      scroll_depth: Math.round(maxScroll * 100),
      time_on_page: Math.round((Date.now() - start) / 1000),
      canvas: canvasHash(),
      webgl: webglVendor()
    };
    if (extra) for (var k in extra) sig[k] = extra[k];
    return sig;
  }

  function send(path, payload, beacon) {
    var url = API + path;
    var body = JSON.stringify(payload);
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    } else {
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" },
        body: body, keepalive: true }).catch(function () {});
    }
  }

  function payloadBase(extra) {
    var sig = collectSignals(extra);
    return {
      sdk_key: KEY, session_id: sid, fingerprint: fingerprint(sig),
      signals: sig, page: window.location.href,
      referrer: document.referrer || "", utm: utmParams()
    };
  }

  var sentInitial = false;
  function flush(beacon) {
    var p = payloadBase();
    send("/collect", p, beacon);
    sentInitial = true;
  }

  // Initial sample shortly after load, then a final flush on unload.
  if (document.readyState === "complete") setTimeout(function () { flush(false); }, 1500);
  else window.addEventListener("load", function () { setTimeout(function () { flush(false); }, 1500); });

  window.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush(true);
  });
  window.addEventListener("pagehide", function () { flush(true); });

  window.poh = {
    sessionId: sid,
    track: function (name, data) {
      send("/collect", Object.assign(payloadBase({ event_name: name }), { event: { name: name, data: data || {} } }), false);
    },
    convert: function (opts) {
      opts = opts || {};
      var p = payloadBase({ click_to_conversion_ms: Date.now() - start });
      p.type = opts.type || "conversion";
      p.value = opts.value || 0;
      p.currency = opts.currency || "USD";
      send("/convert", p, false);
    }
  };
})();
"""
