import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Calendar, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useFunnelStore } from "@/funnel/store";
import { funnelApi } from "@/funnel/api";
import { SLUG_TO_TYPE, RESULT_SLUGS, RESULT_META, type ResultType } from "@/funnel/types";
import { track } from "@/funnel/track";
import { FunnelDisclaimer, FunnelSection, VideoEmbed } from "@/funnel/components";

const TAKEAWAYS: Record<ResultType, string[]> = {
  all_or_nothing: [
    "The fix isn’t harder, it’s steadier.",
    "One missed day isn’t failure — it’s data.",
    "Build a plan that runs on a hard day, not a perfect one.",
  ],
  stuck_loop: [
    "Restarts don’t break loops — patterns do.",
    "Track the trigger, not just the slip.",
    "Accountability is the thing motivation can’t replace.",
  ],
  overwhelmed: [
    "Simple > optimal when life is full.",
    "Reset the rhythm, not the schedule.",
    "Tiny daily wins beat heroic weekly ones.",
  ],
  lost_herself: [
    "Feeling like yourself comes before fitting your old jeans.",
    "Confidence is built one promise-kept at a time.",
    "The reset rebuilds the woman, not just the body.",
  ],
};

export default function Training({ params }: { params: { slug: string } }) {
  const [, setLocation] = useLocation();
  const resultType: ResultType | undefined = SLUG_TO_TYPE[params.slug];
  const sessionId = useFunnelStore((s) => s.sessionId);
  const firstName = useFunnelStore((s) => s.firstName);

  const { data: settings } = useQuery({
    queryKey: ["funnel-settings"],
    queryFn: funnelApi.getSettings,
  });

  useEffect(() => {
    if (!resultType) {
      setLocation("/reset-trap-quiz");
      return;
    }
    track("PageView", { page: "training", resultType }, { sessionId });
    track("TrainingViewed", { resultType }, { sessionId });
  }, [resultType, setLocation, sessionId]);

  if (!resultType) return null;
  const meta = RESULT_META[resultType];
  const videoSrc = settings?.trainingVideoUrl || null;

  function clickBook() {
    track("BookCTA_Clicked", { resultType, source: "training" }, { sessionId });
    setLocation(`/book/${RESULT_SLUGS[resultType!]}`);
  }
  function backToResult() {
    setLocation(`/results/${RESULT_SLUGS[resultType!]}`);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-8 sm:pt-10 pb-16">
      <FunnelSection>
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-3">
            Before You Start Over Again, Watch This
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {firstName ? `${firstName}, ` : ""}as the {meta.label}, this 4-minute training is the missing piece your last reset didn’t have.
          </p>
        </div>

        <VideoEmbed src={videoSrc} title="4-Minute Reset Training" />

        <div className="mt-6 bg-card border border-card-border rounded-2xl p-5">
          <div className="text-sm font-semibold uppercase tracking-wide text-primary mb-3">3 key takeaways</div>
          <ul className="space-y-2.5 text-sm sm:text-base text-foreground/85">
            {TAKEAWAYS[resultType].map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                  {i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 space-y-3">
          <Button size="lg" className="w-full rounded-full" onClick={clickBook} data-testid="button-book-from-training">
            <Calendar className="w-4 h-4" /> Book My Reset Call
          </Button>
          <Button size="lg" variant="secondary" className="w-full rounded-full" onClick={backToResult} data-testid="button-back-to-result">
            <Mail className="w-4 h-4" /> Send Me the Reset Plan
          </Button>
        </div>

        <FunnelDisclaimer className="mt-8" />
      </FunnelSection>
    </motion.div>
  );
}
