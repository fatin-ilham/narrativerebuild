import http from "node:http";
import { Server } from "socket.io";

/**
 * NarrativeRebuild — real-time layer stub.
 *
 * Consumes the pause / pulse lifecycle events emitted by the "Continuous
 * Motion" typing validator on the client and aggregates them into lightweight
 * flow metrics so longitudinal reports can reason about how fractured or fluid
 * a session's writing was. This is a minimal, dependency-light stub suitable
 * for local verification; production would persist to MongoDB.
 */

const PORT = Number(process.env.PORT ?? 4000);

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ service: "narrativerebuild-realtime", ok: true }));
});

const io = new Server(server, {
  cors: { origin: "*" },
});

interface SessionFlow {
  sessionId: string;
  pauses: number;
  totalIdleMs: number;
  minIdleMs: number;
  maxIdleMs: number;
  lastEventAt: number;
  startedAt: number;
}

const flows = new Map<string, SessionFlow>();

function ensureFlow(sessionId: string): SessionFlow {
  let f = flows.get(sessionId);
  if (!f) {
    const now = Date.now();
    f = {
      sessionId,
      pauses: 0,
      totalIdleMs: 0,
      minIdleMs: Infinity,
      maxIdleMs: 0,
      lastEventAt: now,
      startedAt: now,
    };
    flows.set(sessionId, f);
  }
  return f;
}

io.on("connection", (socket) => {
  socket.on("typing:pause", (payload: { sessionId: string; seconds: number }) => {
    const flow = ensureFlow(payload.sessionId);
    flow.pauses += 1;
    flow.lastEventAt = Date.now();
    // Emit a friendly acknowledgement so the client knows the nudge was logged.
    socket.emit("typing:pause:ack", { sessionId: payload.sessionId, pauses: flow.pauses });
  });

  socket.on("typing:pulse", (payload: { sessionId: string; idleMs: number }) => {
    const flow = ensureFlow(payload.sessionId);
    flow.totalIdleMs += payload.idleMs;
    flow.minIdleMs = Math.min(flow.minIdleMs, payload.idleMs);
    flow.maxIdleMs = Math.max(flow.maxIdleMs, payload.idleMs);
    flow.lastEventAt = Date.now();
  });

  socket.on("typing:flow:snapshot", (payload: { sessionId: string }, ack?: (d: unknown) => void) => {
    const flow = flows.get(payload.sessionId);
    if (ack) {
      ack({
        ...(flow ?? ensureFlow(payload.sessionId)),
        minIdleMs: flow?.minIdleMs === Infinity ? 0 : flow?.minIdleMs ?? 0,
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`[realtime] NarrativeRebuild real-time layer on :${PORT}`);
});
