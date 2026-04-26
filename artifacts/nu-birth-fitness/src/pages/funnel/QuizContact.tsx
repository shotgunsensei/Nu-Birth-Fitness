import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useFunnelStore } from "@/funnel/store";
import { funnelApi } from "@/funnel/api";
import { RESULT_SLUGS } from "@/funnel/types";
import { track, readUtm, detectDevice } from "@/funnel/track";
import { FunnelDisclaimer, FunnelSection } from "@/funnel/components";

export default function QuizContact() {
  const [, setLocation] = useLocation();
  const sessionId = useFunnelStore((s) => s.sessionId);
  const result = useFunnelStore((s) => s.result);
  const scores = useFunnelStore((s) => s.scores);
  const answers = useFunnelStore((s) => s.answers);
  const setLead = useFunnelStore((s) => s.setLead);

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!result) {
      setLocation("/reset-trap-quiz");
      return;
    }
    track("PageView", { page: "quiz_contact", resultType: result }, { sessionId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!result) return;
    if (!firstName.trim() || !email.trim() || !consent) {
      setErr("Please fill name, email, and consent.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const answersJson: Record<string, string> = {};
      for (const [k, v] of Object.entries(answers)) answersJson[k] = v;
      const r = await funnelApi.saveLead({
        firstName: firstName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        consent,
        resultType: result,
        sessionId,
        scoreJson: scores ?? undefined,
        answersJson,
        utm: readUtm(),
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
        deviceType: detectDevice(),
        source: "quiz",
      });
      setLead(firstName.trim(), email.trim().toLowerCase());
      track("LeadCaptured", { resultType: result }, { sessionId, leadId: r.leadId });
      setLocation(`/results/${RESULT_SLUGS[result]}`);
    } catch (e: any) {
      setErr(e?.message || "Failed to save. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-8 sm:pt-12 pb-16">
      <FunnelSection>
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
            <Lock className="w-3.5 h-3.5" /> Almost there
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold mb-2">
            Where should we send your result?
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            We’ll show your personalized Mom Reset Type and send a copy to your inbox.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 bg-card border border-card-border rounded-2xl p-5 sm:p-6">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
              className="mt-1.5"
              data-testid="input-firstName"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1.5"
              data-testid="input-email"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="flex items-center gap-2">
              Phone <span className="text-xs font-normal text-primary">(optional, helps us follow up)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className="mt-1.5"
              placeholder="(555) 123-4567"
              data-testid="input-phone"
            />
          </div>
          <label className="flex items-start gap-3 text-sm leading-relaxed cursor-pointer">
            <Checkbox
              checked={consent}
              onCheckedChange={(v) => setConsent(Boolean(v))}
              className="mt-0.5"
              data-testid="checkbox-consent"
            />
            <span>
              Yes, send me my quiz result, reset tips, and next steps from Nu-Birth Fitness. I
              understand I can unsubscribe anytime.
            </span>
          </label>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button
            type="submit"
            size="lg"
            className="w-full rounded-full"
            disabled={submitting}
            data-testid="button-submit-lead"
          >
            {submitting ? "Saving…" : "See My Result"}
          </Button>
          <FunnelDisclaimer />
        </form>
      </FunnelSection>
    </motion.div>
  );
}
