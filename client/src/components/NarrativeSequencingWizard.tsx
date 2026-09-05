import { useState } from "react";
import {
  NARRATIVE_STAGES,
  type NarrativeDayStage,
  type NarrativeSequenceState,
  isDayUnlocked,
} from "../lib/narrativeProtocol";
import { TimeDelayedReengagement } from "./TimeDelayedReengagement";

export interface NarrativeSequencingWizardProps {
  sequenceState: NarrativeSequenceState;
  onSelectDay: (day: number) => void;
  onStartWriting: (stage: NarrativeDayStage, promptText?: string) => void;
  onResetSequence: () => void;
  className?: string;
}

export function NarrativeSequencingWizard({
  sequenceState,
  onSelectDay,
  onStartWriting,
  onResetSequence,
  className = "",
}: NarrativeSequencingWizardProps) {
  const [selectedDayNum, setSelectedDayNum] = useState<number>(
    sequenceState.currentDay
  );

  const selectedStage =
    NARRATIVE_STAGES.find((s) => s.day === selectedDayNum) ||
    NARRATIVE_STAGES[0];
  const isUnlocked = isDayUnlocked(selectedDayNum, sequenceState);
  const completedRecord = sequenceState.completedDays[selectedDayNum];

  const handleStageClick = (day: number) => {
    setSelectedDayNum(day);
    onSelectDay(day);
  };

  return (
    <section
      className={
        "rounded-2xl border border-stone-800/80 bg-stone-900/60 backdrop-blur-md p-6 text-stone-100 " +
        className
      }
    >
      {/* Wizard Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
              Module 2 · Protocol Wizard
            </span>
            <span className="text-xs text-stone-500">Pennebaker 4-Day Framework</span>
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-stone-100">
            Narrative Sequencing Template Wizard
          </h2>
          <p className="mt-1 text-xs text-stone-400">
            Process a pivotal event across 4 distinct angles in sequence, moving from raw affect toward cognitive growth.
          </p>
        </div>

        <button
          onClick={onResetSequence}
          className="rounded-lg border border-stone-800 bg-stone-950/60 px-3 py-1.5 text-xs text-stone-400 hover:border-stone-700 hover:text-stone-200"
          title="Reset 4-day sequence to start a new event"
        >
          Reset Sequence
        </button>
      </div>

      {/* 4-Day Stepper Navigation */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {NARRATIVE_STAGES.map((stage) => {
          const unlocked = isDayUnlocked(stage.day, sequenceState);
          const isCurrent = sequenceState.currentDay === stage.day;
          const isSelected = selectedDayNum === stage.day;
          const isDone = Boolean(sequenceState.completedDays[stage.day]);

          return (
            <button
              key={stage.day}
              onClick={() => handleStageClick(stage.day)}
              className={
                "relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 " +
                (isSelected
                  ? "border-emerald-500/80 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/50"
                  : unlocked
                  ? "border-stone-800 bg-stone-950/40 hover:border-stone-700 hover:bg-stone-900/60"
                  : "border-stone-800/40 bg-stone-950/20 opacity-60 cursor-not-allowed")
              }
            >
              <div className="flex items-center justify-between">
                <span
                  className={
                    "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider " +
                    (isDone
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : isCurrent
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                      : unlocked
                      ? "bg-stone-800 text-stone-300"
                      : "bg-stone-900 text-stone-600")
                  }
                >
                  {isDone ? (
                    <>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      Day {stage.day} · Completed
                    </>
                  ) : unlocked ? (
                    `Day ${stage.day} · ${isCurrent ? "Active" : "Ready"}`
                  ) : (
                    <>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Day {stage.day} · Locked
                    </>
                  )}
                </span>
              </div>

              <div className="mt-3">
                <h4 className="text-sm font-semibold text-stone-200">
                  {stage.shortName}
                </h4>
                <p className="mt-1 line-clamp-2 text-xs text-stone-400">
                  {stage.focusAngle}
                </p>
              </div>

              {isDone && (
                <div className="mt-3 border-t border-stone-800/80 pt-2 text-[0.7rem] text-stone-500">
                  {sequenceState.completedDays[stage.day].wordCount} words logged
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Stage Detail Panel */}
      <div className="mt-6 rounded-2xl border border-stone-800/80 bg-stone-950/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={"rounded-md border px-2.5 py-0.5 text-xs font-medium " + selectedStage.themeColor.badge}>
                Stage {selectedStage.day} of 4
              </span>
              <span className="text-xs text-stone-400">
                {selectedStage.focusAngle}
              </span>
            </div>
            <h3 className="mt-2 text-lg font-bold text-stone-100">
              {selectedStage.title}
            </h3>
          </div>

          <div>
            {isUnlocked ? (
              <button
                onClick={() => onStartWriting(selectedStage)}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-stone-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:scale-[1.02]"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                {completedRecord ? "Re-enter 20-Min Session" : "Begin 20-Min Pennebaker Session"}
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-stone-800 bg-stone-900/80 px-4 py-2 text-xs text-stone-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Complete Day {selectedStage.day - 1} to unlock this stage
              </div>
            )}
          </div>
        </div>

        {/* Description & Clinical Rationale */}
        <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div className="rounded-xl border border-stone-800/60 bg-stone-900/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Focus Angle Guidance
            </h4>
            <p className="mt-2 leading-relaxed text-stone-300">
              {selectedStage.description}
            </p>
          </div>

          <div className="rounded-xl border border-stone-800/60 bg-stone-900/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Pennebaker Clinical Rationale
            </h4>
            <p className="mt-2 leading-relaxed text-stone-400 italic">
              "{selectedStage.clinicalRationale}"
            </p>
          </div>
        </div>

        {/* Guided Prompts */}
        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Suggested Prompts for Day {selectedStage.day}
          </h4>
          <div className="mt-2 space-y-2">
            {selectedStage.writingPrompts.map((prompt, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-lg border border-stone-800/50 bg-stone-900/40 p-3 text-xs text-stone-300"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-800 text-[0.65rem] font-bold text-emerald-400">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{prompt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Opening Phrases */}
        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Click to Start with an Opening Phrase:
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedStage.suggestedOpeningPhrases.map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (isUnlocked) onStartWriting(selectedStage, phrase);
                }}
                disabled={!isUnlocked}
                className={
                  "rounded-lg border px-3 py-1.5 text-xs transition-all " +
                  (isUnlocked
                    ? "border-stone-800 bg-stone-900 text-stone-300 hover:border-emerald-500/50 hover:text-emerald-300"
                    : "border-stone-800/40 bg-stone-950 text-stone-600 cursor-not-allowed")
                }
              >
                "{phrase}"
              </button>
            ))}
          </div>
        </div>

        {/* Completed Session Snapshot if available */}
        {completedRecord && (
          <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400">
                Completed Session Log (Day {selectedStage.day})
              </span>
              <span className="text-[0.7rem] text-stone-400">
                {new Date(completedRecord.completedAt).toLocaleDateString()} · {completedRecord.wordCount} words
              </span>
            </div>
            {/* 7-day re-engagement lock gates re-reading of the raw entry. */}
            <div className="mt-3">
              <TimeDelayedReengagement
                showRegistry={false}
                entries={[
                  {
                    entryId: `day-${selectedStage.day}`,
                    title: `Day ${selectedStage.day} Raw Entry`,
                    text: completedRecord.text,
                    createdAt: completedRecord.completedAt,
                  },
                ]}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
