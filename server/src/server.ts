import http from "node:http";
import { Server } from "socket.io";
import { analyzePronouns, type PronounAnalysis } from "./pronounAnalyzer.js";
import { analyzeCoherence, type CoherenceAnalysis } from "./coherenceAnalyzer.js";
/**
 * NarrativeRebuild — real-time layer & linguistic analysis service.
 *
 * - Consumes the pause / pulse lifecycle events emitted by the "Continuous
 *   Motion" typing validator (Module 1, Member 2).
 * - Exposes the Pronoun Shift Tracker endpoint (Module 3, Member 2).
 * - Exposes the Coherence Metric Parser endpoint and real-time socket tracking
 *   for cause-and-effect and cognitive insight analysis (Module 3, Member 1).
 */

const PORT = Number(process.env.PORT ?? 4000);
const NLP_PORT = Number(process.env.NLP_PORT ?? 5000);

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 1_000_000) {
        reject(new Error("body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

/** Ask the Python NLP microservice to analyze pronouns in text. */
async function analyzeViaNlp(text: string): Promise<PronounAnalysis | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const resp = await fetch(`http://127.0.0.1:${NLP_PORT}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!resp.ok) return null;
    const json = (await resp.json()) as Record<string, unknown>;
    if (typeof json.firstCount !== "number") return null;
    return {
      firstCount: json.firstCount as number,
      thirdCount: json.thirdCount as number,
      firstPercent: json.firstPercent as number,
      thirdPercent: json.thirdPercent as number,
      subjectiveRatio: (json.subjectiveRatio as number | null) ?? null,
      tokenizer: (json.tokenizer as string) ?? "python",
      source: "nlp",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Ask the Python NLP microservice to analyze coherence (cause/effect & insight) in text. */
async function analyzeCoherenceViaNlp(text: string): Promise<CoherenceAnalysis | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const resp = await fetch(`http://127.0.0.1:${NLP_PORT}/analyze/coherence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!resp.ok) return null;
    const json = (await resp.json()) as Record<string, unknown>;
    if (typeof json.coherenceRatio !== "number") return null;
    return {
      totalWords: (json.totalWords as number) ?? 0,
      causalCount: (json.causalCount as number) ?? 0,
      causalDensity: (json.causalDensity as number) ?? 0,
      insightCount: (json.insightCount as number) ?? 0,
      insightDensity: (json.insightDensity as number) ?? 0,
      totalCoherenceCount: (json.totalCoherenceCount as number) ?? 0,
      coherenceRatio: (json.coherenceRatio as number) ?? 0,
      causalToInsightRatio: (json.causalToInsightRatio as number | null) ?? null,
      depthLevel: (json.depthLevel as string) ?? "Raw / Descriptive Stance",
      depthScore: (json.depthScore as number) ?? 0,
      detectedCausalWords: (json.detectedCausalWords as Array<{ word: string; count: number }>) ?? [],
      detectedInsightWords: (json.detectedInsightWords as Array<{ word: string; count: number }>) ?? [],
      tokenizer: (json.tokenizer as string) ?? "python",
      source: "nlp",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "POST" && url.pathname === "/api/linguistics/pronouns") {
    try {
      const raw = await readBody(req);
      const payload = JSON.parse(raw) as { text?: string };
      const text = typeof payload.text === "string" ? payload.text : "";

      // Prefer the dedicated Python NLP service; fall back to the bundled JS
      // analyzer so the tracker is resilient when the microservice is offline.
      const viaNlp = await analyzeViaNlp(text);
      const analysis: PronounAnalysis = viaNlp ?? analyzePronouns(text);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ analyzer: "pronoun-shift", ...analysis }));
      return;
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "invalid JSON body" }));
      return;
    }
  }

  if (req.method === "POST" && url.pathname === "/api/linguistics/coherence") {
    try {
      const raw = await readBody(req);
      const payload = JSON.parse(raw) as { text?: string };
      const text = typeof payload.text === "string" ? payload.text : "";

      // Prefer Python NLP service, fallback to pure JS/TS coherence analyzer
      const viaNlp = await analyzeCoherenceViaNlp(text);
      const analysis: CoherenceAnalysis = viaNlp ?? analyzeCoherence(text);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ analyzer: "coherence-parser", ...analysis }));
      return;
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "invalid JSON body" }));
      return;
    }
  }

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ service: "narrativerebuild-realtime", ok: true }));
    return;
  }

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
  /** Latest pronoun-shift analysis recorded for the session. */
  pronouns: PronounAnalysis | null;
  /** Latest coherence analysis recorded for the session. */
  coherence: CoherenceAnalysis | null;
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
      pronouns: null,
      coherence: null,
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

  // Pronoun Shift — record the current first/third-person split for the
  // session so longitudinal reports can trend ownership vs. distancing.
  socket.on(
    "typing:pronouns",
    async (
      payload: { sessionId: string; text: string },
      ack?: (a: PronounAnalysis) => void
    ) => {
      const flow = ensureFlow(payload.sessionId);
      const viaNlp = await analyzeViaNlp(payload.text ?? "");
      const analysis: PronounAnalysis = viaNlp ?? analyzePronouns(payload.text ?? "");
      flow.pronouns = analysis;
      flow.lastEventAt = Date.now();
      if (ack) ack(analysis);
    }
  );

  // Coherence Metric — record the current cause-and-effect & cognitive insight
  // density for the session to measure cognitive processing depth over time.
  socket.on(
    "typing:coherence",
    async (
      payload: { sessionId: string; text: string },
      ack?: (a: CoherenceAnalysis) => void
    ) => {
      const flow = ensureFlow(payload.sessionId);
      const viaNlp = await analyzeCoherenceViaNlp(payload.text ?? "");
      const analysis: CoherenceAnalysis = viaNlp ?? analyzeCoherence(payload.text ?? "");
      flow.coherence = analysis;
      flow.lastEventAt = Date.now();
      if (ack) ack(analysis);
    }
  );
});

server.listen(PORT, () => {
  console.log(`[realtime] NarrativeRebuild real-time layer on :${PORT}`);
});
