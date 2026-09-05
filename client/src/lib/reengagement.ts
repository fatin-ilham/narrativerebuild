/**
 * NarrativeRebuild — Time-Delayed Re-engagement Engine (Module 4, Member 2).
 *
 * A scheduling rule that locks a specific raw entry for exactly 7 days after it
 * is created. This prevents the user from obsessively re-reading or ruminating
 * on their raw writing before enough time has passed for initial emotional
 * processing to settle — a core safeguard of the Pennebaker protocol, where
 * prematurely re-reading raw trauma narratives can reinforce the very emotional
 * loops the protocol is designed to resolve.
 *
 * Design notes:
 *  - The lock gates *re-reading* (presentation), not storage: analytics
 *    (coherence, pronoun shift, affect) keep reading the raw text for
 *    longitudinal measurement; the 7-day lock specifically blocks the user
 *    from re-opening the raw material.
 *  - The rule is an automatic timer driven off `createdAt`; no manual bypass is
 *    offered in the normal flow, preserving the safety contract.
 */

export const REENGAGEMENT_LOCK_DAYS = 7;
export const REENGAGEMENT_LOCK_MS = REENGAGEMENT_LOCK_DAYS * 24 * 60 * 60 * 1000;

export type ReengagementStatus = "locked" | "ready";

export interface ReengagementEntry {
  /** Stable id for the entry (e.g. `day-1`, `sess-<ts>`). */
  entryId: string;
  /** Human-readable label shown to the user. */
  title: string;
  /** Timestamp (ms) at which the raw entry was created. */
  createdAt: number;
  /** Timestamp (ms) at which the raw entry unlocks = createdAt + 7 days. */
  unlockAt: number;
  /** Timestamp (ms) at which the user was last permitted to re-engage. */
  reengagedAt: number | null;
}

export interface ReengagementLock {
  entryId: string;
  title: string;
  status: ReengagementStatus;
  createdAt: number;
  unlockAt: number;
  /** True when the 7-day lock is still in effect. */
  isLocked: boolean;
  /** Milliseconds remaining until unlock (0 when ready). */
  remainingMs: number;
  /** Seconds remaining until unlock (0 when ready). */
  remainingSec: number;
  reengagedAt: number | null;
}

const STORAGE_KEY = "narrative_rebuild_reengagement_v1";

export function loadReengagementState(): Record<string, ReengagementEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, ReengagementEntry>;
  } catch {
    // ignore
  }
  return {};
}

export function saveReengagementEntry(entry: ReengagementEntry): void {
  const state = loadReengagementState();
  state[entry.entryId] = entry;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/**
 * Register (or refresh) the re-engagement lock for an entry. Called when a raw
 * entry is first written & saved. Re-calling is idempotent: it only creates the
 * lock once based on the earliest `createdAt`.
 */
export function lockEntry(
  entryId: string,
  opts: { title?: string; createdAt?: number } = {}
): ReengagementEntry {
  const state = loadReengagementState();
  const existing = state[entryId];
  const createdAt = opts.createdAt ?? (existing?.createdAt ?? Date.now());
  const entry: ReengagementEntry = {
    entryId,
    title: opts.title ?? existing?.title ?? "Raw Writing Entry",
    createdAt,
    unlockAt: createdAt + REENGAGEMENT_LOCK_MS,
    reengagedAt: existing?.reengagedAt ?? null,
  };
  saveReengagementEntry(entry);
  return entry;
}

/** Derived, purely-computed lock status for an entry at `now`. */
export function getReengagementLock(
  entry: ReengagementEntry,
  now: number = Date.now()
): ReengagementLock {
  const remainingMs = Math.max(0, entry.unlockAt - now);
  const isLocked = remainingMs > 0;
  return {
    entryId: entry.entryId,
    title: entry.title,
    status: isLocked ? "locked" : "ready",
    createdAt: entry.createdAt,
    unlockAt: entry.unlockAt,
    isLocked,
    remainingMs,
    remainingSec: Math.ceil(remainingMs / 1000),
    reengagedAt: entry.reengagedAt,
  };
}

/** Convenience: look up and evaluate an entry's lock status by id. */
export function getLockStatus(
  entryId: string,
  now: number = Date.now()
): ReengagementLock | null {
  const entry = loadReengagementState()[entryId];
  if (!entry) return null;
  return getReengagementLock(entry, now);
}

/** True when the entry is still inside its 7-day lock window. */
export function isEntryLocked(entryId: string, now: number = Date.now()): boolean {
  return getLockStatus(entryId, now)?.isLocked ?? false;
}

/** List all registered entries sorted by creation date (newest first). */
export function listReengagement(
  now: number = Date.now()
): ReengagementLock[] {
  return Object.values(loadReengagementState())
    .map((e) => getReengagementLock(e, now))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Record that the user re-engaged with a now-ready entry. */
export function markReengaged(entryId: string, now: number = Date.now()): ReengagementLock | null {
  const state = loadReengagementState();
  const entry = state[entryId];
  if (!entry) return null;
  entry.reengagedAt = now;
  saveReengagementEntry(entry);
  return getReengagementLock(entry, now);
}

/** Human-readable countdown like "6d 04h 12m" (or "available now"). */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "available now";
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const minutes = totalMin % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
}
