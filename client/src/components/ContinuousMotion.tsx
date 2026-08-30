import React, { useCallback, useRef } from "react";
import { useTypingPauseValidator } from "../hooks/useTypingPauseValidator";
import type { PauseValidatorState } from "../hooks/useTypingPauseValidator";
import { socket } from "../lib/socket";

export interface ContinuousMotionProps {
  /** The writing entry / session id to report pause metrics against. */
  sessionId?: string;
  /** Idle threshold in seconds. Default 5. */
  thresholdSec?: number;
  /** Current raw text (controlled or uncontrolled). */
  value?: string;
  defaultValue?: string;
  /** Called with the latest text on every keystroke. */
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Emit pause lifecycle events over Socket.io. Default true. */
  liveReport?: boolean;
}

const STATE_META: Record<
  PauseValidatorState,
  { ring: string; glow: string; label: string }
> = {
  typing: {
    ring: "ring-1 ring-emerald-500/40",
    glow: "shadow-[0_0_0_0_rgba(16,185,129,0)]",
    label: "",
  },
  "idle-thresholding": {
    ring: "ring-1 ring-amber-400/60",
    glow: "shadow-[0_0_0_0_rgba(251,191,36,0)]",
    label: "keep the words flowing…",
  },
  idle: {
    ring: "",
    glow: "",
    label: "",
  },
};

/**
 * ContinuousMotion
 *
 * A locking, distraction-free writing surface that silently observes typing
 * cadence and produces a gentle, non-blocking pulse whenever the pen has gone
 * quiet for more than `thresholdSec`. The pulse is purely visual prompting —
 * it never interrupts focus, never discards text, and there is no penalty for
 * pausing. It is a nudge, not a gate.
 */
export function ContinuousMotion({
  sessionId,
  thresholdSec = 5,
  value,
  defaultValue = "",
  onChange,
  placeholder = "Begin writing here…",
  className = "",
  disabled = false,
  liveReport = true,
}: ContinuousMotionProps) {
  const onIdle = useCallback(() => {
    if (liveReport && sessionId) {
      socket?.emit("typing:pause", {
        sessionId,
        event: "idle",
        seconds: thresholdSec,
        at: Date.now(),
      });
    }
  }, [liveReport, sessionId, thresholdSec]);

  const onReport = useCallback(
    (idleMs: number) => {
      if (liveReport && sessionId) {
        socket?.emit("typing:pulse", {
          sessionId,
          idleMs,
          at: Date.now(),
        });
      }
    },
    [liveReport, sessionId]
  );

  const validator = useTypingPauseValidator({
    thresholdMs: thresholdSec * 1000,
    onIdle,
    onReport,
  });

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      onChange?.(next);
      validator.notifyActivity();
    },
    [onChange, validator]
  );

  const handlePotentialActivity = useCallback(() => {
    validator.notifyActivity();
  }, [validator]);

  const state = validator.state;
  const isIdle = validator.isIdle;
  const meta = STATE_META[state];

  return (
    <div
      className={
        "relative transition-all duration-500 ease-out " + meta.ring + " " + meta.glow +
        (isIdle ? " motion-pulse " : "") +
        " rounded-2xl bg-white/5 backdrop-blur"
      }
      style={{
        animation: isIdle ? "motionPulse 2.6s ease-in-out infinite" : undefined,
      }}
    >
      <textarea
        ref={textareaRef}
        value={value !== undefined ? value : undefined}
        defaultValue={value !== undefined ? undefined : defaultValue}
        onChange={handleChange}        onKeyDown={handlePotentialActivity}
        onKeyUp={handlePotentialActivity}
        onPaste={handlePotentialActivity}
        onCut={handlePotentialActivity}
        onFocus={handlePotentialActivity}
        onBlur={handlePotentialActivity}
        placeholder={placeholder}
        disabled={disabled}
        spellCheck={false}
        className={
          "w-full min-h-[260px] resize-none rounded-2xl border-0 bg-transparent p-6 " +
          "text-[1.15rem] leading-[1.9] text-stone-100 caret-emerald-400 " +
          "placeholder:text-stone-500 focus:outline-none focus:ring-0 " +
          (disabled ? "cursor-not-allowed opacity-60 " : "") + className
        }
      />
      <div className="pointer-events-none absolute bottom-3 right-4 flex items-center gap-2 text-[0.7rem] tracking-widest uppercase text-stone-500 transition-opacity duration-300">
        <span
          className={
            "h-2 w-2 rounded-full transition-colors duration-300 " +
            (isIdle
              ? "bg-amber-400 animate-pulse"
              : state === "idle-thresholding"
              ? "bg-amber-400/60"
              : "bg-emerald-500/70")
          }
        />
        <span className="opacity-80">{meta.label || "continuous motion"}</span>
      </div>

      <style>{`
        @keyframes motionPulse {
          0%   { box-shadow: 0 0 0 0 rgba(245,158,11,0.00); border-color: rgba(245,158,11,0.1); }
          50%  { box-shadow: 0 0 0 8px rgba(245,158,11,0.06); border-color: rgba(245,158,11,0.45); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.00); border-color: rgba(245,158,11,0.1); }
        }
      `}</style>
    </div>
  );
}
