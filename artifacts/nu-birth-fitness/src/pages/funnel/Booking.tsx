import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { useFunnelStore } from "@/funnel/store";
import { funnelApi } from "@/funnel/api";
import { SLUG_TO_TYPE, RESULT_META, type ResultType } from "@/funnel/types";
import { track } from "@/funnel/track";
import { FunnelDisclaimer, FunnelSection } from "@/funnel/components";

export default function Booking({ params }: { params: { slug: string } }) {
  const [, setLocation] = useLocation();
  const resultType: ResultType | undefined = SLUG_TO_TYPE[params.slug];
  const sessionId = useFunnelStore((s) => s.sessionId);
  const email = useFunnelStore((s) => s.email);
  const firstName = useFunnelStore((s) => s.firstName);
  const [submitted, setSubmitted] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["funnel-settings"],
    queryFn: funnelApi.getSettings,
  });

  const [form, setForm] = useState({
    biggestStruggle: "",
    goal90Days: "",
    triedBefore: "",
    knockedOff: "",
    howSoon: "",
    openToCoaching: "",
    bestPhone: "",
    bestTime: "",
  });

  useEffect(() => {
    if (!resultType) {
      setLocation("/reset-trap-quiz");
      return;
    }
    track("PageView", { page: "booking", resultType }, { sessionId });
  }, [resultType, setLocation, sessionId]);

  // Listen for the booking provider's "event scheduled" postMessage so we can
  // fire BookedCall to GA4/Meta the moment the user confirms in the iframe,
  // alongside the server-side webhook path. Calendly: type starts with
  // "calendly." and the scheduled event is "calendly.event_scheduled".
  // Cal.com: type === "linkReady" / "bookingSuccessful". We accept any of these.
  useEffect(() => {
    if (!resultType) return;
    function handle(e: MessageEvent) {
      const data = e.data;
      if (!data || typeof data !== "object") return;
      const type = (data as { event?: unknown; type?: unknown }).event
        ?? (data as { type?: unknown }).type;
      if (typeof type !== "string") return;
      if (
        type === "calendly.event_scheduled" ||
        type === "bookingSuccessful" ||
        type === "BOOKING_CONFIRMED"
      ) {
        track("BookedCall", { resultType, source: "iframe", provider: type }, { sessionId });
      }
    }
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [resultType, sessionId]);

  if (!resultType) return null;
  const meta = RESULT_META[resultType];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setSubmitted(true);
      return;
    }
    try {
      await funnelApi.saveIntake({ email, resultType: resultType!, ...form });
      track("IntakeCompleted", { resultType }, { sessionId });
    } catch {
      // continue regardless
    }
    setSubmitted(true);
  }

  function buildCalendarUrl(base: string): string {
    // Preserve lead context into the calendar handoff so the provider
    // (Calendly / Cal.com / Acuity) can prefill name + email and we keep
    // the result type for downstream attribution.
    try {
      const u = new URL(base);
      if (firstName) u.searchParams.set("name", firstName);
      if (email) {
        u.searchParams.set("email", email);
        u.searchParams.set("a1", email);
      }
      if (resultType) {
        u.searchParams.set("a2", resultType);
        u.searchParams.set("utm_content", resultType);
      }
      u.searchParams.set("utm_source", "reset-trap-quiz");
      u.searchParams.set("utm_medium", "result");
      return u.toString();
    } catch {
      return base;
    }
  }

  function openCalendar() {
    const url = settings?.bookingUrl;
    track("CalendarOpened", { resultType, email: !!email }, { sessionId });
    if (url) window.open(buildCalendarUrl(url), "_blank", "noopener");
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-8 sm:pt-12 pb-16">
      <FunnelSection>
        <div className="text-center mb-6">
          <span className="inline-block text-xs font-medium tracking-wide uppercase text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
            Reset Call Intake
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold mb-2">
            {firstName ? `Quick check-in, ${firstName}` : "Quick check-in"}
          </h1>
          <p className="text-sm text-muted-foreground">
            A few short answers help us prepare for your call as the {meta.label}.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={submit} className="bg-card border border-card-border rounded-2xl p-5 sm:p-6 space-y-4">
            <Field label="Biggest current struggle">
              <Textarea
                value={form.biggestStruggle}
                onChange={(e) => setForm({ ...form, biggestStruggle: e.target.value })}
                rows={2}
                data-testid="input-biggestStruggle"
              />
            </Field>
            <Field label="Goal for the next 90 days">
              <Textarea
                value={form.goal90Days}
                onChange={(e) => setForm({ ...form, goal90Days: e.target.value })}
                rows={2}
                data-testid="input-goal90Days"
              />
            </Field>
            <Field label="What have you tried before?">
              <Textarea
                value={form.triedBefore}
                onChange={(e) => setForm({ ...form, triedBefore: e.target.value })}
                rows={2}
                data-testid="input-triedBefore"
              />
            </Field>
            <Field label="What keeps knocking you off track?">
              <Textarea
                value={form.knockedOff}
                onChange={(e) => setForm({ ...form, knockedOff: e.target.value })}
                rows={2}
                data-testid="input-knockedOff"
              />
            </Field>
            <Field label="How soon do you want help?">
              <Input
                value={form.howSoon}
                onChange={(e) => setForm({ ...form, howSoon: e.target.value })}
                placeholder="ASAP / next month / just exploring"
                data-testid="input-howSoon"
              />
            </Field>
            <Field label="Are you open to coaching if it feels like the right fit?">
              <Input
                value={form.openToCoaching}
                onChange={(e) => setForm({ ...form, openToCoaching: e.target.value })}
                placeholder="Yes / Maybe / Not sure"
                data-testid="input-openToCoaching"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Best phone number">
                <Input
                  value={form.bestPhone}
                  onChange={(e) => setForm({ ...form, bestPhone: e.target.value })}
                  type="tel"
                  data-testid="input-bestPhone"
                />
              </Field>
              <Field label="Best time to contact">
                <Input
                  value={form.bestTime}
                  onChange={(e) => setForm({ ...form, bestTime: e.target.value })}
                  placeholder="Mornings, evenings, weekends…"
                  data-testid="input-bestTime"
                />
              </Field>
            </div>
            <Button type="submit" size="lg" className="w-full rounded-full" data-testid="button-submit-intake">
              Continue to Calendar
            </Button>
            <FunnelDisclaimer />
          </form>
        ) : (
          <div className="bg-card border border-card-border rounded-2xl p-5 sm:p-7 text-center">
            <h2 className="text-xl font-serif font-semibold mb-2">Pick a time that works for you</h2>
            <p className="text-sm text-muted-foreground mb-6">
              We’ll show your answers on the call so we can dive right in.
            </p>
            {settings?.bookingUrl ? (
              <>
                <iframe
                  src={buildCalendarUrl(settings.bookingUrl)}
                  title="Booking calendar"
                  className="w-full h-[640px] rounded-xl border border-border bg-background"
                  onLoad={() => track("CalendarOpened", { resultType, email: !!email }, { sessionId })}
                />
                <div className="mt-4">
                  <Button
                    onClick={openCalendar}
                    variant="secondary"
                    className="rounded-full"
                    data-testid="button-open-calendar"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Booking Calendar
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The booking link is not configured yet. We’ll reach out within 24 hours to schedule.
                </p>
                <Button onClick={() => setLocation("/")} variant="secondary" className="rounded-full">
                  Back to Home
                </Button>
              </div>
            )}
            <FunnelDisclaimer className="mt-8" />
          </div>
        )}
      </FunnelSection>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
