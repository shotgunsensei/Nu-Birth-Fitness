import type { ResultType } from "./types";

async function jpost<T = unknown>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`POST ${path} ${r.status}: ${text.slice(0, 200)}`);
  }
  if (r.status === 204) return null as T;
  const ct = r.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return (await r.json()) as T;
  return (await r.text()) as unknown as T;
}

async function jget<T = unknown>(path: string): Promise<T> {
  const r = await fetch(`/api${path}`, { credentials: "include" });
  if (!r.ok) throw new Error(`GET ${path} ${r.status}`);
  return (await r.json()) as T;
}

export interface FunnelSettings {
  bookingUrl: string | null;
  publicSiteUrl: string | null;
  resultVideos: Record<string, string>;
  trainingVideoUrl: string | null;
}

export const funnelApi = {
  startQuiz: (sessionId: string) => jpost("/quiz/start", { sessionId }),
  recordAnswer: (sessionId: string, questionKey: string, answerKey: string, answerType: ResultType) =>
    jpost("/quiz/answer", { sessionId, questionKey, answerKey, answerType }),
  completeQuiz: (sessionId: string, resultType: ResultType, scoreJson: Record<string, number>, answersJson: Record<string, string>) =>
    jpost("/quiz/complete", { sessionId, resultType, scoreJson, answersJson }),
  saveLead: (body: {
    firstName: string;
    email: string;
    phone?: string | null;
    consent: boolean;
    resultType: ResultType;
    sessionId?: string;
    scoreJson?: Record<string, number>;
    answersJson?: Record<string, string>;
    utm?: Record<string, string | undefined>;
    referrer?: string;
    deviceType?: string;
    source?: string;
  }) => jpost<{ ok: boolean; leadId: number }>("/leads", body),
  recordEvent: (eventName: string, payload?: Record<string, unknown>, sessionId?: string, leadId?: number) =>
    jpost("/events", { eventName, payload, sessionId, leadId }),
  saveIntake: (body: {
    email: string;
    resultType: ResultType;
    biggestStruggle?: string;
    goal90Days?: string;
    triedBefore?: string;
    knockedOff?: string;
    howSoon?: string;
    openToCoaching?: string;
    bestPhone?: string;
    bestTime?: string;
  }) => jpost("/intake", body),
  getSettings: () => jget<FunnelSettings>("/funnel/settings"),
};

export const adminApi = {
  login: (password: string) => jpost<{ ok: boolean }>("/admin/funnel/login", { password }),
  logout: () => jpost("/admin/funnel/logout", {}),
  me: () => jget<{ authenticated: boolean; configured: boolean }>("/admin/funnel/me"),
  stats: () =>
    jget<{
      totals: Record<string, number>;
      breakdown: { resultType: string; count: number }[];
    }>("/admin/funnel/stats"),
  leads: (limit = 100) => jget<{ leads: any[] }>(`/admin/funnel/leads?limit=${limit}`),
  lead: (id: number) =>
    jget<{
      lead: any;
      submission: any;
      events: any[];
      intakes: any[];
      sequences: any[];
      emails: any[];
    }>(`/admin/funnel/leads/${id}`),
  markBooked: (id: number) => jpost(`/admin/funnel/leads/${id}/mark-booked`, {}),
  exportUrl: () => `/api/admin/funnel/export.csv`,
};
