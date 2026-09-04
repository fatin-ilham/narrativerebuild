import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatRemaining,
  getLockStatus,
  getReengagementLock,
  isEntryLocked,
  listReengagement,
  lockEntry,
  markReengaged,
  REENGAGEMENT_LOCK_DAYS,
  REENGAGEMENT_LOCK_MS,
} from "./reengagement";

describe("Time-Delayed Re-engagement Engine (reengagement.ts)", () => {
  const T0 = new Date("2026-09-04T10:00:00.000Z").getTime();
  const HOUR_MS = 60 * 60 * 1000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("REENGAGEMENT_LOCK_MS is exactly 7 days", () => {
    expect(REENGAGEMENT_LOCK_DAYS).toBe(7);
    expect(REENGAGEMENT_LOCK_MS).toBe(REENGAGEMENT_LOCK_DAYS * 24 * HOUR_MS);
  });

  it("lockEntry creates the lock with unlockAt = createdAt + 7 days", () => {
    const entry = lockEntry("day-1", { title: "Day 1 Raw Entry", createdAt: T0 });
    expect(entry.entryId).toBe("day-1");
    expect(entry.title).toBe("Day 1 Raw Entry");
    expect(entry.unlockAt).toBe(T0 + REENGAGEMENT_LOCK_MS);
    expect(getLockStatus("day-1")).not.toBeNull();
  });

  it("entry stays locked through the window and unlocks at expiry", () => {
    lockEntry("day-1", { title: "Day 1", createdAt: T0 });
    vi.setSystemTime(T0 + REENGAGEMENT_LOCK_MS - 1);
    expect(isEntryLocked("day-1")).toBe(true);
    vi.setSystemTime(T0 + 1000);
    expect(isEntryLocked("day-1")).toBe(true);
    vi.setSystemTime(T0 + REENGAGEMENT_LOCK_MS);
    expect(isEntryLocked("day-1")).toBe(false);
  });

  it("reports a shrinking live countdown then a ready status", () => {
    const entry = lockEntry("day-1", { title: "Day 1", createdAt: T0 });
    const mid = getReengagementLock(entry, T0 + REENGAGEMENT_LOCK_MS / 2);
    expect(mid.isLocked).toBe(true);
    expect(mid.status).toBe("locked");
    expect(mid.remainingMs).toBe(REENGAGEMENT_LOCK_MS / 2);
    expect(mid.remainingSec).toBe(Math.ceil((REENGAGEMENT_LOCK_MS / 2) / 1000));

    const ready = getReengagementLock(entry, T0 + REENGAGEMENT_LOCK_MS);
    expect(ready.isLocked).toBe(false);
    expect(ready.status).toBe("ready");
    expect(ready.remainingMs).toBe(0);
  });

  it("getLockStatus returns null for unknown entries", () => {
    expect(getLockStatus("missing")).toBeNull();
  });

  it("lockEntry is idempotent and keeps the earliest createdAt", () => {
    lockEntry("day-1", { title: "Day 1", createdAt: T0 });
    const relocked = lockEntry("day-1", { title: "Renamed", createdAt: T0 - 5000 });
    expect(relocked.createdAt).toBe(T0 - 5000);
    expect(relocked.unlockAt).toBe(T0 - 5000 + REENGAGEMENT_LOCK_MS);
    expect(relocked.title).toBe("Renamed");
  });

  it("listReengagement sorts entries newest first", () => {
    lockEntry("older", { title: "Older", createdAt: T0 });
    vi.setSystemTime(T0 + 60_000);
    lockEntry("newer", { title: "Newer", createdAt: T0 + 60_000 });
    const list = listReengagement();
    expect(list.map((l) => l.entryId)).toEqual(["newer", "older"]);
  });

  it("markReengaged records the timestamp on existing entries only", () => {
    lockEntry("done", { title: "Done", createdAt: T0 - REENGAGEMENT_LOCK_MS });
    const marked = markReengaged("done");
    expect(marked?.reengagedAt).toBe(T0);
    expect(markReengaged("missing")).toBeNull();
  });

  it("formatRemaining renders a countdown and the ready state", () => {
    expect(formatRemaining(REENGAGEMENT_LOCK_MS)).toBe("7d 00h 00m");
    expect(formatRemaining(0)).toBe("available now");
    expect(
      formatRemaining(3 * 24 * HOUR_MS + 4 * HOUR_MS + 5 * 60_000)
    ).toBe("3d 04h 05m");
  });
});