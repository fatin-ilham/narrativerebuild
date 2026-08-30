export interface PronounAnalysis {
  firstCount: number;
  thirdCount: number;
  firstPercent: number;
  thirdPercent: number;
  subjectiveRatio: number | null;
  source?: string;
}

export const BACKEND_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_BACKEND_URL ?? "http://localhost:4000";

/**
 * Request a pronoun-shift analysis for `text` from the backend, which proxies
 * to the Python NLP microservice (falling back to a bundled JS analyzer when
 * the microservice is offline). Returns null when the backend is unreachable —
 * callers decide how to surface the absence of analysis.
 */
export async function fetchPronounAnalysis(
  text: string
): Promise<PronounAnalysis | null> {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/linguistics/pronouns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!resp.ok) return null;
    return (await resp.json()) as PronounAnalysis;
  } catch {
    return null;
  }
}
