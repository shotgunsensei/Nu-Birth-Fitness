import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ResultType } from "./types";

interface FunnelState {
  sessionId: string;
  answers: Record<string, ResultType>;
  currentIndex: number;
  result: ResultType | null;
  scores: Record<ResultType, number> | null;
  email: string | null;
  firstName: string | null;
  setAnswer(key: string, type: ResultType): void;
  setIndex(i: number): void;
  setResult(r: ResultType, scores: Record<ResultType, number>): void;
  setLead(firstName: string, email: string): void;
  reset(): void;
}

function makeSession(): string {
  return `s_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export const useFunnelStore = create<FunnelState>()(
  persist(
    (set) => ({
      sessionId: makeSession(),
      answers: {},
      currentIndex: 0,
      result: null,
      scores: null,
      email: null,
      firstName: null,
      setAnswer: (key, type) =>
        set((s) => ({ answers: { ...s.answers, [key]: type } })),
      setIndex: (i) => set({ currentIndex: Math.max(0, i) }),
      setResult: (result, scores) => set({ result, scores }),
      setLead: (firstName, email) => set({ firstName, email }),
      reset: () =>
        set({
          sessionId: makeSession(),
          answers: {},
          currentIndex: 0,
          result: null,
          scores: null,
          email: null,
          firstName: null,
        }),
    }),
    { name: "nubf-funnel-v1" },
  ),
);
