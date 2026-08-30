import { useState } from "react";
import { ContinuousMotion } from "./components/ContinuousMotion";
import { PronounShiftTracker } from "./components/PronounShiftTracker";
import { PennebakerStructuredInterface } from "./components/PennebakerStructuredInterface";
import { NarrativeSequencingWizard } from "./components/NarrativeSequencingWizard";
import { CoherenceMetricParser } from "./components/CoherenceMetricParser";
import { AmbientAtmosphereSelector } from "./components/AmbientAtmosphereSelector";
import {
  loadNarrativeState,
  recordCompletedDay,
  saveNarrativeState,
  type NarrativeDayStage,
  type NarrativeSequenceState,
} from "./lib/narrativeProtocol";

type ActiveTab = "wizard" | "studio" | "linguistics" | "ambience";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("wizard");
  const [text, setText] = useState<string>("");
  const [thresholdSec, setThresholdSec] = useState<number>(5);

  // 4-Day Protocol State (Module 2, Member 1)
  const [sequenceState, setSequenceState] = useState<NarrativeSequenceState>(() =>
    loadNarrativeState()
  );
  const [activeStage, setActiveStage] = useState<NarrativeDayStage | null>(null);

  // Locked Pennebaker Session State (Module 1, Member 1)
  const [isLockedSessionOpen, setIsLockedSessionOpen] = useState<boolean>(false);

  // Handle starting a writing session from the 4-day wizard
  const handleStartWritingFromWizard = (
    stage: NarrativeDayStage,
    promptText?: string
  ) => {
    setActiveStage(stage);
    if (promptText) {
      setText((prev) => (prev ? `${prev}\n\n${promptText} ` : `${promptText} `));
    }
    setIsLockedSessionOpen(true);
  };

  // Handle completing a locked Pennebaker writing session
  const handleCompleteLockedSession = (
    completedText: string,
    durationSec: number
  ) => {
    setText(completedText);
    const day = activeStage ? activeStage.day : sequenceState.currentDay;
    const wordCount = completedText.trim().split(/\s+/).filter(Boolean).length;

    const updated = recordCompletedDay(day, {
      text: completedText,
      wordCount,
      durationSeconds: durationSec,
    });
    setSequenceState(updated);
    setIsLockedSessionOpen(false);
    setActiveTab("linguistics");
  };

  const handleResetSequence = () => {
    if (
      window.confirm(
        "Are you sure you want to reset your 4-day narrative sequence? This will restart from Day 1."
      )
    ) {
      const resetState: NarrativeSequenceState = {
        currentDay: 1,
        completedDays: {},
        narrativeTopic: "My Expressive Writing Journey",
        lastUpdated: Date.now(),
      };
      saveNarrativeState(resetState);
      setSequenceState(resetState);
      setText("");
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-stone-800/80 bg-stone-950/80 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">
              Narrative<span className="text-emerald-400">Rebuild</span>
            </h1>
            <span className="rounded-md border border-stone-800 bg-stone-900 px-2 py-0.5 text-xs text-stone-400">
              Pennebaker Expressive Writing Engine
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 rounded-xl border border-stone-800 bg-stone-900/60 p-1 text-xs">
            <button
              onClick={() => setActiveTab("wizard")}
              className={
                "rounded-lg px-3.5 py-1.5 font-medium transition " +
                (activeTab === "wizard"
                  ? "bg-emerald-500 text-stone-950 font-bold shadow-sm"
                  : "text-stone-400 hover:text-stone-200")
              }
            >
              4-Day Protocol Wizard
            </button>
            <button
              onClick={() => setActiveTab("studio")}
              className={
                "rounded-lg px-3.5 py-1.5 font-medium transition " +
                (activeTab === "studio"
                  ? "bg-emerald-500 text-stone-950 font-bold shadow-sm"
                  : "text-stone-400 hover:text-stone-200")
              }
            >
              Writing Studio
            </button>
            <button
              onClick={() => setActiveTab("linguistics")}
              className={
                "rounded-lg px-3.5 py-1.5 font-medium transition " +
                (activeTab === "linguistics"
                  ? "bg-emerald-500 text-stone-950 font-bold shadow-sm"
                  : "text-stone-400 hover:text-stone-200")
              }
            >
              Linguistic Insights
            </button>
            <button
              onClick={() => setActiveTab("ambience")}
              className={
                "rounded-lg px-3.5 py-1.5 font-medium transition " +
                (activeTab === "ambience"
                  ? "bg-emerald-500 text-stone-950 font-bold shadow-sm"
                  : "text-stone-400 hover:text-stone-200")
              }
            >
              Soundscapes
            </button>
          </nav>

          {/* Quick Ambience Status Toggle */}
          <div className="hidden sm:flex items-center gap-3">
            <AmbientAtmosphereSelector compact={true} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {/* TAB 1: 4-DAY NARRATIVE SEQUENCING WIZARD (Module 2, Member 1) */}
        {activeTab === "wizard" && (
          <div className="space-y-6">
            <NarrativeSequencingWizard
              sequenceState={sequenceState}
              onSelectDay={() => {}}
              onStartWriting={handleStartWritingFromWizard}
              onResetSequence={handleResetSequence}
            />

            {/* Quick Live Linguistic Preview if user has written something */}
            {text.trim().length > 0 && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <CoherenceMetricParser
                  text={text}
                  sequenceState={sequenceState}
                />
                <PronounShiftTracker text={text} />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WRITING STUDIO & CONTINUOUS MOTION */}
        {activeTab === "studio" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-stone-100">
                  Continuous Writing Studio
                </h2>
                <p className="text-xs text-stone-400">
                  Free-form stream of consciousness with continuous motion keystroke monitoring.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsLockedSessionOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-stone-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                  Launch 20-Min Locked Session
                </button>

                <label className="flex items-center gap-2 text-xs text-stone-400">
                  Pause threshold:
                  <select
                    value={thresholdSec}
                    onChange={(e) => setThresholdSec(Number(e.target.value))}
                    className="rounded-md border border-stone-700 bg-stone-900 px-2 py-1 text-xs text-stone-200"
                  >
                    <option value={3}>3s</option>
                    <option value={5}>5s</option>
                    <option value={10}>10s</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Continuous Motion Writing Area (Module 1, Member 2) */}
            <ContinuousMotion
              sessionId="studio-session-001"
              value={text}
              onChange={setText}
              thresholdSec={thresholdSec}
              placeholder="Write freely without self-censoring. If you pause for more than 5 seconds, a gentle soft pulse reminds you to continue…"
              className="min-h-[340px]"
            />

            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>
                {text.length} characters · {wordCount} words
              </span>
              <button
                onClick={() => setText("")}
                className="hover:text-stone-300 underline"
              >
                Clear text
              </button>
            </div>

            {/* Live Linguistic Parsers */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <CoherenceMetricParser
                text={text}
                sequenceState={sequenceState}
              />
              <PronounShiftTracker text={text} />
            </div>
          </div>
        )}

        {/* TAB 3: LINGUISTIC INSIGHTS & METRICS */}
        {activeTab === "linguistics" && (
          <div className="space-y-6">
            <div className="border-b border-stone-800/80 pb-4">
              <h2 className="text-xl font-bold text-stone-100">
                Longitudinal Linguistic Analysis
              </h2>
              <p className="text-xs text-stone-400">
                Cognitive processing depth and pronoun shift metrics tracked across sessions.
              </p>
            </div>

            {/* Coherence Metric Parser (Module 3, Member 1) */}
            <CoherenceMetricParser
              text={text}
              sequenceState={sequenceState}
            />

            {/* Pronoun Shift Tracker (Module 3, Member 2) */}
            <PronounShiftTracker text={text} />
          </div>
        )}

        {/* TAB 4: ACOUSTIC / AMBIENT SOUNDSCAPES (Module 4, Member 1) */}
        {activeTab === "ambience" && (
          <div className="space-y-6">
            <div className="border-b border-stone-800/80 pb-4">
              <h2 className="text-xl font-bold text-stone-100">
                Acoustic / Ambient Soundscape Mixer
              </h2>
              <p className="text-xs text-stone-400">
                Procedural multi-track audio player for lowering physiological arousal during writing.
              </p>
            </div>

            <AmbientAtmosphereSelector compact={false} />
          </div>
        )}
      </main>

      {/* LOCKED PENNEBAKER PROTOCOL INTERFACE (Module 1, Member 1) */}
      {isLockedSessionOpen && (
        <PennebakerStructuredInterface
          stage={activeStage}
          initialText={text}
          defaultDurationSec={1200}
          onCompleteSession={handleCompleteLockedSession}
          onExitSession={() => setIsLockedSessionOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-stone-900 bg-stone-950/80 px-6 py-4 text-center text-xs text-stone-600">
        NarrativeRebuild · Post-Traumatic Growth & Expressive Writing Engine · CSE470 Group 01
      </footer>
    </div>
  );
}
