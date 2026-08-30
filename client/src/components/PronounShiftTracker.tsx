import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchPronounAnalysis,
  type PronounAnalysis,
} from "../lib/pronouns";

export interface PronounShiftTrackerProps {
  /** Raw entry text to analyze. */
  text: string;
  /** Debounce delay (ms) before analyzing. Default 400. */
  debounceMs?: number;
  className?: string;
}

function interpret(analysis: PronounAnalysis): {
  label: string;
  tone: "ownership" | "distancing" | "balanced" | "neutral";
} {
  if (!analysis.firstCount && !analysis.thirdCount) {
    return { label: "No personal pronouns detected yet", tone: "neutral" };
  }
  const ratio = analysis.firstPercent / Math.max(analysis.thirdPercent, 1);
  if (ratio > 1.5) {
    return {
      label:
        "Strong first-person — the writer is taking ownership of the narrative",
      tone: "ownership",
    };
  }
  if (ratio < 0.66) {
    return {
      label:
        "Third-person dominant — the writer is narrating from a distancing stance",
      tone: "distancing",
    };
  }
  return { label: "Balanced first/third-person voice", tone: "balanced" };
}

const TONE_COLORS = {
  ownership: "text-emerald-400",
  distancing: "text-sky-400",
  balanced: "text-stone-300",
  neutral: "text-stone-500",
} as const;

/**
 * Pronoun Shift Tracker
 *
 * Measures the percentage of first-person pronouns ("I", "me" ...) versus
 * third-person pronouns ("he", "she", "they" ...) in an entry, giving a
 * live signal of emotional ownership vs. distancing. Rendered as a soft,
 * non-intrusive panel that updates as the user writes — reinforcing fluent
 * expressive writing without judging it.
 */
export function PronounShiftTracker({
  text,
  debounceMs = 400,
  className = "",
}: PronounShiftTrackerProps) {
  const [analysis, setAnalysis] = useState<PronounAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const timerRef = useRef<number | null>(null);
  const seqRef = useRef(0);

  const runAnalysis = useCallback(
    async (t: string) => {
      if (!t.trim()) {
        setAnalysis(null);
        return;
      }
      setAnalyzing(true);
      const seq = ++seqRef.current;
      const result = await fetchPronounAnalysis(t);
      // Ignore stale results if a newer analysis superseded this one.
      if (seq === seqRef.current) {
        setAnalysis(result);
        setAnalyzing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      void runAnalysis(text);
    }, debounceMs);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [text, debounceMs, runAnalysis]);

  const first = analysis?.firstPercent ?? 0;
  const third = analysis?.thirdPercent ?? 0;
  const total = first + third;
  const firstWidth = total > 0 ? first : 50;
  const insight = analysis ? interpret(analysis) : null;

  return (
    <section
      className={
        "rounded-2xl border border-stone-800/80 bg-white/5 p-5 " + className
      }
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-widest text-stone-400">
          Pronoun Shift
        </h3>
        <div className="flex items-center gap-2 text-[0.7rem] text-stone-500">
          {analyzing ? (
            <span className="animate-pulse">analyzing…</span>
          ) : analysis ? (
            <span>source: {analysis.source ?? "backend"}</span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-stone-800/70">
        <div className="flex h-full">
          <div
            className="bg-emerald-500/80 transition-all duration-500"
            style={{ width: `${firstWidth}%` }}
            title={`First person: ${first}%`}
          />
          <div
            className="flex-1 bg-sky-500/60 transition-all duration-500"
            style={{ width: `${100 - firstWidth}%` }}
            title={`Third person: ${third}%`}
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-emerald-400">
          First-person · {first}%
          <span className="ml-1 text-stone-500">({analysis?.firstCount ?? 0})</span>
        </span>
        <span className="text-sky-400">
          Third-person · {third}%
          <span className="ml-1 text-stone-500">({analysis?.thirdCount ?? 0})</span>
        </span>
      </div>

      <p
        className={
          "mt-3 text-sm " +
          (insight ? TONE_COLORS[insight.tone] : TONE_COLORS.neutral)
        }
      >
        {insight ? insight.label : "Write an entry to reveal pronoun patterns."}
      </p>
    </section>
  );
}
