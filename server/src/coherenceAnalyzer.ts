/**
 * Pure-JS Coherence Metric Parser (Module 3, Member 1).
 *
 * Fallback used when the dedicated Python NLP microservice is unreachable,
 * ensuring the Coherence Metric Parser functions reliably in any environment.
 * It measures causal language and cognitive insight/realization words,
 * computing density ratios and depth scores to track cognitive processing depth.
 */

export const CAUSAL_WORDS = new Set([
  "because", "since", "therefore", "thus", "consequently", "hence",
  "cause", "caused", "causes", "causing",
  "reason", "reasons", "why", "wherefore", "inasmuch",
  "result", "results", "resulted", "resulting",
  "effect", "effects", "affect", "affects", "affected", "affecting",
  "leads", "led", "leading",
  "depends", "depended", "depending",
  "outcome", "outcomes", "origin", "originated",
  "driven", "drives", "whereby",
]);

export const CAUSAL_PHRASES = [
  "as a result", "because of", "due to", "in order to", "led to",
  "leading to", "so that", "thanks to", "for this reason",
];

export const INSIGHT_WORDS = new Set([
  "realize", "realizes", "realized", "realizing", "realization",
  "understand", "understands", "understood", "understanding",
  "comprehend", "comprehends", "comprehended", "comprehending", "comprehension",
  "know", "knows", "knew", "knowing", "known", "knowledge",
  "think", "thinks", "thought", "thinking",
  "conclude", "concludes", "concluded", "concluding", "conclusion",
  "meaning", "meanings", "mean", "means", "meant",
  "insight", "insights", "insightful",
  "clarify", "clarifies", "clarified", "clarifying", "clarity",
  "figure", "figured", "figuring",
  "discern", "discerned", "discerning",
  "learn", "learns", "learned", "learning",
  "discover", "discovers", "discovered", "discovering", "discovery",
  "recognize", "recognizes", "recognized", "recognizing", "recognition",
  "perceive", "perceived", "perceiving", "perception",
  "ponder", "pondered", "pondering",
  "reflect", "reflected", "reflecting", "reflection",
  "acknowledge", "acknowledged", "acknowledging",
  "admit", "admitted", "admitting",
  "accept", "accepted", "accepting", "acceptance",
  "resolve", "resolved", "resolving", "resolution",
  "synthesize", "synthesized", "synthesizing", "synthesis",
]);

export interface DetectedWord {
  word: string;
  count: number;
}

export interface CoherenceAnalysis {
  totalWords: number;
  causalCount: number;
  causalDensity: number;
  insightCount: number;
  insightDensity: number;
  totalCoherenceCount: number;
  coherenceRatio: number;
  causalToInsightRatio: number | null;
  depthLevel: string;
  depthScore: number;
  detectedCausalWords: DetectedWord[];
  detectedInsightWords: DetectedWord[];
  tokenizer: string;
  source: "nlp" | "js-fallback";
}

const TOKEN_RE = /[a-zA-Z']+/g;

export function analyzeCoherence(text: string): CoherenceAnalysis {
  if (!text || !text.trim()) {
    return {
      totalWords: 0,
      causalCount: 0,
      causalDensity: 0,
      insightCount: 0,
      insightDensity: 0,
      totalCoherenceCount: 0,
      coherenceRatio: 0,
      causalToInsightRatio: null,
      depthLevel: "Raw / Descriptive Stance",
      depthScore: 0,
      detectedCausalWords: [],
      detectedInsightWords: [],
      tokenizer: "regex",
      source: "js-fallback",
    };
  }

  const lower = text.toLowerCase();
  const tokens: string[] = [];
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(lower)) !== null) {
    tokens.push(m[0]);
  }

  const totalWords = Math.max(tokens.length, 1);

  // 1. Check multi-word causal phrases
  const causalMap = new Map<string, number>();
  let phraseCausalCount = 0;
  for (const phrase of CAUSAL_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "g");
    const matches = lower.match(re);
    if (matches && matches.length > 0) {
      causalMap.set(phrase, matches.length);
      phraseCausalCount += matches.length;
    }
  }

  // 2. Token-level counts
  const insightMap = new Map<string, number>();
  let tokenCausalCount = 0;
  let tokenInsightCount = 0;

  for (const token of tokens) {
    if (CAUSAL_WORDS.has(token)) {
      causalMap.set(token, (causalMap.get(token) ?? 0) + 1);
      tokenCausalCount++;
    } else if (INSIGHT_WORDS.has(token)) {
      insightMap.set(token, (insightMap.get(token) ?? 0) + 1);
      tokenInsightCount++;
    }
  }

  const totalCausal = phraseCausalCount + tokenCausalCount;
  const totalInsight = tokenInsightCount;
  const totalCoherence = totalCausal + totalInsight;

  const round = (n: number) => Math.round(n * 100) / 100;
  const causalDensity = round((totalCausal / totalWords) * 100);
  const insightDensity = round((totalInsight / totalWords) * 100);
  const coherenceRatio = round((totalCoherence / totalWords) * 100);

  let depthLevel = "Raw / Descriptive Stance";
  let depthScore = 0;
  if (coherenceRatio >= 6.0) {
    depthLevel = "High Cognitive Integration";
    depthScore = Math.min(100, Math.round(coherenceRatio * 12));
  } else if (coherenceRatio >= 3.0) {
    depthLevel = "Moderate Cognitive Processing";
    depthScore = Math.round(coherenceRatio * 12);
  } else if (coherenceRatio > 0) {
    depthLevel = "Emerging Causal Reflection";
    depthScore = Math.max(15, Math.round(coherenceRatio * 12));
  }

  const causalToInsightRatio =
    totalInsight > 0 ? round(totalCausal / totalInsight) : null;

  const detectedCausalWords: DetectedWord[] = Array.from(causalMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);

  const detectedInsightWords: DetectedWord[] = Array.from(insightMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalWords,
    causalCount: totalCausal,
    causalDensity,
    insightCount: totalInsight,
    insightDensity,
    totalCoherenceCount: totalCoherence,
    coherenceRatio,
    causalToInsightRatio,
    depthLevel,
    depthScore,
    detectedCausalWords,
    detectedInsightWords,
    tokenizer: "regex",
    source: "js-fallback",
  };
}
