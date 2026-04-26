import { funnelApi } from "./api";

type GtagFn = (...args: unknown[]) => void;
type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};
interface TrackingWindow extends Window {
  dataLayer?: unknown[];
  gtag?: GtagFn;
  fbq?: FbqFn;
  _fbq?: FbqFn;
}
interface FunnelEnv {
  readonly VITE_GA4_MEASUREMENT_ID?: string;
  readonly VITE_META_PIXEL_ID?: string;
}

const env: FunnelEnv =
  (import.meta as unknown as { env?: FunnelEnv }).env ?? {};
const GA_ID: string | undefined = env.VITE_GA4_MEASUREMENT_ID;
const PIXEL_ID: string | undefined = env.VITE_META_PIXEL_ID;

let ga4Loaded = false;
let pixelLoaded = false;

function getWin(): TrackingWindow | null {
  return typeof window === "undefined" ? null : (window as TrackingWindow);
}

function loadGA4(): void {
  const w = getWin();
  if (ga4Loaded || !GA_ID || !w) return;
  ga4Loaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  w.dataLayer = w.dataLayer || [];
  const gtag: GtagFn = (...args: unknown[]) => {
    w.dataLayer!.push(args);
  };
  w.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID);
}

function loadPixel(): void {
  const w = getWin();
  if (pixelLoaded || !PIXEL_ID || !w) return;
  pixelLoaded = true;
  const queue: unknown[] = [];
  const fbq: FbqFn = ((...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
    else queue.push(args);
  }) as FbqFn;
  fbq.queue = queue;
  fbq.loaded = true;
  fbq.version = "2.0";
  w.fbq = fbq;
  if (!w._fbq) w._fbq = fbq;
  const t = document.createElement("script");
  t.async = true;
  t.src = "https://connect.facebook.net/en_US/fbevents.js";
  const first = document.getElementsByTagName("script")[0];
  first?.parentNode?.insertBefore(t, first);
  fbq("init", PIXEL_ID);
  fbq("track", "PageView");
}

export function initTracking(): void {
  loadGA4();
  loadPixel();
}

export interface TrackOptions {
  sessionId?: string;
  leadId?: number;
}

const META_STANDARD: Record<string, string> = {
  LeadCaptured: "Lead",
  BookCTA_Clicked: "Schedule",
  BookedCall: "Schedule",
};

export function track(
  eventName: string,
  payload?: Record<string, unknown>,
  opts: TrackOptions = {},
): void {
  const w = getWin();
  if (!w) return;
  initTracking();
  // GA4
  if (w.gtag) {
    w.gtag("event", eventName, payload ?? {});
  }
  // Meta Pixel
  if (w.fbq) {
    const evt = META_STANDARD[eventName];
    if (evt) w.fbq("track", evt, payload ?? {});
    else w.fbq("trackCustom", eventName, payload ?? {});
  }
  // Internal log (best-effort)
  funnelApi
    .recordEvent(eventName, payload, opts.sessionId, opts.leadId)
    .catch(() => {});
}

export function readUtm(): Record<string, string | undefined> {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  const get = (k: string): string | undefined => sp.get(k) ?? undefined;
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
