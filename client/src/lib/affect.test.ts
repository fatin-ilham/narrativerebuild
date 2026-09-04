import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  averageShift,
  computeShift,
  emptyScore,
  isPostReady,
  listCompletedAffect,
  loadAffectState,
  makeAffectRecord,
  schedulePost,
  secondsUntilPostReady,
  submitPost,
  submitPre,
  POST_SESSION_DELAY_MS,
} from "./affect";

describe("Pre/Post Affect Sliders (affect.ts)", () => {
  const T0 = new Date("2026-09-04T10:00:00.000Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a fresh pre-phase record with no scores", () => {
    const r = makeAffectRecord("s1", { day: 1, title: "Day 1" });
    expect(r.phase).toBe("pre");
    expect(r.pre).toBeNull();
    expect(r.post).toBeNull();
    expect(r.day).toBe(1);
    expect(r.title).toBe("Day 1");
    expect(r.createdAt).toBe(T0);
  });

  it("emptyScore returns a detached default each call", () => {
    const a = emptyScore();
    const b = emptyScore();
    a.mood = 0;
    expect(b).toEqual({ mood: 50, stress: 50, arousal: 50 });
  });

  it("submitPre stores scores and timestamps session start", () => {
    const rec = submitPre("s1", { mood: 30, stress: 80, arousal: 90 });
    expect(rec.pre).toEqual({ mood: 30, stress: 80, arousal: 90 });
    expect(rec.preCompletedAt).toBe(T0);
    expect(rec.sessionStartedAt).toBe(T0);
  });

  it("schedulePost advances phase and schedules +15 minutes by default", () => {
    submitPre("s1", { mood: 30, stress: 80, arousal: 90 });
    const rec = schedulePost("s1");
    expect(rec.phase).toBe("pending-post");
    expect(rec.postReadyAt).toBe(T0 + POST_SESSION_DELAY_MS);
    expect(isPostReady(rec)).toBe(false);
  });

  it("post scales become ready once the delay has elapsed", () => {
    submitPre("s1", { mood: 1, stress: 1, arousal: 1 });
    const rec = schedulePost("s1", 1000);
    vi.setSystemTime(T0 + 999);
    expect(isPostReady(rec)).toBe(false);
    expect(secondsUntilPostReady(rec)).toBe(1);
    vi.setSystemTime(T0 + 1000);
    expect(isPostReady(rec)).toBe(true);
    expect(secondsUntilPostReady(rec)).toBe(0);
  });

  it("a completed session is not flagged post-ready again", () => {
    submitPre("s1", { mood: 1, stress: 1, arousal: 1 });
    const rec = schedulePost("s1", 0);
    vi.setSystemTime(T0 + 1);
    expect(isPostReady(rec)).toBe(true);
    const done = submitPost("s1", { mood: 60, stress: 40, arousal: 45 });
    expect(isPostReady(done)).toBe(false);
  });

  it("submitPost completes the record and stores post scores", () => {
    submitPre("s1", { mood: 30, stress: 80, arousal: 90 });
    schedulePost("s1", 0);
    const rec = submitPost("s1", { mood: 60, stress: 40, arousal: 45 });
    expect(rec.phase).toBe("complete");
    expect(rec.post).toEqual({ mood: 60, stress: 40, arousal: 45 });
  });

  it("computeShift measures post - pre and stays null while incomplete", () => {
    expect(computeShift(makeAffectRecord("x"))).toBeNull();
    const pre = submitPre("s1", { mood: 30, stress: 80, arousal: 90 });
    expect(computeShift(pre)).toBeNull();
    schedulePost("s1", 0);
    const rec = submitPost("s1", { mood: 60, stress: 40, arousal: 45 });
    expect(computeShift(rec)).toEqual({ mood: 30, stress: -40, arousal: -45 });
  });

  it("persists records across module-instance boundaries (localStorage)", () => {
    submitPre("s1", { mood: 30, stress: 80, arousal: 90 });
    schedulePost("s1", 0);
    submitPost("s1", { mood: 60, stress: 40, arousal: 45 });
    const persisted = loadAffectState();
    expect(Object.keys(persisted)).toContain("s1");
    expect(persisted["s1"].phase).toBe("complete");
  });

  it("listCompletedAffect lists only complete records, ordered by creation time", () => {
    // Insert the sessions in reverse chronological order to prove sorting.
    vi.setSystemTime(T0 + 1000);
    submitPre("first-completed", { mood: 20, stress: 90, arousal: 95 });
    schedulePost("first-completed", 0);
    submitPost("first-completed", { mood: 50, stress: 60, arousal: 50 });

    vi.setSystemTime(T0);
    submitPre("earlier-but-later-id", { mood: 10, stress: 70, arousal: 60 });
    schedulePost("earlier-but-later-id", 0);
    submitPost("earlier-but-later-id", { mood: 40, stress: 40, arousal: 30 });

    vi.setSystemTime(T0 + 2000);
    submitPre("incomplete", { mood: 1, stress: 1, arousal: 1 });

    const done = listCompletedAffect(loadAffectState());
    expect(done.map((e) => e.record.sessionId)).toEqual([
      "earlier-but-later-id",
      "first-completed",
    ]);
    for (const e of done) {
      expect(e.shift.mood).not.toBeNaN();
    }
  });

  it("averageShift averages shifts with 0.1 rounding", () => {
    vi.setSystemTime(T0);
    submitPre("s1", { mood: 30, stress: 80, arousal: 90 });
    schedulePost("s1", 0);
    submitPost("s1", { mood: 60, stress: 40, arousal: 45 }); // +30, -40, -45

    vi.setSystemTime(T0 + 1000);
    submitPre("s2", { mood: 20, stress: 90, arousal: 95 });
    schedulePost("s2", 0);
    submitPost("s2", { mood: 50, stress: 60, arousal: 50 }); // +30, -30, -45

    const completed = listCompletedAffect(loadAffectState());
    const avg = averageShift(completed);
    expect(avg).toEqual({ mood: 30, stress: -35, arousal: -45 });
  });

  it("averageShift returns null with no completed sessions", () => {
    expect(averageShift([])).toBeNull();
  });
});