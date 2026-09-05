import { useState } from "react";
import { ContinuousMotion } from "./components/ContinuousMotion";
import { PronounShiftTracker } from "./components/PronounShiftTracker";
import { PennebakerStructuredInterface } from "./components/PennebakerStructuredInterface";
import { NarrativeSequencingWizard } from "./components/NarrativeSequencingWizard";
import { CoherenceMetricParser } from "./components/CoherenceMetricParser";
import { AmbientAtmosphereSelector } from "./components/AmbientAtmosphereSelector";
import { PrePostAffectTracker } from "./components/PrePostAffectTracker";
import { TimeDelayedReengagement } from "./components/TimeDelayedReengagement";
import { schedulePost } from "./lib/affect";
import { lockEntry } from "./lib/reengagement";
import {
  loadNarrativeState,
  recordCompletedDay,
  saveNarrativeState,
  type NarrativeDayStage,
  type NarrativeSequenceState,
} from "./lib/narrativeProtocol";

type ActiveTab = "wizard" | "studio" | "linguistics" | "ambience" | "toolkit";

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

  // Pre/Post Affect Gate (Module 2, Member 2)
  const [showAffectGate, setShowAffectGate] = useState<boolean>(false);
  const [affectSessionId, setAffectSessionId] = useState<string>("");

  // ===== MODULE 1, MEMBER 3: DRAFT DESTRUCTION SIMULATOR =====
  const [showBurnConfirm, setShowBurnConfirm] = useState<boolean>(false);

  const handleBurn = () => {
    if (text.trim()) {
      setShowBurnConfirm(true);
    }
  };

  const confirmBurn = () => {
    setText("");
    setShowBurnConfirm(false);
  };

  // ===== MODULE 2, MEMBER 3: NARRATIVE COMPLETION CHECKLIST =====
  const [feedback, setFeedback] = useState<string[]>([]);

  const checkNarrative = () => {
    const words = text.split(/\s+/).length;
    const hasBeginning = /^(once|start|begin|first|initially)/i.test(text);
    const hasTurningPoint = /(but|then|however|suddenly|although)/i.test(text);
    const hasConclusion = /(finally|now|end|ultimately|in conclusion)/i.test(text);

    let result = [];

    if (words < 30) {
      result.push("✏️ Write at least 30 words for a complete story.");
    } else {
      result.push("✅ Word count: " + words + " words.");
    }

    if (!hasBeginning) {
      result.push("📖 Add a clear beginning or introduction.");
    } else {
      result.push("✅ Has a clear beginning.");
    }

    if (!hasTurningPoint) {
      result.push("🔄 Add a turning point or change.");
    } else {
      result.push("✅ Has a turning point.");
    }

    if (!hasConclusion) {
      result.push("⚠️ Add a conclusion or resolution.");
    } else {
      result.push("✅ Has a conclusion.");
    }

    if (hasBeginning && hasTurningPoint && hasConclusion) {
      result.push("🎉 Great job! Your story is complete!");
    }

    setFeedback(result);
  };

  // ===== MODULE 3, MEMBER 3: INSIGHT WORD DENSITY METRIC =====
  const [insightScore, setInsightScore] = useState<number | null>(null);

  const calculateInsightDensity = () => {
    const growthWords = [
      'learned', 'grew', 'reconstructed', 'understood', 'realized',
      'progress', 'healed', 'accepted', 'stronger', 'overcame',
      'discovered', 'evolved', 'transformed', 'adapted', 'embraced'
    ];
    const words = text.toLowerCase().split(/\s+/);
    let count = 0;
    words.forEach(word => {
      if (growthWords.includes(word)) {
        count++;
      }
    });
    setInsightScore(count);
  };

  // ===== MODULE 4, MEMBER 3: ANONYMIZED WISDOM ARCHIVE CONTRIBUTION =====
  const [contributeToArchive, setContributeToArchive] = useState(false);
  const [archiveMessage, setArchiveMessage] = useState("");

  const handleArchiveSubmit = () => {
    if (!contributeToArchive) {
      setArchiveMessage("⚠️ Please check the box to confirm you want to share anonymously.");
      return;
    }
    if (text.trim().length < 10) {
      setArchiveMessage("⚠️ Please write a longer story before submitting to the archive.");
      return;
    }
    setArchiveMessage("✅ Thank you! Your anonymous story has been added to the Wisdom Archive.");
  };

  // Handle starting a writing session from the 4-day wizard
  const handleStartWritingFromWizard = (
    stage: NarrativeDayStage,
    promptText?: string
  ) => {
    setActiveStage(stage);
    if (promptText) {
      setText((prev) => (prev ? `${prev}\n\n${promptText} ` : `${promptText} `));
    }
    // Open the pre-session affect gate before the locked modal.
    setAffectSessionId("sess-" + Date.now());
    setIsLockedSessionOpen(false);
    setShowAffectGate(true);
  };

  // Begin the actual locked writing session once pre-affect scales are complete.
  const handleAffectPreComplete = () => {
    setShowAffectGate(false);
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
    // Apply the 7-day re-engagement lock to this raw entry (keyed by day,
    // matching sequenceState.completedDays and the wizard's display surface).
    lockEntry(`day-${day}`, {
      title: `Day ${day} Raw Entry`,
      createdAt: Date.now(),
    });
    // Schedule the +15 minute post-session affect scales.
    if (affectSessionId) schedulePost(affectSessionId);
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
            <button
              onClick={() => setActiveTab("toolkit")}
              className={
                "rounded-lg px-3.5 py-1.5 font-medium transition " +
                (activeTab === "toolkit"
                  ? "bg-emerald-500 text-stone-950 font-bold shadow-sm"
                  : "text-stone-400 hover:text-stone-200")
              }
            >
              Growth Tools
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
                  onClick={() => {
                    setAffectSessionId("sess-" + Date.now());
                    setIsLockedSessionOpen(false);
                    setShowAffectGate(true);
                  }}
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

            {/* Pre/Post Affect Tracker (Module 2, Member 2) */}
            <PrePostAffectTracker
              sessionId={affectSessionId || "studio-affect-session"}
              day={activeStage?.day}
              sessionInProgress={isLockedSessionOpen}
            />
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

            {/* Pre/Post Affect Tracker (Module 2, Member 2) */}
            <PrePostAffectTracker
              sessionId={affectSessionId || "studio-affect-session"}
              day={activeStage?.day}
              sessionInProgress={isLockedSessionOpen}
            />

            {/* Time-Delayed Re-engagement Engine (Module 4, Member 2) */}
            <TimeDelayedReengagement
              entries={Object.values(sequenceState.completedDays)
                .filter((record) => Boolean(record.text))
                .map((record) => ({
                  entryId: `day-${record.day}`,
                  title: `Day ${record.day} Raw Entry`,
                  text: record.text,
                  createdAt: record.completedAt,
                }))}
            />
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

        {/* TAB 5: GROWTH & REFLECTION TOOLKIT */}
        {activeTab === "toolkit" && (
          <div className="space-y-6">
            <div className="border-b border-stone-800/80 pb-4">
              <h2 className="text-xl font-bold text-stone-100">
                Growth & Reflection Toolkit
              </h2>
              <p className="text-xs text-stone-400">
                Supplementary writing supports: draft destruction, narrative structure checks,
                growth-word density, and the anonymized wisdom archive.
              </p>
            </div>

            {/* Main Writing Area */}
            <div className="mb-2">
              <h2 className="text-lg font-medium">Your Writing</h2>
              <p className="text-sm text-stone-400 mb-4">
                Write freely. Your words are private and safe.
              </p>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your thoughts here..."
              className="w-full h-48 bg-stone-800/50 text-stone-100 rounded-lg p-4 border border-stone-700 focus:border-emerald-400 focus:outline-none resize-none"
            />

            {/* MODULE 1, MEMBER 3: DRAFT DESTRUCTION SIMULATOR */}
            <section className="mt-8 border-t border-stone-800/80 pt-8">
              <h2 className="text-lg font-medium">🔥 Draft Destruction Simulator</h2>
              <p className="text-sm text-stone-400 mb-4">
                Permanently burn a raw writing sample instead of saving it to the database.
              </p>

              <button
                onClick={handleBurn}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition"
              >
                Burn Draft
              </button>
            </section>

            {/* MODULE 2, MEMBER 3: NARRATIVE COMPLETION CHECKLIST */}
            <section className="mt-8 border-t border-stone-800/80 pt-8">
              <h2 className="text-lg font-medium">✅ Narrative Completion Checklist</h2>
              <p className="text-sm text-stone-400 mb-4">
                Checks if your writing has a clear beginning, turning point, and conclusion.
              </p>

              <button
                onClick={checkNarrative}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition"
              >
                Check Narrative Structure
              </button>

              {feedback.length > 0 && (
                <div className="mt-4 p-4 bg-stone-800/30 rounded-lg border border-stone-700">
                  {feedback.map((item, index) => (
                    <p key={index} className="text-sm text-stone-300 py-1">
                      {item}
                    </p>
                  ))}
                </div>
              )}
            </section>

            {/* MODULE 3, MEMBER 3: INSIGHT WORD DENSITY METRIC */}
            <section className="mt-8 border-t border-stone-800/80 pt-8">
              <h2 className="text-lg font-medium">📊 Insight Word Density</h2>
              <p className="text-sm text-stone-400 mb-4">
                Counts growth-related vocabulary to calculate your Post-Traumatic Growth Index.
              </p>

              <button
                onClick={calculateInsightDensity}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition"
              >
                Calculate Growth Index
              </button>

              {insightScore !== null && (
                <div className="mt-4 p-4 bg-stone-800/30 rounded-lg border border-stone-700">
                  <p className="text-stone-300">
                    <span className="font-medium">Post-Traumatic Growth Index:</span> {insightScore}
                  </p>
                  <p className="text-sm text-stone-400 mt-1">
                    {insightScore < 3 && "Try incorporating more reflection and growth words like 'learned', 'grew', or 'reconstructed'."}
                    {insightScore >= 3 && "Great reflection! Your writing shows meaningful cognitive processing."}
                  </p>
                </div>
              )}
            </section>

            {/* MODULE 4, MEMBER 3: ANONYMIZED WISDOM ARCHIVE CONTRIBUTION */}
            <section className="mt-8 border-t border-stone-800/80 pt-8">
              <h2 className="text-lg font-medium">📚 Wisdom Archive Contribution</h2>
              <p className="text-sm text-stone-400 mb-4">
                Submit an anonymous version of your story to help others on their healing journey.
              </p>

              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={contributeToArchive}
                  onChange={() => setContributeToArchive(!contributeToArchive)}
                  className="w-5 h-5 accent-emerald-500"
                />
                <label className="text-stone-300">I agree to remove my name and identifying details.</label>
              </div>

              <button
                onClick={handleArchiveSubmit}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-white font-medium transition"
              >
                Submit to Archive
              </button>

              {archiveMessage && (
                <div className="mt-4 p-4 bg-stone-800/30 rounded-lg border border-stone-700">
                  <p className="text-sm text-stone-300">{archiveMessage}</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* PRE-SESSION AFFECT GATE (Module 2, Member 2) */}
      {showAffectGate && (
        <div className="fixed inset-0 z-50 flex flex-col bg-stone-950 text-stone-100 overflow-y-auto">
          <header className="flex items-center justify-between border-b border-stone-800/80 bg-stone-950/90 px-8 py-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Before You Begin
              </span>
              <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-rose-400 border border-rose-500/30">
                Pre-Session Affect
              </span>
            </div>
            <button
              onClick={() => setShowAffectGate(false)}
              className="rounded-lg border border-stone-800 p-2 text-stone-500 hover:bg-stone-900 hover:text-stone-300"
              title="Cancel"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <main className="mx-auto w-full max-w-4xl flex-1 px-8 py-8">
            <PrePostAffectTracker
              sessionId={affectSessionId}
              day={activeStage?.day}
              showHistory={false}
              onPreComplete={handleAffectPreComplete}
            />
          </main>
        </div>
      )}

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

      {/* BURN CONFIRMATION POPUP */}
      {showBurnConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-stone-900 p-8 rounded-xl max-w-md w-full border border-stone-700">
            <h2 className="text-xl font-bold text-red-400">🔥 Burn this draft?</h2>
            <p className="text-stone-400 mt-2">
              This action cannot be undone. Your writing will be permanently destroyed.
            </p>
            <div className="mt-6 flex gap-4">
              <button
                onClick={confirmBurn}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition"
              >
                Yes, Burn It
              </button>
              <button
                onClick={() => setShowBurnConfirm(false)}
                className="px-6 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-white font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-stone-900 bg-stone-950/80 px-6 py-4 text-center text-xs text-stone-600">
        NarrativeRebuild · Post-Traumatic Growth & Expressive Writing Engine · CSE470 Group 01
      </footer>
    </div>
  );
}