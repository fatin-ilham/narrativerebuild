import { useEffect, useRef, useState } from "react";
import { ContinuousMotion } from "./ContinuousMotion";
import { AmbientAtmosphereSelector } from "./AmbientAtmosphereSelector";
import type { NarrativeDayStage } from "../lib/narrativeProtocol";
import { SafeWordModal } from "./SafeWordModal";
import { SomatizationForm } from "./SomatizationForm";

export interface PennebakerStructuredInterfaceProps {
  sessionId?: string;
  stage?: NarrativeDayStage | null;
  initialText?: string;
  defaultDurationSec?: number; // default 1200 (20 min)
  onCompleteSession: (text: string, durationSec: number) => void;
  onExitSession: () => void;
  className?: string;
}

export function PennebakerStructuredInterface({
  sessionId = "pennebaker-session",
  stage,
  initialText = "",
  defaultDurationSec = 1200, // 20 minutes
  onCompleteSession,
  onExitSession,
  className = "",
}: PennebakerStructuredInterfaceProps) {
  const [durationSec, setDurationSec] = useState<number>(defaultDurationSec);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(defaultDurationSec);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [text, setText] = useState<string>(initialText);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [isSafeWordOpen, setIsSafeWordOpen] = useState<boolean>(false);
  const [sensations, setSensations] = useState<string[]>([]);

  // Prevent accidental navigation during active session
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActive && !isCompleted && text.length > 0) {
        e.preventDefault();
        e.returnValue = "A locked 20-minute writing session is currently in progress.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isActive, isCompleted, text]);

  // Session Countdown Timer
  useEffect(() => {
    if (isActive && !isCompleted) {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            window.clearInterval(timerRef.current!);
            setIsActive(false);
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isActive, isCompleted]);

  const handleStartSession = () => {
    setIsActive(true);
    setIsCompleted(false);
    setSecondsRemaining(durationSec);
    startTimeRef.current = Date.now();
  };

  const handleFinishEarly = () => {
    setIsActive(false);
    setIsCompleted(true);
    if (timerRef.current) window.clearInterval(timerRef.current);
  };

  const handleSaveAndComplete = () => {
    const totalElapsed = Math.max(1, durationSec - secondsRemaining);
    onCompleteSession(text, totalElapsed);
  };

  const handleExitRequest = () => {
    if (isActive && text.trim().length > 10) {
      setShowExitConfirm(true);
    } else {
      onExitSession();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent =
    durationSec > 0
      ? Math.round(((durationSec - secondsRemaining) / durationSec) * 100)
      : 0;

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div
      className={
        "fixed inset-0 z-50 flex flex-col bg-stone-950 text-stone-100 select-none overflow-y-auto " +
        className
      }
    >
      {/* LOCKED PROTOCOL TOP BAR: Distraction-free (navigation/menus hidden) */}
      <header className="flex items-center justify-between border-b border-stone-800/80 bg-stone-950/90 px-8 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-3 w-3 items-center justify-center">
            <span
              className={
                "h-2.5 w-2.5 rounded-full " +
                (isActive
                  ? "bg-rose-500 animate-ping"
                  : isCompleted
                  ? "bg-emerald-500"
                  : "bg-amber-400")
              }
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Pennebaker Protocol Workspace
              </span>
              {isActive && (
                <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-rose-400 border border-rose-500/30">
                  Locked Mode Active
                </span>
              )}
            </div>
            {stage && (
              <p className="text-xs text-stone-500">
                {stage.title} · {stage.focusAngle}
              </p>
            )}
          </div>
        </div>

        {/* Live Countdown & Controls */}
        <div className="flex items-center gap-4">
          <AmbientAtmosphereSelector compact={true} />

          {/* Countdown Clock Display */}
          <div className="flex items-center gap-2 rounded-xl border border-stone-800 bg-stone-900/90 px-4 py-2 shadow-inner">
            <svg
              className={"h-4 w-4 " + (isActive ? "text-emerald-400 animate-spin" : "text-stone-500")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <path strokeWidth={2} d="M12 6v6l4 2" />
            </svg>
            <span className="font-mono text-base font-bold tracking-widest text-emerald-400">
              {formatTime(secondsRemaining)}
            </span>
          </div>

          {/* Emergency Safe-Word Halt Button */}
          {isActive && (
            <button
              onClick={() => {
                setText(""); // Instant zero-retention text purge
                setIsActive(false);
                setIsSafeWordOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-rose-800/80 bg-rose-950/50 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/70 transition shadow-sm"
              title="Emergency halt session and wipe memory"
            >
              <span>🚨</span>
              <span>Safe-Word</span>
            </button>
          )}

          <button
            onClick={handleExitRequest}
            className="rounded-lg border border-stone-800 p-2 text-stone-500 hover:bg-stone-900 hover:text-stone-300"
            title="Exit locked session"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Progress Line */}
      <div className="h-1 w-full bg-stone-900">
        <div
          className="h-full bg-emerald-500 transition-all duration-1000"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* WORKSPACE BODY */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-8 py-8">
        {/* PRE-SESSION READY STATE */}
        {!isActive && !isCompleted && (
          <div className="my-auto rounded-2xl border border-stone-800/80 bg-stone-900/50 p-8 text-center backdrop-blur-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-stone-100">
              {stage ? stage.title : "Pennebaker Expressive Writing Session"}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone-400">
              During the 20-minute timed window, all formatting tools and external navigation are disabled.
              Write continuously in a free stream-of-consciousness style without worrying about grammar, spelling, or structure.
            </p>

            {stage && (
              <div className="mx-auto mt-6 max-w-lg rounded-xl border border-stone-800 bg-stone-950/70 p-4 text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Today's Guiding Angle:
                </span>
                <p className="mt-1 text-xs leading-relaxed text-stone-300">
                  {stage.description}
                </p>
              </div>
            )}

            {/* Session Duration Selector (standard 20 min default, with demo presets) */}
            <div className="mt-6 flex items-center justify-center gap-3 text-xs text-stone-400">
              <span>Session Duration:</span>
              <div className="flex rounded-lg border border-stone-800 bg-stone-950 p-1">
                {[
                  { label: "20 min (Protocol Standard)", sec: 1200 },
                  { label: "5 min (Quick)", sec: 300 },
                  { label: "1 min (Demo Test)", sec: 60 },
                ].map((opt) => (
                  <button
                    key={opt.sec}
                    onClick={() => {
                      setDurationSec(opt.sec);
                      setSecondsRemaining(opt.sec);
                    }}
                    className={
                      "rounded-md px-3 py-1 text-xs font-medium transition " +
                      (durationSec === opt.sec
                        ? "bg-emerald-500 text-stone-950 font-bold"
                        : "text-stone-400 hover:text-stone-200")
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={handleStartSession}
                className="rounded-xl bg-emerald-500 px-8 py-3.5 text-base font-bold text-stone-950 shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-400 hover:scale-105"
              >
                Lock Screen & Begin 20-Min Session
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE LOCKED WRITING CANVAS */}
        {isActive && (
          <div className="flex flex-1 flex-col">
            {stage && (
              <div className="mb-4 rounded-xl border border-stone-800/80 bg-stone-900/40 px-4 py-2.5 text-xs text-stone-400">
                <span className="font-semibold text-emerald-400">Prompt: </span>
                {stage.writingPrompts[0]}
              </div>
            )}

            <div className="flex-1">
              <ContinuousMotion
                sessionId={sessionId}
                value={text}
                onChange={setText}
                thresholdSec={5}
                placeholder="Let your thoughts flow freely. Don't censor, edit, or stop writing..."
                className="min-h-[420px] text-lg leading-relaxed"
              />
            </div>

            {/* Session Footer Info */}
            <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
              <div className="flex items-center gap-3">
                <span>{wordCount} words</span>
                <span>·</span>
                <span>{text.length} characters</span>
                <span>·</span>
                <span className="text-emerald-400/80">Formatting tools & navigation locked</span>
              </div>

              <button
                onClick={handleFinishEarly}
                className="text-stone-500 hover:text-stone-300 underline"
                title="Finish writing before countdown ends"
              >
                Conclude Writing Early
              </button>
            </div>
          </div>
        )}

        {/* POST-SESSION COMPLETED STATE */}
        {isCompleted && (
          <div className="my-auto rounded-2xl border border-emerald-500/40 bg-stone-900/70 p-8 text-center backdrop-blur-md shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-emerald-300">
              Pennebaker Session Complete
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-stone-300">
              You completed your expressive writing session. Your thoughts have been safely articulated and structured.
            </p>

            <div className="mx-auto mt-6 max-w-md grid grid-cols-2 gap-3 text-left">
              <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-3.5">
                <span className="text-[0.7rem] uppercase tracking-wider text-stone-500">
                  Total Words
                </span>
                <div className="mt-1 text-xl font-bold text-emerald-400">
                  {wordCount} words
                </div>
              </div>
              <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-3.5">
                <span className="text-[0.7rem] uppercase tracking-wider text-stone-500">
                  Time Elapsed
                </span>
                <div className="mt-1 text-xl font-bold text-stone-200">
                  {formatTime(durationSec - secondsRemaining)}
                </div>
              </div>
            </div>

            {/* Somatization Reflection Checklist */}
            <SomatizationForm
              selectedSensations={sensations}
              onChange={setSensations}
              className="mt-6 max-w-md mx-auto"
            />

            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={handleSaveAndComplete}
                className="rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-bold text-stone-950 shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition hover:scale-105"
              >
                Save & Proceed to Reflection & Analytics
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-w-md rounded-2xl border border-stone-800 bg-stone-900 p-6 text-stone-100 shadow-2xl">
            <h3 className="text-lg font-bold text-stone-100">
              Pause Writing Protocol?
            </h3>
            <p className="mt-2 text-sm text-stone-400">
              Dr. Pennebaker's protocol emphasizes continuous uninterrupted writing to achieve cognitive release. Leaving now will stop the timer.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-stone-950 hover:bg-emerald-400"
              >
                Keep Writing
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  onExitSession();
                }}
                className="rounded-lg border border-stone-700 bg-stone-800 px-4 py-2 text-xs text-stone-400 hover:text-stone-200"
              >
                Exit Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe-Word Emergency Halt Modal */}
      <SafeWordModal
        isOpen={isSafeWordOpen}
        onClose={() => {
          setIsSafeWordOpen(false);
          onExitSession();
        }}
      />
    </div>
  );
}
