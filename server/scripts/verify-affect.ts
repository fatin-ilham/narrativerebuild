// Verification harness for the Pre/Post Affect Slider module logic.
// Shims localStorage so the pure affect.ts module runs under Node.
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => void store.clear(),
  key: () => null,
  length: 0,
};

const A = await import("../../client/src/lib/affect.ts");

let failures = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? "PASS" : "FAIL"}: ${name}`);
  if (!cond) failures++;
}

// 1. Fresh record begins in pre phase.
const r0 = A.makeAffectRecord("s1", { day: 1, title: "Day 1" });
check("record starts in pre phase", r0.phase === "pre");
check("record starts with no pre score", r0.pre === null);

// 2. Submit pre-scales.
const afterPre = A.submitPre("s1", { mood: 30, stress: 80, arousal: 90 });
check("pre score stored", afterPre.pre?.mood === 30 && afterPre.pre?.stress === 80);
check("sessionStartedAt set", afterPre.sessionStartedAt !== null);

// 3. Schedule post (default 15 min). Not ready immediately.
const scheduled = A.schedulePost("s1");
check("phase becomes pending-post", scheduled.phase === "pending-post");
check("post not ready yet", A.isPostReady(scheduled) === false);

// 4. Simulate elapsed time (rewrite postReadyAt into the past), verify ready.
const rec = { ...scheduled, postReadyAt: Date.now() - 1000 };
check("post ready after delay elapses", A.isPostReady(rec) === true);

// 5. Submit post-scales.
const afterPost = A.submitPost("s1", { mood: 60, stress: 40, arousal: 45 });
check("post score stored", afterPost.post?.mood === 60 && afterPost.phase === "complete");

// 6. Shift computation.
const shift = A.computeShift(afterPost)!;
check("mood shift +30", shift.mood === 30);
check("stress shift -40", shift.stress === -40);
check("arousal shift -45", shift.arousal === -45);

// 7. Second completed session for averaging.
A.submitPre("s2", { mood: 20, stress: 90, arousal: 95 });
A.schedulePost("s2", 0);
A.submitPost("s2", { mood: 50, stress: 60, arousal: 50 });

const state = A.loadAffectState();
const done = A.listCompletedAffect(state);
check("two completed sessions listed", done.length === 2);
const avg = A.averageShift(done);
check("average mood shift +30", avg?.mood === 30);
check("average stress shift -35", avg?.stress === -35);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
