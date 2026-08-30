import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Continuous Motion Typing Validator
 *
 * A real-time keystroke monitor that watches for pauses in typing. If the user
 * stops typing for longer than `thresholdMs` (default 5s), it raises an `idle`
 * flag so the UI can emit a soft, non-blocking nudge (e.g. a pulse / color
 * shift on the text area). It never blocks input, never clears content, and
 * never penalises the user — the free-flow nature of expressive writing is
 * preserved. Pauses are reported upstream via a callback (optionally over
 * Socket.io) so the backend can reason about the writing flow.
 */

export interface TypingPauseValidatorOptions {
  /** Idle threshold in milliseconds. Default 5_000 (5 seconds). */
  thresholdMs?: number;
  /** Optional callback fired exactly once when the user crosses the idle threshold. */
  onIdle?: () => void;
  /** Optional callback for continuously reporting residual idle time (ms) since last keystroke. */
  onReport?: (idleMs: number) => void;
  /** Optional pausable time source, mostly useful for tests. */
  now?: () => number;
  /**
   * Optional escape hatch: when the user is deliberately reflecting (paused)
   * this can be true to suppress the nudge (a "breathing room" affordance).
   */
  suppressWhen?: () => boolean;
}

export type PauseValidatorState =
  | "typing"
  | "idle-thresholding"
  | "idle";

export interface TypingPauseValidatorApi {
  /** Attach to the text area's onKeyDown / onKeyUp / onPaste etc. */
  notifyActivity: () => void;
  /** Rich report generated each interval while idle beyond threshold. */
  state: PauseValidatorState;
  /** Milliseconds since the last detected keystroke. */
  idleMs: number;
  /** True once the idle threshold has been exceeded (drives the nudge). */
  isIdle: boolean;
  /** Total number of idle nudges emitted during this session. */
  nudgeCount: number;
  /** Manually reset the pause clock. */
  reset: () => void;
}

export function useTypingPauseValidator(
  options: TypingPauseValidatorOptions = {}
): TypingPauseValidatorApi {
  const {
    thresholdMs = 5_000,
    onIdle,
    onReport,
    now = () => Date.now(),
    suppressWhen = () => false,
  } = options;

  const lastActivityRef = useRef<number>(now());
  const stateRef = useRef<PauseValidatorState>("typing");
  const suppressedRef = useRef<boolean>(false);
  const idleFiredRef = useRef<boolean>(false);
  const nudgeCountRef = useRef<number>(0);

  const [state, setState] = useState<PauseValidatorState>("typing");
  const [idleMs, setIdleMs] = useState<number>(0);
  const [, setTick] = useState<number>(0);

  const optionsRef = useRef({ onIdle, onReport });
  optionsRef.current = { onIdle, onReport };

  const notifyActivity = useCallback(() => {
    lastActivityRef.current = now();
    if (stateRef.current !== "typing") {
      stateRef.current = "typing";
      setState("typing");
    }
    idleFiredRef.current = false;
    suppressedRef.current = suppressWhen();
  }, [now, suppressWhen]);

  const reset = useCallback(() => {
    lastActivityRef.current = now();
    idleFiredRef.current = false;
    nudgeCountRef.current = 0;
    stateRef.current = "typing";
    setState("typing");
    setIdleMs(0);
  }, [now]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const elapsed = now() - lastActivityRef.current;

      if (suppressedRef.current) {
        if (stateRef.current !== "typing") {
          stateRef.current = "typing";
          setState("typing");
        }
        idleFiredRef.current = false;
        setIdleMs(0);
        return;
      }

      if (elapsed >= thresholdMs) {
        if (stateRef.current !== "idle") {
          stateRef.current = "idle";
          setState("idle");
        }
        if (!idleFiredRef.current) {
          idleFiredRef.current = true;
          nudgeCountRef.current += 1;
          setTick((t) => t + 1);
          optionsRef.current.onIdle?.();
        }
        optionsRef.current.onReport?.(elapsed);
      } else if (elapsed >= thresholdMs * 0.5) {
        // Approaching the threshold — softly visible so the user senses the
        // boundary coming up, still completely uninvasive.
        if (stateRef.current === "typing") {
          stateRef.current = "idle-thresholding";
          setState("idle-thresholding");
        }
        setIdleMs(elapsed);
      } else {
        if (stateRef.current !== "typing") {
          stateRef.current = "typing";
          setState("typing");
        }
        setIdleMs(elapsed);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [thresholdMs, now]);

  // When suppression is engaged from the start, keep the clock running so the
  // moment suppression is released the correct residual idle time is used.
  useEffect(() => {
    suppressedRef.current = suppressWhen();
  }, [suppressWhen]);

  return {
    notifyActivity,
    state,
    idleMs,
    isIdle: state === "idle",
    nudgeCount: nudgeCountRef.current,
    reset,
  };
}

// Browser-level defaults for the wrapper below.
export type ContinuousMotionProps = {
  thresholdSec?: number;
  socket?: { emit: (event: string, payload: unknown) => void } | null;
};
