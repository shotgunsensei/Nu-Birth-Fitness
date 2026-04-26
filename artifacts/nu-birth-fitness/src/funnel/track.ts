import { funnelApi } from "./api";

const GA_ID = (import.meta as any).env?.VITE_GA4_MEASUREMENT_ID as string | undefined;
const PIXEL_ID = (import.meta as any).env?.VITE_META_PIXEL_ID as string | undefined;

let ga4Loaded = false;
let pixelLoaded = false;

function loadGA4() {
  if (ga4Loaded || !GA_ID || typeof window === "undefined") return;
  ga4Loaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).gtag = function gtag(...args: unknown[]) {
    (window as any).dataLayer.push(args);
  };
  (window as any).gtag("js", new Date());
  (window as any).gtag("config", GA_ID);
}

function loadPixel() {
  if (pixelLoaded || !PIXEL_ID || typeof window === "undefined") return;
  pixelLoaded = true;
  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n: any, t: any, s: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode!.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js", undefined, undefined, undefined);
  /* eslint-enable */
  (window as any).fbq("init", PIXEL_ID);
  (window as any).fbq("track", "PageView");
}

export function initTracking() {
  loadGA4();
  loadPixel();
}

export interface TrackOptions {
  sessionId?: string;
  leadId?: number;
}

export function track(eventName: string, payload?: Record<string, unknown>, opts: TrackOptions = {}) {
  if (typeof window === "undefined") return;
  initTracking();
  // GA4
  if ((window as any).gtag) {
    (window as any).gtag("event", eventName, payload ?? {});
  }
  // Meta Pixel
  if ((window as any).fbq) {
    const standard: Record<string, string> = {
      LeadCaptured: "Lead",
      BookCTA_Clicked: "Schedule",
      BookedCall: "Schedule",
    };
    const evt = standard[eventName];
    if (evt) (window as any).fbq("track", evt, payload ?? {});
    else (window as any).fbq("trackCustom", eventName, payload ?? {});
  }
  // Internal log (best-effort)
  funnelApi
    .recordEvent(eventName, payload, opts.sessionId, opts.leadId)
    .catch(() => {});
}

export function readUtm(): Record<string, string | undefined> {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  const get = (k: string) => sp.get(k) ?? undefined;
  return {
    source: get("utm_source"),
    medium: get("utm_medium"),
    campaign: get("utm_campaign"),
    content: get("utm_content"),
    term: get("utm_term"),
  };
}

export function detectDevice(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = window.navigator.userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return "tablet";
  if (/mobile|iphone|android/.test(ua)) return "mobile";
  return "desktop";
}
