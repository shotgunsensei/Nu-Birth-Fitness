import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, LogOut, RefreshCw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminApi,
  type AdminLead,
  type AdminLeadEvent,
  type AdminBookingIntake,
  type AdminEmailSequence,
  type AdminEmailLog,
} from "@/funnel/api";
import { RESULT_META, type ResultType } from "@/funnel/types";

export default function Admin() {
  const qc = useQueryClient();
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const me = useQuery({ queryKey: ["admin-me"], queryFn: adminApi.me });

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr(null);
    try {
      await adminApi.login(password);
      setPassword("");
      qc.invalidateQueries({ queryKey: ["admin-me"] });
    } catch {
      setLoginErr("Invalid password.");
    }
  }
  async function logout() {
    await adminApi.logout();
    qc.invalidateQueries({ queryKey: ["admin-me"] });
  }

  if (me.isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  }
  if (!me.data?.configured) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <h1 className="text-2xl font-serif font-semibold mb-2">Admin not configured</h1>
        <p className="text-sm text-muted-foreground">
          Set the <code>ADMIN_PASSWORD</code> environment variable on the API server to enable the admin dashboard.
        </p>
      </div>
    );
  }
  if (!me.data?.authenticated) {
    return (
      <div className="max-w-sm mx-auto pt-16 px-4">
        <h1 className="text-2xl font-serif font-semibold mb-1 text-center">Funnel Admin</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Enter the admin password to continue.</p>
        <form onSubmit={login} className="space-y-3 bg-card border border-card-border rounded-2xl p-5">
          <div>
            <Label htmlFor="pw">Password</Label>
            <Input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="mt-1.5"
              data-testid="input-admin-password"
            />
          </div>
          {loginErr && <p className="text-sm text-destructive">{loginErr}</p>}
          <Button type="submit" className="w-full rounded-full" data-testid="button-admin-login">
            Sign In
          </Button>
        </form>
      </div>
    );
  }

  return <Dashboard onLogout={logout} selected={selected} setSelected={setSelected} />;
}

function Dashboard({ onLogout, selected, setSelected }: { onLogout: () => void; selected: number | null; setSelected: (id: number | null) => void }) {
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: adminApi.stats });
  const leadsQ = useQuery({ queryKey: ["admin-leads"], queryFn: () => adminApi.leads(200) });
  const qc = useQueryClient();

  function refreshAll() {
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
    qc.invalidateQueries({ queryKey: ["admin-leads"] });
    if (selected) qc.invalidateQueries({ queryKey: ["admin-lead", selected] });
  }

  const totals = stats.data?.totals ?? {};
  const breakdown = stats.data?.breakdown ?? [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 sm:px-6 max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold">Funnel Dashboard</h1>
          <p className="text-sm text-muted-foreground">Reset Trap Quiz performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refreshAll} data-testid="button-refresh">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <a href={adminApi.exportUrl()} download>
            <Button variant="secondary" size="sm" data-testid="button-export">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </a>
          <Button variant="ghost" size="sm" onClick={onLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Quiz Starts" value={totals.quizStarts ?? 0} />
        <Stat label="Quiz Completions" value={totals.quizCompletions ?? 0} />
        <Stat label="Leads Captured" value={totals.leadsCaptured ?? 0} />
        <Stat label="Booked Calls" value={totals.bookedCalls ?? 0} highlight />
        <Stat label="Book CTA Clicks" value={totals.bookCtaClicks ?? 0} />
        <Stat label="Training Clicks" value={totals.trainingClicks ?? 0} />
        <Stat label="Training Views" value={totals.trainingViews ?? 0} />
        <Stat label="Intake Completed" value={totals.intakeCompleted ?? 0} />
        <Stat label="Conversion" value={`${Math.round((totals.conversionRate ?? 0) * 100)}%`} />
      </div>

      <Card className="p-5 mb-6 rounded-2xl">
        <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Mom-Type Breakdown</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(["all_or_nothing", "stuck_loop", "overwhelmed", "lost_herself"] as ResultType[]).map((t) => {
            const row = breakdown.find((b) => b.resultType === t);
            return (
              <div key={t} className="p-3 rounded-xl bg-muted/50 border border-border">
                <div className="text-xs text-muted-foreground">{RESULT_META[t].label}</div>
                <div className="text-2xl font-serif font-semibold tabular-nums">{row?.count ?? 0}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-0 overflow-hidden rounded-2xl">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="font-semibold text-sm uppercase tracking-wide">Recent Leads</span>
            <span className="text-xs text-muted-foreground">{leadsQ.data?.leads?.length ?? 0}</span>
          </div>
          <div className="max-h-[600px] overflow-y-auto divide-y divide-border">
            {(leadsQ.data?.leads ?? []).map((l: AdminLead) => (
              <button
                key={l.id}
                onClick={() => setSelected(l.id)}
                className={`w-full text-left px-4 py-3 hover-elevate flex items-center justify-between gap-3 ${selected === l.id ? "bg-muted" : ""}`}
                data-testid={`row-lead-${l.id}`}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    {l.firstName}
                    {l.status === "booked" && <Badge variant="default" className="text-[10px]">booked</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{l.email}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">{RESULT_META[l.resultType]?.label ?? l.resultType}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
            {!leadsQ.isLoading && (leadsQ.data?.leads ?? []).length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No leads yet.</div>
            )}
          </div>
        </Card>
        <LeadDetail leadId={selected} onChanged={refreshAll} />
      </div>
    </motion.div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <Card className={`p-4 rounded-2xl ${highlight ? "border-primary/40 bg-primary/5" : ""}`}>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-2xl sm:text-3xl font-serif font-semibold tabular-nums mt-1">{value}</div>
    </Card>
  );
}

function LeadDetail({ leadId, onChanged }: { leadId: number | null; onChanged: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-lead", leadId],
    queryFn: () => adminApi.lead(leadId!),
    enabled: !!leadId,
  });

  if (!leadId) {
    return (
      <Card className="p-8 rounded-2xl text-center text-sm text-muted-foreground">
        Select a lead to view details.
      </Card>
    );
  }
  if (isLoading || !data) {
    return <Card className="p-8 rounded-2xl text-center text-sm text-muted-foreground">Loading…</Card>;
  }
  const { lead, submission, events, intakes, sequences, emails, answers: joinedAnswers } = data;
  const tags: string[] = Array.isArray(lead.tags) ? lead.tags : [];
  const scores: Record<string, number> = submission?.scoreJson ?? {};
  const fallbackAnswers: Record<string, string> = submission?.answersJson ?? {};
  // Prefer joined quiz_answers (authoritative option key + bucket); fall back to
  // the flat answersJson blob for legacy leads where it wasn't joined.
  const answerEntries: Array<[string, { answerKey: string; answerType?: string }]> = joinedAnswers
    && Object.keys(joinedAnswers).length > 0
    ? Object.entries(joinedAnswers)
    : Object.entries(fallbackAnswers).map(([k, v]) => [k, { answerKey: v }] as const);

  async function markBooked() {
    await adminApi.markBooked(leadId!);
    onChanged();
  }

  return (
    <Card className="p-5 rounded-2xl space-y-4 max-h-[700px] overflow-y-auto">
      <div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="font-serif font-semibold text-lg">{lead.firstName}</div>
            <div className="text-sm text-muted-foreground">{lead.email}</div>
            {lead.phone && <div className="text-sm text-muted-foreground">{lead.phone}</div>}
          </div>
          <div className="text-right">
            <Badge variant={lead.status === "booked" ? "default" : "secondary"}>{lead.status}</Badge>
            <div className="text-xs text-muted-foreground mt-1">
              {RESULT_META[lead.resultType]?.label ?? lead.resultType}
            </div>
          </div>
        </div>
        {lead.status !== "booked" && (
          <Button size="sm" className="mt-3 rounded-full" onClick={markBooked} data-testid="button-mark-booked">
            Mark as Booked
          </Button>
        )}
      </div>

      {tags.length > 0 && (
        <Section title="Tags">
          <div className="flex flex-wrap gap-1.5" data-testid="lead-tags">
            {tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-[11px]">
                {t}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      <Section title="Quiz answers">
        {answerEntries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No quiz submission linked.</p>
        ) : (
          <div className="space-y-1.5" data-testid="lead-answers">
            {answerEntries.map(([qKey, a]) => (
              <div key={qKey} className="text-xs flex items-center justify-between gap-2 bg-muted/40 rounded-lg px-3 py-1.5">
                <span className="font-medium">{qKey}</span>
                <span className="text-muted-foreground tabular-nums">
                  {a.answerKey}{a.answerType ? ` → ${a.answerType}` : ""}
                </span>
              </div>
            ))}
            {Object.keys(scores).length > 0 && (
              <div className="text-[11px] text-muted-foreground pt-1">
                Scores: {Object.entries(scores).map(([k, v]) => `${k}=${v}`).join(" • ")}
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title="Intakes">
        {intakes.length === 0 ? (
          <p className="text-xs text-muted-foreground">None yet.</p>
        ) : (
          intakes.map((i: AdminBookingIntake) => (
            <div key={i.id} className="text-xs space-y-1 bg-muted/40 rounded-lg p-3">
              {i.biggestStruggle && <div><b>Struggle:</b> {i.biggestStruggle}</div>}
              {i.goal90Days && <div><b>Goal:</b> {i.goal90Days}</div>}
              {i.triedBefore && <div><b>Tried:</b> {i.triedBefore}</div>}
              {i.knockedOff && <div><b>Knocked off:</b> {i.knockedOff}</div>}
              {i.howSoon && <div><b>How soon:</b> {i.howSoon}</div>}
              {i.openToCoaching && <div><b>Open to coaching:</b> {i.openToCoaching}</div>}
              {i.bestPhone && <div><b>Phone:</b> {i.bestPhone}</div>}
              {i.bestTime && <div><b>Best time:</b> {i.bestTime}</div>}
            </div>
          ))
        )}
      </Section>

      <Section title="Email sequences">
        {sequences.length === 0 ? (
          <p className="text-xs text-muted-foreground">None.</p>
        ) : (
          sequences.map((s: AdminEmailSequence) => (
            <div key={s.id} className="text-xs flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
              <span>{s.sequenceType}</span>
              <span>step {s.currentStep}/{s.totalSteps} • {s.status}</span>
            </div>
          ))
        )}
      </Section>

      <Section title="Emails sent">
        {emails.length === 0 ? (
          <p className="text-xs text-muted-foreground">No emails yet.</p>
        ) : (
          emails.map((e: AdminEmailLog) => (
            <div key={e.id} className="text-xs bg-muted/40 rounded-lg px-3 py-2">
              <div className="font-medium truncate">{e.subject}</div>
              <div className="text-muted-foreground">
                {e.status} • {new Date(e.sentAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </Section>

      <Section title="Recent events">
        {events.slice(0, 20).map((ev: AdminLeadEvent) => (
          <div key={ev.id} className="text-xs flex items-center justify-between gap-2 bg-muted/40 rounded-lg px-3 py-1.5">
            <span className="font-medium">{ev.eventName}</span>
            <span className="text-muted-foreground">{new Date(ev.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </Section>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
