import { io, type Socket } from "socket.io-client";

/**
 * Shared Socket.io client for the NarrativeRebuild real-time layer.
 * The "Continuous Motion" typing validator uses this to stream pause / pulse
 * lifecycle events to the backend so flow metrics can be aggregated.
 *
 * The client is created lazily and tolerant of being constructed before the
 * backend is reachable — the validator degrades gracefully to local-only
 * behaviour if no server is available, so expressive writing is never blocked
 * by an offline telemetry link.
 */

const SOCKET_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_SOCKET_URL ?? "http://localhost:4000";

export const socket: Socket | null = createSocket();

function createSocket(): Socket | null {
  try {
    const s = io(SOCKET_URL, {
      reconnectionAttempts: 3,
      timeout: 4000,
      transports: ["websocket", "polling"],
    });
    // Suppress noisy connect errors in the console during the demo/dev setups
    // where the backend hasn't been started yet.
    s.on("connect_error", () => {});
    return s;
  } catch {
    return null;
  }
}
