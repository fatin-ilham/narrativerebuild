import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchCoherenceAnalysis,
  analyzeCoherenceLocal,
  type CoherenceAnalysis,
} from "../lib/coherence";
import type { NarrativeSequenceState } from "../lib/narrativeProtocol";

export interface CoherenceMetricParserProps {
  text: string;
  sequenceState?: NarrativeSequenceState;
  debounceMs?: number;
  className?: string;
}

export function CoherenceMetricParser({
  text,
  sequenceState,
  debounceMs = 400,
  className = "",
}: CoherenceMetricParserProps) {
  const [analysis, setAnalysis] = useState<CoherenceAnalysis>(() =>
    analyzeCoherenceLocal(text)
  );
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);
  const seqRef = useRef<number>(0);

  const runAnalysis = useCallback(async (t: string) => {
    if (!t.trim()) {
      setAnalysis(analyzeCoherenceLocal(""));
      return;
    }

    setIsAnalyzing(true);
    const seq = ++seqRef.current;
    const result = await fetchCoherenceAnalysis(t);

    if (seq === seqRef.current) {
      setAnalysis(result);
      setIsAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      void runAnalysis(text);
    }, debounceMs);

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [text, debounceMs, runAnalysis]);

  // Longitudinal Cross-Session Trend Data (Days 1 to 4)
  const daysTrend = [1, 2, 3, 4].map((dayNum) => {
    const record = sequenceState?.completedDays[dayNum];
    if (record) {
      const dayAnalysis = analyzeCoherenceLocal(record.text);
      return {
        day: dayNum,
        label: `Day ${dayNum}`,
        ratio: dayAnalysis.coherenceRatio,
        hasData: true,
        wordCount: record.wordCount,
      };
    }
    return {
      day: dayNum,
      label: `Day ${dayNum}`,
      ratio: 0,
      hasData: false,
      wordCount: 0,
    };
  });

  const getDepthBadge = (level: string) => {
    switch (level) {
      case "High Cognitive Integration":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "Moderate Cognitive Processing":
        return "bg-sky-500/20 text-sky-300 border-sky-500/40";
      case "Emerging Causal Reflection":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      default:
        return "bg-stone-800 text-stone-400 border-stone-700";
    }
  };

  return (
    <section
      className={
        "rounded-2xl border border-stone-800/80 bg-stone-900/60 backdrop-blur-md p-6 text-stone-100 " +
        className
      }
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-sky-400 border border-sky-500/30">
              Module 3 · Linguistic Engine
            </span>
            <span className="text-xs text-stone-500">Pennebaker Causal Marker Engine</span>
          </div>
          <h3 className="mt-1 text-base font-bold text-stone-100">
            Coherence Metric Parser
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {isAnalyzing ? (
            <span className="text-stone-400 animate-pulse">analyzing syntax…</span>
          ) : (
            <span className="text-stone-500">source: {analysis.source ?? "nlp"}</span>
          )}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Coherence Ratio */}
        <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-4">
          <span className="text-[0.7rem] uppercase tracking-wider text-stone-400">
            Coherence Density
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-400">
              {analysis.coherenceRatio}%
            </span>
            <span className="text-xs text-stone-500">
              ({analysis.totalCoherenceCount} markers / {analysis.totalWords} words)
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
            <div
              className="h-full bg-sky-400 transition-all duration-500"
              style={{ width: `${Math.min(100, analysis.coherenceRatio * 10)}%` }}
            />
          </div>
        </div>

        {/* Causal Language Density */}
        <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-4">
          <span className="text-[0.7rem] uppercase tracking-wider text-stone-400">
            Cause-and-Effect Density
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">
              {analysis.causalDensity}%
            </span>
            <span className="text-xs text-stone-500">
              ({analysis.causalCount} words)
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
            <div
              className="h-full bg-amber-400 transition-all duration-500"
              style={{ width: `${Math.min(100, analysis.causalDensity * 12)}%` }}
            />
          </div>
        </div>

        {/* Cognitive Insight Density */}
        <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-4">
          <span className="text-[0.7rem] uppercase tracking-wider text-stone-400">
            Cognitive Insight Density
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">
              {analysis.insightDensity}%
            </span>
            <span className="text-xs text-stone-500">
              ({analysis.insightCount} words)
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
            <div
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, analysis.insightDensity * 12)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cognitive Depth Classification */}
      <div className="mt-4 flex flex-wrap items-center justify-between rounded-xl border border-stone-800/70 bg-stone-950/40 p-4">
        <div>
          <span className="text-[0.7rem] uppercase tracking-wider text-stone-500">
            Cognitive Processing Depth Proxy:
          </span>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={
                "rounded-md border px-2.5 py-0.5 text-xs font-semibold " +
                getDepthBadge(analysis.depthLevel)
              }
            >
              {analysis.depthLevel}
            </span>
            <span className="text-xs text-stone-400">
              Score: {analysis.depthScore}/100
            </span>
          </div>
        </div>

        <p className="mt-2 max-w-md text-xs text-stone-400 sm:mt-0">
          {analysis.depthScore >= 60
            ? "High integration: active causal synthesis and meaning construction observed."
            : analysis.depthScore >= 30
            ? "Moderate processing: emerging structure connecting causes with lived experiences."
            : "Descriptive stance: predominantly affective or chronological without analytical framing."}
        </p>
      </div>

      {/* Detected Keywords Badges */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Causal Keywords */}
        <div className="rounded-xl border border-stone-800/60 bg-stone-950/40 p-3.5">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-semibold text-amber-400">
              Detected Cause-and-Effect Markers:
            </span>
            <span>{analysis.detectedCausalWords.length} terms</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {analysis.detectedCausalWords.length > 0 ? (
              analysis.detectedCausalWords.map((item, idx) => (
                <span
                  key={idx}
                  className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300"
                >
                  {item.word} {item.count > 1 && `(${item.count})`}
                </span>
              ))
            ) : (
              <span className="text-xs text-stone-600 italic">
                No causal words ("because", "therefore", "led to") detected yet.
              </span>
            )}
          </div>
        </div>

        {/* Insight Keywords */}
        <div className="rounded-xl border border-stone-800/60 bg-stone-950/40 p-3.5">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-semibold text-emerald-400">
              Detected Insight & Realization Markers:
            </span>
            <span>{analysis.detectedInsightWords.length} terms</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {analysis.detectedInsightWords.length > 0 ? (
              analysis.detectedInsightWords.map((item, idx) => (
                <span
                  key={idx}
                  className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300"
                >
                  {item.word} {item.count > 1 && `(${item.count})`}
                </span>
              ))
            ) : (
              <span className="text-xs text-stone-600 italic">
                No insight words ("realize", "understand", "learned") detected yet.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Longitudinal 4-Day Cross-Session Progression */}
      {sequenceState && (
        <div className="mt-6 border-t border-stone-800/80 pt-5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              Longitudinal Coherence Progression (Day 1 → Day 4)
            </h4>
            <span className="text-[0.7rem] text-stone-500">
              Pennebaker Cognitive Shift Curve
            </span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {daysTrend.map((pt) => {
              const maxRatio = Math.max(...daysTrend.map((d) => d.ratio), 10);
              const heightPercent = pt.hasData
                ? Math.max(15, Math.round((pt.ratio / maxRatio) * 100))
                : 6;

              return (
                <div
                  key={pt.day}
                  className="flex flex-col items-center rounded-xl border border-stone-800 bg-stone-950/50 p-3 text-center"
                >
                  <div className="flex h-20 w-full items-end justify-center">
                    <div
                      className={
                        "w-7 rounded-t-md transition-all duration-500 " +
                        (pt.hasData
                          ? "bg-gradient-to-t from-sky-600 to-emerald-400 shadow-md shadow-emerald-500/10"
                          : "bg-stone-800")
                      }
                      style={{ height: `${heightPercent}%` }}
                      title={pt.hasData ? `${pt.ratio}% coherence` : "No session yet"}
                    />
                  </div>
                  <span className="mt-2 text-xs font-bold text-stone-300">
                    {pt.label}
                  </span>
                  <span className="text-[0.65rem] text-stone-500">
                    {pt.hasData ? `${pt.ratio}% ratio` : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
