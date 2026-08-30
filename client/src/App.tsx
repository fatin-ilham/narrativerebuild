import { useState } from "react";
import { ContinuousMotion } from "./components/ContinuousMotion";

export default function App() {
  const [text, setText] = useState("");
  const [thresholdSec, setThresholdSec] = useState<number>(5);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800/80 px-8 py-5">
        <h1 className="text-xl font-semibold tracking-tight">
          Narrative<span className="text-emerald-400">Rebuild</span>
          <span className="ml-3 text-sm font-normal text-stone-500">
            writing studio
          </span>
        </h1>
      </header>

      <main className="mx-auto max-w-3xl px-8 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Continuous Motion</h2>
            <p className="text-sm text-stone-400">
              Keep the words flowing. Pause beyond the threshold and the canvas
              gently pulses — no interruptions, no penalties.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-400">
            Pause threshold
            <select
              value={thresholdSec}
              onChange={(e) => setThresholdSec(Number(e.target.value))}
              className="rounded-md border border-stone-700 bg-stone-900 px-2 py-1 text-stone-200"
            >
              <option value={3}>3s</option>
              <option value={5}>5s</option>
              <option value={10}>10s</option>
            </select>
          </label>
        </div>

        <ContinuousMotion
          sessionId="demo-session-001"
          value={text}
          onChange={setText}
          thresholdSec={thresholdSec}
          placeholder="Write freely. If you stop too long, a soft pulse (no penalty) reminds you to continue…"
        />

        <p className="mt-4 text-right text-xs text-stone-500">
          {text.length} characters ·{String(text.trim()).split(/\s+/).filter(Boolean).length} words
        </p>
      </main>
    </div>
  );
}
