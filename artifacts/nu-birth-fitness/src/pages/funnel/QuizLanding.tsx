import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { useFunnelStore } from "@/funnel/store";
import { RESULT_META, RESULT_TYPES } from "@/funnel/types";
import { track, readUtm } from "@/funnel/track";
import { FunnelSection, FunnelDisclaimer } from "@/funnel/components";

export default function QuizLanding() {
  const [, setLocation] = useLocation();
  const reset = useFunnelStore((s) => s.reset);
  const sessionId = useFunnelStore((s) => s.sessionId);
  const attribution = useFunnelStore((s) => s.attribution);
  const setAttribution = useFunnelStore((s) => s.setAttribution);

  useEffect(() => {
    track("PageView", { page: "quiz_landing" }, { sessionId });
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const hasUtm = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].some((k) => sp.has(k));
    // Capture once on first arrival, or refresh if a new utm_source is present.
    const incomingSource = sp.get("utm_source");
    const shouldCapture =
      !attribution.capturedAt ||
      (incomingSource && incomingSource !== attribution.utm.utm_source);
    if (shouldCapture) {
      const utm: Record<string, string> = {};
      for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
        const v = sp.get(k);
        if (v) utm[k] = v;
      }
      // Fall back to readUtm for backward compatibility (already keyed without prefix).
      if (!hasUtm) {
        const legacy = readUtm();
        for (const [k, v] of Object.entries(legacy)) {
          if (v) utm[`utm_${k}`] = v;
        }
      }
      setAttribution({
        utm,
        referrer: document.referrer || "",
        landingUrl: window.location.href,
        capturedAt: Date.now(),
      });
    }
  }, [sessionId, attribution, setAttribution]);

  function start() {
    reset();
    setLocation("/quiz");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-16"
    >
      <FunnelSection className="pt-10 sm:pt-16 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase text-primary bg-primary/10 px-3 py-1 rounded-full mb-5">
          <Sparkles className="w-3.5 h-3.5" /> 2-minute quiz
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight mb-4">
          What’s Actually Keeping You Stuck?
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-6 max-w-xl mx-auto">
          Take the 2-minute What Type of Mom Are You? Quiz and discover which mom pattern is quietly holding your
          body, energy, and confidence back.
        </p>
        <div className="prose prose-sm sm:prose-base mx-auto text-foreground/85 max-w-xl mb-8">
          <p>
            Be honest — you’ve tried before. You’ve started over. You’ve promised yourself this
            time would be different. But somehow it keeps slipping back into the same cycle. That’s
            not because you’re lazy. That’s not because you’re broken. You may just be stuck in the
            <strong> Reset Trap</strong>.
          </p>
        </div>
        <Button
          size="lg"
          className="rounded-full px-8 text-base"
          onClick={start}
          data-testid="button-start-quiz"
        >
          Take the Quiz <ArrowRight className="w-4 h-4" />
        </Button>

        <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-muted-foreground max-w-md mx-auto">
          {[
            "Takes less than 2 minutes",
            "Built for busy moms",
            "Personalized result",
            "Clear next step based on your mom type",
          ].map((b) => (
            <li key={b} className="flex items-center gap-2 justify-start">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </FunnelSection>

      <FunnelSection className="mt-14">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-center mb-6">
          Your result will be one of these four
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RESULT_TYPES.map((t) => {
            const m = RESULT_META[t];
            return (
              <Card
                key={t}
                className="p-5 border border-card-border bg-card rounded-2xl"
                data-testid={`card-result-preview-${t}`}
              >
                <div className="font-serif font-semibold text-lg mb-1">{m.label}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.short}</p>
              </Card>
            );
          })}
        </div>
      </FunnelSection>

      <FunnelSection className="mt-12 text-center">
        <Button
          size="lg"
          className="rounded-full px-8"
          onClick={start}
          data-testid="button-start-quiz-bottom"
        >
          Find My Mom Reset Type <ArrowRight className="w-4 h-4" />
        </Button>
        <FunnelDisclaimer className="mt-8" />
      </FunnelSection>
    </motion.div>
  );
}
