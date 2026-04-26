import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Calendar, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFunnelStore } from "@/funnel/store";
import { RESULT_META, RESULT_SLUGS, SLUG_TO_TYPE, type ResultType } from "@/funnel/types";
import { track } from "@/funnel/track";
import { useQuery } from "@tanstack/react-query";
import { funnelApi } from "@/funnel/api";
import { FunnelDisclaimer, FunnelSection, VideoEmbed } from "@/funnel/components";

export default function Result({ params }: { params: { slug: string } }) {
  const [, setLocation] = useLocation();
  const slug = params.slug;
  const resultType: ResultType | undefined = SLUG_TO_TYPE[slug];
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
    track("PageView", { page: "result", resultType }, { sessionId });
    track("ResultViewed", { resultType }, { sessionId });
  }, [resultType, sessionId, setLocation]);

  if (!resultType) return null;
  const meta = RESULT_META[resultType];
  const videoSrc = settings?.resultVideos?.[resultType] || null;

  function clickBook() {
    if (!resultType) return;
    track("BookCTA_Clicked", { resultType, source: "result_primary" }, { sessionId });
    setLocation(`/book/${RESULT_SLUGS[resultType]}`);
  }

  function clickTraining() {
    if (!resultType) return;
    track("TrainingCTA_Clicked", { resultType, source: "result_secondary" }, { sessionId });
    setLocation(`/training/${RESULT_SLUGS[resultType]}`);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-8 sm:pt-10 pb-32">
      <FunnelSection>
        <div className="text-center mb-6">
          <span className="inline-block text-xs font-medium tracking-wide uppercase text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
            Your Mom Reset Type
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-2">
            {firstName ? `${firstName}, ${meta.headline.toLowerCase().replace(/^you’re/, "you're")}` : meta.headline}
          </h1>
        </div>

        <p className="text-base sm:text-lg leading-relaxed text-foreground/85 mb-6">
          {meta.body}
        </p>

        <VideoEmbed src={videoSrc} title={meta.label} />

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <div className="text-sm font-semibold uppercase tracking-wide text-primary mb-1">What this means</div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              The reset that finally sticks isn’t the hardest one — it’s the one that fits your real life. Yours has a specific shape.
            </p>
          </div>
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <div className="text-sm font-semibold uppercase tracking-wide text-primary mb-1">What needs to change</div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              We’ll match the plan to your pattern instead of asking you to fight it. That’s the difference between trying and finishing.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <Button
            size="lg"
            className="w-full rounded-full text-base"
            onClick={clickBook}
            data-testid="button-book-call"
          >
            <Calendar className="w-4 h-4" /> I’m Ready Now — Book My Reset Call
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {meta.primaryCtaSubcopy}
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="w-full rounded-full"
            onClick={clickTraining}
            data-testid="button-watch-training"
          >
            <PlayCircle className="w-4 h-4" /> I’m Not Ready Yet — Watch the 4-Minute Reset Training
          </Button>
        </div>

        <FunnelDisclaimer className="mt-8" />
      </FunnelSection>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-16 md:bottom-4 inset-x-0 z-40 px-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <Button
            size="lg"
            className="w-full rounded-full shadow-lg"
            onClick={clickBook}
            data-testid="button-book-sticky"
          >
            <Calendar className="w-4 h-4" /> Book My Reset Call
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
