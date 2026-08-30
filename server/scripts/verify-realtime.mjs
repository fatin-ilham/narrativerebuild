// Manual verification harness for the "Continuous Motion" typing validator real-time layer.
// Simulates a writing session: typing bursts interleaved with idle pauses, then
// requests the aggregated flow snapshot to confirm pause/pulse events arrived.
import { io } from "socket.io-client";

const URL = "http://localhost:4000";
const SESSION = "verify-session-" + Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const socket = io(URL, { transports: ["web-socket", "polling"] });

socket.on("connect", async () => {
  console.log("connected:", socket.id);
  try {
    // Simulate ~6s of typing (should NOT cross the 5s threshold in one go)
    for (let i = 0; i < 4; i++) {
      socket.emit("typing:pulse", { sessionId: SESSION, idleMs: 300 });
      await sleep(300);
    }

    // Long pause [~7s] — crosses the 5s threshold; should count as a pause
    console.log("pausing (idle)…");
    socket.emit("typing:pause", { sessionId: SESSION, seconds: 5 });
    for (let i = 0; i < 6; i++) {
      socket.emit("typing:pulse", { sessionId: SESSION, idleMs: 6000 + i * 250 });
      await sleep(250);
    }
    socket.emit("typing:pulse", { sessionId: SESSION, idleMs: 7000 });

    // Resumed typing
    for (let i = 0; i < 3; i++) {
      socket.emit("typing:pulse", { sessionId: SESSION, idleMs: 200 });
      await sleep(200);
    }

    // Snapshot
    socket.emit("typing:flow:snapshot", { sessionId: SESSION }, (flow) => {
      console.log("FLOW SNAPSHOT:", JSON.stringify(flow, null, 2));
      const ok =
        flow.pauses >= 1 && flow.maxIdleMs >= 7000 && flow.totalIdleMs > 0;
      console.log(ok ? "PASS: pause/flow aggregated correctly" : "FAIL");
      socket.disconnect();
      process.exit(ok ? 0 : 1);
    });
  } catch (e) {
    console.error("error:", e);
    process.exit(1);
  }
});

socket.on("connect_error", (e) => {
  console.error("connect_error:", e.message);
  process.exit(2);
});
