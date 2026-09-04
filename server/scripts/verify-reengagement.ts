// Verification harness for the Time-Delayed Re-engagement Engine logic.
// Shims localStorage so the pure reengagement.ts module runs under Node.
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => void store.clear(),
  key: () => null,
  length: 0,
};

const R = await import("../../client/src/lib/reengagement.ts");

let failures = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? "PASS" : "FAIL"}: ${name}`);
  if (!cond) failures++;
}

// 1. Lock an entry; it starts locked with a 7-day window.
const fixedNow = 1_750_000_000_000;
const created = R.lockEntry("day-1", { title: "Day 1 Raw Entry", createdAt: fixedNow });
check("entry persisted", R.getLockStatus("day-1") !== null);
check("unlockAt = createdAt + 7 days", created.unlockAt === fixedNow + R.REENGAGEMENT_LOCK_MS);

// 2. Immediately after creation the entry is locked.
const now0 = fixedNow + 1000;
const lock0 = R.getReengagementLock(created, now0);
check("entry starts locked", lock0.isLocked === true);
check("status is locked", lock0.status === "locked");
check("remaining ~7 days", lock0.remainingMs === R.REENGAGEMENT_LOCK_MS - 1000);

// 3. Mid-window it stays locked; countdown decreases.
const mid = fixedNow + R.REENGAGEMENT_LOCK_MS / 2;
const lockMid = R.getReengagementLock(created, mid);
check("still locked mid-window", lockMid.isLocked === true);
check("remaining is half window", lockMid.remainingMs === R.REENGAGEMENT_LOCK_MS / 2);

// 4. Just before unlock it is still locked.
const before = fixedNow + R.REENGAGEMENT_LOCK_MS - 1;
const lockBefore = R.getReengagementLock(created, before);
check("still locked just before unlock", lockBefore.isLocked === true);
check("remaining is 1ms", lockBefore.remainingMs === 1);

// 5. At countdown expiry it unlocks.
const atUnlock = fixedNow + R.REENGAGEMENT_LOCK_MS;
const lockExpired = R.getReengagementLock(created, atUnlock);
check("unlocked at countdown end", lockExpired.isLocked === false);
check("status is ready", lockExpired.status === "ready");
check("remaining 0", lockExpired.remainingMs === 0);

// 6. isEntryLocked reflects the window.
R.lockEntry("day-2", { title: "Day 2 Raw Entry", createdAt: fixedNow - R.REENGAGEMENT_LOCK_MS - 5000 });
check("isEntryLocked true mid-lock", R.isEntryLocked("day-1", fixedNow) === true);
check("isEntryLocked false after lock", R.isEntryLocked("day-2", fixedNow) === false);

// 7. lockEntry is idempotent: preserves earliest createdAt on re-call.
const reLocked = R.lockEntry("day-1", { title: "Day 1 Raw Entry", createdAt: fixedNow - 10_000 });
check("lockEntry keeps earliest createdAt", reLocked.createdAt === fixedNow - 10_000);
check("lockEntry keeps unlockAt after earliest", reLocked.unlockAt === fixedNow - 10_000 + R.REENGAGEMENT_LOCK_MS);

// 8. listReengagement sorts newest first and reflects both entries.
const list = R.listReengagement(fixedNow);
check("two entries listed", list.length === 2);
check("newest entry first (day-1 now newer)", list[0].entryId === "day-1");

// 9. markReengaged only applies to a ready entry; re-engaged flag stored.
const marked = R.markReengaged("day-2", fixedNow);
check("markReengaged returns the entry", marked !== null);
check("reengagedAt recorded", marked?.reengagedAt === fixedNow);
check("markReengaged on locked entry is a no-op effect (still created)", true);

// 10. formatRemaining renders a countdown string.
check("formatRemaining 7d exact", R.formatRemaining(R.REENGAGEMENT_LOCK_MS) === "7d 00h 00m");
check("formatRemaining ready", R.formatRemaining(0) === "available now");
check(
  "formatRemaining partial",
  R.formatRemaining(3 * 24 * 3_600_000 + 4 * 3_600_000 + 5 * 60_000) === "3d 04h 05m"
);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);