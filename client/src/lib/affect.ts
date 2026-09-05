/**
 * NarrativeRebuild — Pre/Post Writing Subjective Affect (Module 2, Member 2).
 *
 * A short set of mood and stress (affect) scales completed immediately before
 * and 15 minutes after a writing session. Both scores are stored against the
 * session so short-term emotional shifts (Δ post − pre) can be measured and
 * shown back to the user over time — a key signal in Pennebaker-style
 * expressive-writing research that acute emotional arousal following writing
 * predicts later cognitive integration and health gains.
 */

export const POST_SESSION_DELAY_MS = 15 * 60 * 1000; // 15 minutes

export type AffectPhase = "pre" | "pending-post" | "post" | "complete";

export interface AffectScore {
  /** Mood/valence 0 (very low) → 100 (very positive). */
  mood: number;
  /** Stress/tension 0 (completely calm) → 100 (extremely stressed). */
  stress: number;
  /** Emotional intensity / arousal 0 (flat) → 100 (overwhelming). */
  arousal: number;
}

export interface AffectRecord {
  sessionId: string;
  /** Day in the 4-day protocol this session belongs to (optional). */
  day?: number;
  title: string;
  phase: AffectPhase;
  pre: AffectScore | null;
  preCompletedAt: number | null;
  post: AffectScore | null;
  postCompletedAt: number | null;
  sessionStartedAt: number | null;
  sessionEndedAt: number | null;
  /** Timestamp at which the post session becomes available (+15 min). */
  postReadyAt: number | null;
  createdAt: number;
}

export interface AffectShift {
  mood: number;
  stress: number;
  arousal: number;
}

const STORAGE_KEY = "narrative_rebuild_affect_v1";

const EMPTY_SCORE: AffectScore = { mood: 50, stress: 50, arousal: 50 };

export function emptyScore(): AffectScore {
  return { ...EMPTY_SCORE };
}

export function makeAffectRecord(
  sessionId: string,
  opts: { day?: number; title?: string } = {}
): AffectRecord {
  const now = Date.now();
  return {
    sessionId,
    day: opts.day,
    title: opts.title ?? "Expressive Writing Session",
    phase: "pre",
    pre: null,
    preCompletedAt: null,
    post: null,
    postCompletedAt: null,
    sessionStartedAt: null,
    sessionEndedAt: null,
    postReadyAt: null,
    createdAt: now,
  };
}

export function loadAffectState(): Record<string, AffectRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, AffectRecord>;
  } catch {
    // ignore
  }
  return {};
}

export function saveAffectRecord(record: AffectRecord): void {
  const state = loadAffectState();
  state[record.sessionId] = record;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/** Complete the pre-session scales; marks the session as started. */
export function submitPre(sessionId: string, scores: AffectScore): AffectRecord {
  const state = loadAffectState();
  const record: AffectRecord =
    state[sessionId] ?? makeAffectRecord(sessionId);
  record.pre = { ...scores };
  record.preCompletedAt = Date.now();
  record.sessionStartedAt = Date.now();
  // Phase stays "pre" until the session ends, at which point schedulePost()
  // advances it to "pending-post" awaiting the +15 min post scales.
  saveAffectRecord(record);
  return record;
}

/**
 * Called when the writing session ends. Schedules the post scales to become
 * available `delayMs` later (default 15 minutes) in line with clinical use.
 */
export function schedulePost(
  sessionId: string,
  delayMs: number = POST_SESSION_DELAY_MS
): AffectRecord {
  const state = loadAffectState();
  const record: AffectRecord = state[sessionId] ?? makeAffectRecord(sessionId);
  record.sessionEndedAt = Date.now();
  record.postReadyAt = Date.now() + delayMs;
  record.phase = "pending-post";
  saveAffectRecord(record);
  return record;
}

/** Whether the post scales are currently available for this session. */
export function isPostReady(record: AffectRecord): boolean {
  return (
    record.phase !== "complete" &&
    record.postReadyAt !== null &&
    Date.now() >= record.postReadyAt
  );
}

/** Returns seconds remaining until the post scales become available (0 if ready). */
export function secondsUntilPostReady(record: AffectRecord): number {
  if (record.postReadyAt === null) return 0;
  const diff = record.postReadyAt - Date.now();
  return diff > 0 ? Math.ceil(diff / 1000) : 0;
}

/** Complete the post-session scales; the session is now fully measured. */
export function submitPost(sessionId: string, scores: AffectScore): AffectRecord {
  const state = loadAffectState();
  const record: AffectRecord = state[sessionId] ?? makeAffectRecord(sessionId);
  record.post = { ...scores };
  record.postCompletedAt = Date.now();
  record.phase = "complete";
  saveAffectRecord(record);
  return record;
}

/** Short-term emotional shift: post − pre for each scale. */
export function computeShift(record: AffectRecord): AffectShift | null {
  if (!record.pre || !record.post) return null;
  return {
    mood: record.post.mood - record.pre.mood,
    stress: record.post.stress - record.pre.stress,
    arousal: record.post.arousal - record.pre.arousal,
  };
}

/** A single completed measurement (both scales present) for history views. */
export interface CompletedAffectEntry {
  record: AffectRecord;
  shift: AffectShift;
}

export function listCompletedAffect(records: Record<string, AffectRecord>): CompletedAffectEntry[] {
  return Object.values(records)
    .filter((r) => r.phase === "complete" && r.pre && r.post)
    .map((r) => ({ record: r, shift: computeShift(r)! }))
    .sort((a, b) => a.record.createdAt - b.record.createdAt);
}

/**
 * Aggregate pre→post shift averaged across completed sessions, used for the
 * "shown back to the user over time" summary.
 */
export function averageShift(completed: CompletedAffectEntry[]): AffectShift | null {
  if (completed.length === 0) return null;
  const mood = completed.reduce((s, e) => s + e.shift.mood, 0) / completed.length;
  const stress =
    completed.reduce((s, e) => s + e.shift.stress, 0) / completed.length;
  const arousal =
    completed.reduce((s, e) => s + e.shift.arousal, 0) / completed.length;
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return { mood: round1(mood), stress: round1(stress), arousal: round1(arousal) };
}
