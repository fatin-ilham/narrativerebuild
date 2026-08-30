/**
 * Pure-JS Pronoun Shift analyzer.
 *
 * Fallback used when the dedicated Python NLP microservice is unreachable, so
 * the Pronoun Shift Tracker keeps working end-to-end in any environment. It
 * mirrors the Python implementation's lexicons and semantics so the two agree
 * on pronoun classification.
 */

export const FIRST_PERSON = new Set([
  "i", "me", "my", "mine", "myself",
  "we", "us", "our", "ours", "ourselves",
]);

export const THIRD_PERSON = new Set([
  "he", "him", "his", "himself",
  "she", "her", "hers", "herself",
  "it", "its", "itself",
  "they", "them", "their", "theirs", "themself",
  "themselves",
]);

export interface PronounAnalysis {
  firstCount: number;
  thirdCount: number;
  firstPercent: number;
  thirdPercent: number;
  subjectiveRatio: number | null;
  tokenizer: string;
  source: "nlp" | "js-fallback";
}

const TOKEN_RE = /[a-zA-Z']+/g;

export function analyzePronouns(text: string): PronounAnalysis {
  if (!text || !text.trim()) {
    return {
      firstCount: 0,
      thirdCount: 0,
      firstPercent: 0,
      thirdPercent: 0,
      subjectiveRatio: null,
      tokenizer: "regex",
      source: "js-fallback",
    };
  }

  let first = 0;
  let third = 0;
  const lower = text.toLowerCase();
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(lower)) !== null) {
    const t = m[0];
    if (FIRST_PERSON.has(t)) first++;
    else if (THIRD_PERSON.has(t)) third++;
  }

  const total = first + third;
  if (total === 0) {
    return {
      firstCount: 0,
      thirdCount: 0,
      firstPercent: 0,
      thirdPercent: 0,
      subjectiveRatio: null,
      tokenizer: "regex",
      source: "js-fallback",
    };
  }

  const round = (n: number) => Math.round(n * 100) / 100;

  return {
    firstCount: first,
    thirdCount: third,
    firstPercent: round((first / total) * 100),
    thirdPercent: round((third / total) * 100),
    subjectiveRatio: third === 0 ? null : round(first / third),
    tokenizer: "regex",
    source: "js-fallback",
  };
}
