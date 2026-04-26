import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFunnelStore } from "@/funnel/store";
import { QUESTIONS, scoreAnswers, type ResultType } from "@/funnel/types";
import { funnelApi } from "@/funnel/api";
import { track } from "@/funnel/track";
import { FunnelSection, ProgressBar } from "@/funnel/components";

export default function Quiz() {
  const [, setLocation] = useLocation();
  const sessionId = useFunnelStore((s) => s.sessionId);
  const answers = useFunnelStore((s) => s.answers);
  const currentIndex = useFunnelStore((s) => s.currentIndex);
  const setIndex = useFunnelStore((s) => s.setIndex);
  const setAnswer = useFunnelStore((s) => s.setAnswer);
  const setResult = useFunnelStore((s) => s.setResult);

  const total = QUESTIONS.length;
  const idx = Math.min(currentIndex, total - 1);
  const q = QUESTIONS[idx];

  useEffect(() => {
    funnelApi.startQuiz(sessionId).catch(() => {});
    track("QuizStarted", undefined, { sessionId });
    // run once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(type: ResultType, answerKey: string) {
    setAnswer(q.key, type);
    funnelApi.recordAnswer(sessionId, q.key, answerKey, type).catch(() => {});
    track("QuizQuestionAnswered", { questionKey: q.key, answerType: type }, { sessionId });
    if (idx < total - 1) {
      setIndex(idx + 1);
    } else {
      // Compute & complete
      const allAnswers = { ...answers, [q.key]: type };
      const { result, scores } = scoreAnswers(allAnswers);
      setResult(result, scores);
      const answersJson: Record<string, string> = {};
      for (const [k, v] of Object.entries(allAnswers)) answersJson[k] = v;
      funnelApi.completeQuiz(sessionId, result, scores, answersJson).catch(() => {});
      track("QuizCompleted", { resultType: result }, { sessionId });
      setLocation("/quiz/contact");
    }
  }

  function back() {
    if (idx === 0) {
      setLocation("/reset-trap-quiz");
    } else {
      setIndex(idx - 1);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6 sm:pt-10 pb-16 min-h-[80vh]">
      <FunnelSection>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={back}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            Question {idx + 1} of {total}
          </span>
        </div>
        <ProgressBar value={idx + 1} max={total} />

        <AnimatePresence mode="wait">
          <motion.div
            key={q.key}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="mt-8"
          >
            <h2 className="text-2xl sm:text-3xl font-serif font-semibold leading-tight mb-6">
              {q.question}
            </h2>
            <div className="space-y-2.5">
              {q.options.map((o) => {
                const selected = answers[q.key] === o.type;
                return (
                  <button
                    key={o.key}
                    onClick={() => pick(o.type, o.key)}
                    className={`w-full text-left rounded-2xl border-2 p-4 sm:p-5 transition-all hover-elevate active-elevate-2 ${
                      selected ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                    data-testid={`option-${q.key}-${o.key}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold shrink-0 ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {o.key}
                      </span>
                      <span className="text-base sm:text-lg leading-snug pt-0.5">
                        {o.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </FunnelSection>
    </motion.div>
  );
}
