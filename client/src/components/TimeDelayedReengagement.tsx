import { useEffect, useMemo, useState } from "react";
import {
  getReengagementLock,
  getLockStatus,
  listReengagement,
  formatRemaining,
  markReengaged,
  REENGAGEMENT_LOCK_DAYS,
  REENGAGEMENT_LOCK_MS,
  type ReengagementLock,
} from "../lib/reengagement";

export interface ProtectedRawEntry {
  entryId: string;
  title: string;
  text: string;
  /** Timestamp (ms) the raw entry was created. Optional; defaults to now. */
  createdAt?: number;
}

export interface TimeDelayedReengagementProps {
  /** Raw entries that should be protected by the 7-day re-engagement lock. */
  entries?: ProtectedRawEntry[];
  /** Show the full registry of all protected entries. Default true. */
  showRegistry?: boolean;
  /** Live countdown tick interval (ms). Default 1000. */
  tickMs?: number;
  className?: string;
}

function LockedCard({ lock, onReEngage }: { lock: ReengagementLock; onReEngage?: (id: string) => void }) {
  if (!lock.isLocked) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
        <div>
          <p className="text-sm font-semibold text-emerald-300">Unlocked & ready to re-engage</p>
          <p className="text-xs text-stone-400">
            The 7-day cooling-off period has passed for "{lock.title}".
          </p>
        </div>
        {onReEngage && (
          <button
            onClick={() => onReEngage(lock.entryId)}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-stone-950 hover:bg-emerald-400 transition"
          >
            Re-engage entry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-300">Protected from re-reading for now</p>
          <p className="text-xs text-stone-400">
            Raw text is held until enough time has passed for initial emotional processing to settle.
          </p>
        </div>
      </div>
      <div className="text-right">
        <span className="block font-mono text-lg font-bold tabular-nums text-amber-300">
          {formatRemaining(lock.remainingMs)}
        </span>
        <span className="text-[0.65rem] text-stone-500">until reveal</span>
      </div>
    </div>
  );
}

function RawEntryView({ entry }: { entry: ProtectedRawEntry }) {
  const [tick, setTick] = useState(0);

  // Prefer the registered lock (created when the entry was saved); fall back to
  // a computed lock from the entry's own createdAt for display-only contexts.
  const registered = getLockStatus(entry.entryId);

  // Recompute the lock each tick so the countdown stays live.
  useEffect(() => {
    const t = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(t);
  }, [entry.entryId]);

  const lock = useMemo(() => {
    if (registered) {
      return getReengagementLock(
        {
          entryId: registered.entryId,
          title: registered.title,
          createdAt: registered.createdAt,
          unlockAt: registered.unlockAt,
          reengagedAt: registered.reengagedAt,
        },
        Date.now()
      );
    }
    const createdAt = entry.createdAt ?? Date.now();
    return getReengagementLock(
      {
        entryId: entry.entryId,
        title: entry.title,
        createdAt,
        unlockAt: createdAt + REENGAGEMENT_LOCK_MS,
        reengagedAt: null,
      },
      Date.now()
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.entryId, tick]);

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-950/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-300">{entry.title}</span>
        {lock.isLocked ? (
          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-400">
            Protected · {REENGAGEMENT_LOCK_DAYS}-day lock
          </span>
        ) : (
          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-400">
            Available for review
          </span>
        )}
      </div>

      <div className="mt-3">
        {lock.isLocked ? (
          <LockedCard lock={lock} />
        ) : (
          <p className="max-h-40 overflow-y-auto rounded-lg border border-emerald-500/20 bg-stone-900/60 p-3 font-mono text-xs leading-relaxed text-stone-300">
            {entry.text}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Time-Delayed Re-engagement Engine
 *
 * Locks specific raw entries for exactly 7 days after creation, preventing the
 * user from obsessively re-reading or ruminating before initial emotional
 * processing has had time to settle. Raw text is hidden behind a live countdown
 * placeholder while locked, then revealed when ready.
 */
export function TimeDelayedReengagement({
  entries = [],
  showRegistry = true,
  tickMs = 1000,
  className = "",
}: TimeDelayedReengagementProps) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((x) => x + 1), tickMs);
    return () => window.clearInterval(t);
  }, [tickMs]);

  const registry = useMemo(
    () => listReengagement(Date.now()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick]
  );

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
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-400 border border-amber-500/30">
              Module 4 · Safety Engine
            </span>
            <span className="text-xs text-stone-500">7-Day Cool-Down Rule</span>
          </div>
          <h3 className="mt-1 text-base font-bold text-stone-100">
            Time-Delayed Re-engagement
          </h3>
        </div>
        <span className="rounded-md border border-stone-700 bg-stone-950/60 px-2 py-0.5 text-xs text-stone-400">
          {REENGAGEMENT_LOCK_DAYS}-day lock
        </span>
      </div>

      {/* Locked raw entries (protected review) */}
      {entries.length > 0 ? (
        <div className="mt-5 space-y-3">
          <p className="text-xs text-stone-400">
            Raw entries are held for {REENGAGEMENT_LOCK_DAYS} days before re-reading is
            permitted, giving initial emotional processing time to settle.
          </p>
          {entries.map((e) => (
            <RawEntryView key={e.entryId} entry={e} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-stone-800 bg-stone-950/40 p-4">
          <p className="text-xs text-stone-400">
            No completed raw entries yet. When you complete a writing session, that raw entry
            will be protected here for {REENGAGEMENT_LOCK_DAYS} days.
          </p>
        </div>
      )}

      {/* Registry of all protected entries */}
      {showRegistry && registry.length > 0 && (
        <div className="mt-6 border-t border-stone-800/80 pt-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-300">
            Protected Entries Registry
          </h4>
          <div className="mt-3 space-y-2">
            {registry.map((lock) => (
              <div
                key={lock.entryId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-800 bg-stone-950/40 px-3 py-2 text-xs"
              >
                <span className="font-semibold text-stone-300">
                  {lock.title}
                  <span className="ml-2 font-normal text-stone-500">
                    {new Date(lock.createdAt).toLocaleDateString()}
                  </span>
                </span>
                {lock.isLocked ? (
                  <span className="flex items-center gap-1.5 font-mono text-amber-300">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    locked · {formatRemaining(lock.remainingMs)} left
                  </span>
                ) : (
                  <button
                    onClick={() => markReengaged(lock.entryId)}
                    className="rounded-md bg-emerald-500 px-3 py-1 font-bold text-stone-950 hover:bg-emerald-400 transition"
                  >
                    Ready · Re-engage
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
