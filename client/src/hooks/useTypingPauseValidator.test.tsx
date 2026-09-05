import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTypingPauseValidator } from "./useTypingPauseValidator";

describe("useTypingPauseValidator (Continuous Motion)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("starts in the typing state with no idle time", () => {
    const { result } = renderHook(() =>
      useTypingPauseValidator({ now: () => Date.now() })
    );
    expect(result.current.state).toBe("typing");
    expect(result.current.isIdle).toBe(false);
    expect(result.current.idleMs).toBe(0);
    expect(result.current.nudgeCount).toBe(0);
  });

  it("enters idle-thresholding at 50% of the threshold", async () => {
    const { result } = renderHook(() =>
      useTypingPauseValidator({ thresholdMs: 4000, now: () => Date.now() })
    );
    await act(async () => {
      vi.advanceTimersByTime(1750);
    });
    expect(result.current.state).toBe("typing");
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current.state).toBe("idle-thresholding");
    expect(result.current.idleMs).toBe(2000);
    expect(result.current.isIdle).toBe(false);
  });

  it("raises idle past the threshold and fires onIdle exactly once", async () => {
    const onIdle = vi.fn();
    const { result } = renderHook(() =>
      useTypingPauseValidator({ thresholdMs: 5000, now: () => Date.now(), onIdle })
    );
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.isIdle).toBe(true);
    expect(result.current.state).toBe("idle");
    expect(result.current.nudgeCount).toBe(1);
    expect(onIdle).toHaveBeenCalledTimes(1);

    // Remaining idle does not fire again.
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onIdle).toHaveBeenCalledTimes(1);
    expect(result.current.nudgeCount).toBe(1);
  });

  it("notifyActivity resets the clock and allows re-crossing the threshold", async () => {
    const onIdle = vi.fn();
    const { result } = renderHook(() =>
      useTypingPauseValidator({ thresholdMs: 5000, now: () => Date.now(), onIdle })
    );
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(result.current.isIdle).toBe(true);

    await act(async () => {
      result.current.notifyActivity();
    });
    expect(result.current.isIdle).toBe(false);
    expect(result.current.state).toBe("typing");
    expect(result.current.idleMs).toBe(0);

    await act(async () => {
      vi.advanceTimersByTime(4999);
    });
    expect(onIdle).toHaveBeenCalledTimes(1);
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(onIdle).toHaveBeenCalledTimes(2);
  });

  it("reports residual idle time via onReport on idle ticks only", async () => {
    const onReport = vi.fn();
    renderHook(() =>
      useTypingPauseValidator({ thresholdMs: 1000, now: () => Date.now(), onReport })
    );
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    expect(onReport).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(750);
    });
    expect(onReport).toHaveBeenCalledWith(1000);
  });

  it("suppresses the idle state while suppressWhen returns true", async () => {
    const onIdle = vi.fn();
    const { result } = renderHook(() =>
      useTypingPauseValidator({
        thresholdMs: 1000,
        now: () => Date.now(),
        onIdle,
        suppressWhen: () => true,
      })
    );
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.isIdle).toBe(false);
    expect(result.current.state).toBe("typing");
    expect(onIdle).not.toHaveBeenCalled();
  });

  it("reset clears the idle state, idle time and nudge count", async () => {
    const { result } = renderHook(() =>
      useTypingPauseValidator({ thresholdMs: 1000, now: () => Date.now() })
    );
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.isIdle).toBe(true);
    expect(result.current.nudgeCount).toBe(1);

    await act(async () => {
      result.current.reset();
    });
    expect(result.current.isIdle).toBe(false);
    expect(result.current.state).toBe("typing");
    expect(result.current.idleMs).toBe(0);
    expect(result.current.nudgeCount).toBe(0);
  });

  it("clears its interval on unmount", () => {
    const { unmount } = renderHook(() =>
      useTypingPauseValidator({ now: () => Date.now() })
    );
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});