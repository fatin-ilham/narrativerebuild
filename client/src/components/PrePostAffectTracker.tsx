import { useEffect, useMemo, useState } from "react";
import {
  POST_SESSION_DELAY_MS,
  averageShift,
  computeShift,
  emptyScore,
  isPostReady,
  listCompletedAffect,
  loadAffectState,
  makeAffectRecord,
  saveAffectRecord,
  secondsUntilPostReady,
  submitPost,
  submitPre,
  type AffectRecord,
  type AffectScore,
} from "../lib/affect";
import { AffectSlider } from "./AffectSlider";

export interface PrePostAffectTrackerProps {
  sessionId: string;
  day?: number;
  title?: string;
  /** Time until the post session becomes available. Default 15 min. */
  postDelayMs?: number;
  /** Show the longitudinal (across-sessions) shift history. Default true. */
  showHistory?: boolean;
  /**
   * Whether a writing session is currently being driven elsewhere (e.g. the
   * locked Pennebaker modal) after pre-scales have been submitted. Drives the
   * "in session" state.
   */
  sessionInProgress?: boolean;
  /** Called once pre-scales are submitted. */
  onPreComplete?: (record: AffectRecord) => void;
  /** Called when the writing session ends (to schedule the +15 min post). */
  onSessionEnd?: (record: AffectRecord) => void;
  /** Called once post-scales are submitted. */
  onPostComplete?: (record: AffectRecord) => void;
  className?: string;
}

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Pre/Post Writing Subjective Affect Sliders
 *
 * A short set of mood & stress scales completed immediately before and
 * 15 minutes after a writing session. Both scores are stored against the
 * session so short-term emotional shifts (Δ post − pre) can be measured and
 * shown back to the user over time.
 */
export function PrePostAffectTracker({
  sessionId,
  day,
  title = "Expressive Writing Session",
  postDelayMs = POST_SESSION_DELAY_MS,
  showHistory = true,
  sessionInProgress = false,
  onPreComplete,
  onSessionEnd,
  onPostComplete,
  className = "",
}: PrePostAffectTrackerProps) {
  const [record, setRecord] = useState<AffectRecord>(() => {
    const state = loadAffectState();
    return state[sessionId] ?? makeAffectRecord(sessionId, { day, title });
  });
  const [draft, setDraft] = useState<AffectScore>(emptyScore);
  const [tick, setTick] = useState<number>(0);

  // Persist the record whenever it changes (and keep local state in sync).
  useEffect(() => {
    const existing = loadAffectState()[sessionId];
    if (!existing || existing !== record) {
      saveAffectRecord(record);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record, sessionId]);

  // When the sessionId changes (a new writing session begins), reload the
  // record for the newly selected session so the tracker doesn't show the
  // previous session's data.
  useEffect(() => {
    setRecord(
      loadAffectState()[sessionId] ?? makeAffectRecord(sessionId, { day, title })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // One-second ticker to drive the +15 min countdown.
  useEffect(() => {
    const t = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const ready = isPostReady(record);
  const untilReady = secondsUntilPostReady(record);

  const handleSubmitPre = () => {
    const updated = submitPre(sessionId, draft);
    setRecord(updated);
    onPreComplete?.(updated);
  };

  const handleAdvancePost = () => {
    const updated = schedulePostRecord();
    onSessionEnd?.(updated);
  };

  const schedulePostRecord = (): AffectRecord => {
    const state = loadAffectState();
    const r = state[sessionId] ?? record;
    const updated: AffectRecord = {
      ...r,
      sessionEndedAt: Date.now(),
      postReadyAt: Date.now() + postDelayMs,
      phase: "pending-post",
    };
    saveAffectRecord(updated);
    setRecord(updated);
    return updated;
  };

  const handleSubmitPost = () => {
    const updated = submitPost(sessionId, draft);
    setRecord(updated);
    onPostComplete?.(updated);
  };

  // Longitudinal history across all completed sessions.
  const history = useMemo(() => {
    if (!showHistory) return { entries: [], average: null as ReturnType<typeof averageShift> };
    const entries = listCompletedAffect(loadAffectState());
    const present = entries.filter((e) => e.record.sessionId === sessionId);
    return { entries, average: averageShift(present.length ? present : entries) };
  }, [showHistory, record, tick]);

  const shift = record.pre && record.post ? computeShift(record) : null;
  const isPreDone = record.pre !== null;
  const showPreForm = !isPreDone;
  const inSession = isPreDone && record.sessionEndedAt === null;
  const awaitingPost =
    record.phase === "pending-post" && record.post === null;
  const showPostForm = awaitingPost && ready;
  const awaitingCountdown = awaitingPost && !ready;

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
            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-rose-400 border border-rose-500/30">
              Module 4 · Subjective Affect
            </span>
            <span className="text-xs text-stone-500">Pre / Post Writing Scales</span>
          </div>
          <h3 className="mt-1 text-base font-bold text-stone-100">
            Pre/Post Affect Tracker
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-md border border-stone-700 bg-stone-950/60 px-2 py-0.5 capitalize text-stone-400">
            phase: {record.phase.replace("-", " ")}
          </span>
        </div>
      </div>

      {/* ===== PRE-SESSION STATE ===== */}
      {showPreForm && (
        <div className="mt-5">
          <p className="text-sm text-stone-300">
            Before you begin writing, rate how you feel <span className="font-semibold text-rose-300">right now</span>.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <AffectSlider
              label="Mood"
              lowLabel="Very low"
              highLabel="Very positive"
              value={draft.mood}
              accent="sky"
              onChange={(v) => setDraft((d) => ({ ...d, mood: v }))}
            />
            <AffectSlider
              label="Stress"
              lowLabel="Completely calm"
              highLabel="Extremely stressed"
              value={draft.stress}
              accent="rose"
              onChange={(v) => setDraft((d) => ({ ...d, stress: v }))}
            />
            <AffectSlider
              label="Emotional intensity"
              lowLabel="Flat / calm"
              highLabel="Overwhelming"
              value={draft.arousal}
              accent="amber"
              onChange={(v) => setDraft((d) => ({ ...d, arousal: v }))}
            />
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSubmitPre}
              className="rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-bold text-stone-950 shadow-lg shadow-rose-500/20 hover:bg-rose-400 transition"
            >
              Record Pre-Session Affect & Begin
            </button>
          </div>
        </div>
      )}

      {/* ===== IN-SESSION / PRE-LOGGED ===== */}
      {inSession && (
        <div className="mt-5">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">
                Pre-session affect recorded
              </p>
              <p className="text-xs text-stone-400">
                {sessionInProgress
                  ? "Your writing session is in progress. Post-session scales will be available 15 minutes after you finish."
                  : "End the writing session to schedule the +15 minute post-session scales."}
              </p>
            </div>
          </div>
          {!sessionInProgress && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAdvancePost}
                className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-6 py-2.5 text-sm font-bold text-rose-300 hover:bg-rose-500/20 transition"
              >
                End Writing Session
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== AWAITING +15 MIN COUNTDOWN ===== */}
      {awaitingCountdown && (
        <div className="mt-5">
          <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div>
              <p className="text-sm font-semibold text-amber-300">
                Post-session scales will be ready in
              </p>
              <p className="text-xs text-stone-400">
                Short-term emotional shifts are best measured 15 minutes after writing.
              </p>
            </div>
            <span className="font-mono text-2xl font-bold tabular-nums text-amber-400">
              {formatCountdown(untilReady)}
            </span>
          </div>
        </div>
      )}

      {/* ===== POST-SESSION READY ===== */}
      {showPostForm && (
        <div className="mt-5">
          <p className="text-sm text-stone-300">
            It has been a moment since you wrote. Rate how you feel{" "}
            <span className="font-semibold text-emerald-300">now</span>.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <AffectSlider
              label="Mood"
              lowLabel="Very low"
              highLabel="Very positive"
              value={draft.mood}
              accent="sky"
              onChange={(v) => setDraft((d) => ({ ...d, mood: v }))}
            />
            <AffectSlider
              label="Stress"
              lowLabel="Completely calm"
              highLabel="Extremely stressed"
              value={draft.stress}
              accent="rose"
              onChange={(v) => setDraft((d) => ({ ...d, stress: v }))}
            />
            <AffectSlider
              label="Emotional intensity"
              lowLabel="Flat / calm"
              highLabel="Overwhelming"
              value={draft.arousal}
              accent="amber"
              onChange={(v) => setDraft((d) => ({ ...d, arousal: v }))}
            />
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSubmitPost}
              className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-stone-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
            >
              Record Post-Session Affect
            </button>
          </div>
        </div>
      )}

      {/* ===== COMPLETED SHIFT (this session) ===== */}
      {record.phase === "complete" && record.pre && record.post && shift && (
        <div className="mt-5">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Short-Term Emotional Shift
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {(
                [
                  ["Mood", shift.mood],
                  ["Stress", shift.stress],
                  ["Intensity", shift.arousal],
                ] as const
              ).map(([label, delta]) => (
                <div key={label} className="rounded-lg border border-stone-800 bg-stone-950/60 p-3 text-center">
                  <span className="text-[0.65rem] uppercase tracking-wider text-stone-500">{label}</span>
                  <div
                    className={
                      "mt-1 text-xl font-bold " +
                      (delta > 0
                        ? "text-emerald-400"
                        : delta < 0
                        ? "text-rose-400"
                        : "text-stone-400")
                    }
                  >
                    {delta > 0 ? "+" : ""}
                    {delta}
                  </div>
                  <span className="text-[0.6rem] text-stone-500">post−pre</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== LONGITUDINAL HISTORY ===== */}
      {showHistory && (
        <div className="mt-6 border-t border-stone-800/80 pt-5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              Affect Shift Over Sessions
            </h4>
            {history.average && (
              <span className="text-[0.7rem] text-stone-500">
                avg mood Δ: {history.average.mood > 0 ? "+" : ""}
                {history.average.mood} · avg stress Δ:{" "}
                {history.average.stress > 0 ? "+" : ""}
                {history.average.stress}
              </span>
            )}
          </div>

          {history.entries.length > 0 ? (
            <div className="mt-3 space-y-2">
              {history.entries.slice(-10).map(({ record: r, shift: s }) => (
                <div
                  key={r.sessionId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-800 bg-stone-950/40 px-3 py-2 text-xs"
                >
                  <span className="font-semibold text-stone-300">
                    {new Date(r.createdAt).toLocaleDateString()}{" "}
                    {new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div className="flex items-center gap-3 text-stone-400">
                    <span>
                      Mood{" "}
                      <b className={s.mood >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {s.mood > 0 ? "+" : ""}
                        {s.mood}
                      </b>
                    </span>
                    <span>
                      Stress{" "}
                      <b className={s.stress <= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {s.stress > 0 ? "+" : ""}
                        {s.stress}
                      </b>
                    </span>
                    <span>
                      Intensity{" "}
                      <b className={s.arousal >= 0 ? "text-amber-400" : "text-sky-400"}>
                        {s.arousal > 0 ? "+" : ""}
                        {s.arousal}
                      </b>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs italic text-stone-600">
              No completed pre/post measurements yet. Complete a session to begin tracking shifts.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
