import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ResultType } from "./types";

export interface FunnelAttribution {
  utm: Record<string, string>;
  referrer: string;
  landingUrl: string;
  capturedAt: number | null;
}

interface FunnelState {
  sessionId: string;
  answers: Record<string, ResultType>;
  answerKeys: Record<string, string>;
  currentIndex: number;
  result: ResultType | null;
  scores: Record<ResultType, number> | null;
  email: string | null;
  firstName: string | null;
  attribution: FunnelAttribution;
  setAnswer(key: string, type: ResultType, answerKey: string): void;
  setIndex(i: number): void;
  setResult(r: ResultType, scores: Record<ResultType, number>): void;
  setLead(firstName: string, email: string): void;
  setAttribution(attr: FunnelAttribution): void;
  reset(): void;
}

function makeSession(): string {
  return `s_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

const EMPTY_ATTRIBUTION: FunnelAttribution = {
  utm: {},
  referrer: "",
  landingUrl: "",
  capturedAt: null,
};

export const useFunnelStore = create<FunnelState>()(
  persist(
    (set, get) => ({
      sessionId: makeSession(),
      answers: {},
      answerKeys: {},
      currentIndex: 0,
      result: null,
      scores: null,
      email: null,
      firstName: null,
      attribution: EMPTY_ATTRIBUTION,
      setAnswer: (key, type, answerKey) =>
        set((s) => ({
          answers: { ...s.answers, [key]: type },
          answerKeys: { ...s.answerKeys, [key]: answerKey },
        })),
      setIndex: (i) => set({ currentIndex: Math.max(0, i) }),
      setResult: (result, scores) => set({ result, scores }),
      setLead: (firstName, email) => set({ firstName, email }),
      setAttribution: (attr) => set({ attribution: attr }),
      reset: () =>
        set({
          sessionId: makeSession(),
          answers: {},
          answerKeys: {},
          currentIndex: 0,
          result: null,
          scores: null,
          email: null,
          firstName: null,
          attribution: get().attribution,
        }),
    }),
    { name: "nubf-funnel-v1" },
  ),
);
