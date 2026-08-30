/**
 * NarrativeRebuild — 4-Day Narrative Sequencing Protocol (Module 2, Member 1).
 *
 * Implements Dr. James Pennebaker's clinically proven 4-day expressive writing
 * sequence for processing a trauma or major life disruption from distinct angles:
 *  - Day 1: Raw Emotion (uninhibited feelings, emotional release, unedited stream)
 *  - Day 2: Facts and Actions (objective recounting, chronological actions, external reality)
 *  - Day 3: Consequences (ripples across relationships, behaviors, identity, and life)
 *  - Day 4: Meaning and Growth (post-traumatic growth, lessons learned, reconstructive integration)
 *
 * Enforces sequential stage unlocking and tracks longitudinal progress.
 */

export interface NarrativeDayStage {
  day: number;
  title: string;
  shortName: string;
  focusAngle: string;
  description: string;
  clinicalRationale: string;
  writingPrompts: string[];
  suggestedOpeningPhrases: string[];
  themeColor: {
    badge: string;
    border: string;
    glow: string;
    accent: string;
  };
}

export interface DaySessionRecord {
  day: number;
  text: string;
  wordCount: number;
  completedAt: number; // timestamp ms
  durationSeconds: number;
  coherenceRatio?: number;
  pronounFirstPercent?: number;
  pronounThirdPercent?: number;
}

export interface NarrativeSequenceState {
  currentDay: number; // 1 to 4
  completedDays: Record<number, DaySessionRecord>;
  narrativeTopic: string;
  lastUpdated: number;
}

export const NARRATIVE_STAGES: NarrativeDayStage[] = [
  {
    day: 1,
    title: "Day 1: Raw Emotion & Uninhibited Feelings",
    shortName: "Raw Emotion",
    focusAngle: "Emotional Catharsis & Unfiltered Expression",
    description:
      "Pour out your rawest, deepest emotions without editing, filtering, or judgment. Focus on the visceral feelings—grief, shock, fear, anger—that you have kept locked away.",
    clinicalRationale:
      "Pennebaker's research shows that confronting unexpressed emotional turmoil unburdens working memory and physiological somatic stress.",
    writingPrompts: [
      "What was the most painful or overwhelming feeling you experienced?",
      "What emotional truth have you been afraid or hesitant to say out loud?",
      "How did your heart and body feel in that exact moment?",
    ],
    suggestedOpeningPhrases: [
      "The rawest feeling I have kept inside is...",
      "When I think about what happened, the deepest emotion that surfaces is...",
      "I haven't told anyone how much it hurt when...",
    ],
    themeColor: {
      badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      border: "border-rose-500/40",
      glow: "shadow-rose-500/10",
      accent: "text-rose-400",
    },
  },
  {
    day: 2,
    title: "Day 2: Objective Facts & Concrete Actions",
    shortName: "Facts & Actions",
    focusAngle: "Chronological Reality & Observable Events",
    description:
      "Recount the objective sequence of events with clarity. What physically happened? Who was there? What concrete actions occurred before, during, and after?",
    clinicalRationale:
      "Shifting from raw affect to concrete facts engages the prefrontal cortex, organizing fragmented traumatic memories into an orderly chronological timeline.",
    writingPrompts: [
      "Step-by-step, what was the chronological sequence of events?",
      "What were the exact words spoken and physical actions taken?",
      "Looking from the outside like a camera, what would an observer have seen?",
    ],
    suggestedOpeningPhrases: [
      "To state the facts clearly, what actually happened was...",
      "The timeline of events began when...",
      "Looking at the concrete actions that took place...",
    ],
    themeColor: {
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      border: "border-amber-500/40",
      glow: "shadow-amber-500/10",
      accent: "text-amber-400",
    },
  },
  {
    day: 3,
    title: "Day 3: Ripples & Interpersonal Consequences",
    shortName: "Consequences",
    focusAngle: "Cause, Effect & Systemic Impact",
    description:
      "Examine how this event reshaped your daily reality, relationships, trust, habits, and self-image. Trace the ripple effects and cause-and-effect patterns in your life.",
    clinicalRationale:
      "Analyzing consequences develops cognitive coherence by connecting past trauma to present behavioral adjustments and interpersonal boundaries.",
    writingPrompts: [
      "How did this event ripple through your relationships and connections with others?",
      "What habits, defenses, or behaviors changed as a direct consequence?",
      "In what ways did your day-to-day lifestyle or outlook shift because of this?",
    ],
    suggestedOpeningPhrases: [
      "The consequences began to ripple outward when...",
      "Because of what occurred, I noticed changes in how I...",
      "The biggest impact on my daily life and relationships was...",
    ],
    themeColor: {
      badge: "bg-sky-500/20 text-sky-300 border-sky-500/40",
      border: "border-sky-500/40",
      glow: "shadow-sky-500/10",
      accent: "text-sky-400",
    },
  },
  {
    day: 4,
    title: "Day 4: Meaning, Resilience & Post-Traumatic Growth",
    shortName: "Meaning & Growth",
    focusAngle: "Integration, Reconstructive Insight & Future Closure",
    description:
      "Discover the reconstructive meaning and personal growth forged through adversity. What strengths, values, wisdom, and future clarity have emerged from this experience?",
    clinicalRationale:
      "The culmination of Pennebaker's protocol: transforming traumatic pain into a coherent narrative of resilience and profound personal evolution.",
    writingPrompts: [
      "What core truths about your inner strength or resilience did you discover?",
      "What insights or wisdom do you now carry that you didn't have before?",
      "How does this chapter fit into your broader life story as you move forward?",
    ],
    suggestedOpeningPhrases: [
      "Looking back now, the deepest meaning I have found is...",
      "Through this experience, I realized that I am...",
      "The wisdom and growth I carry forward into the future is...",
    ],
    themeColor: {
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      border: "border-emerald-500/40",
      glow: "shadow-emerald-500/10",
      accent: "text-emerald-400",
    },
  },
];

const STORAGE_KEY = "narrative_rebuild_sequence_v1";

export function loadNarrativeState(): NarrativeSequenceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as NarrativeSequenceState;
    }
  } catch {
    // ignore
  }

  return {
    currentDay: 1,
    completedDays: {},
    narrativeTopic: "My Expressive Writing Journey",
    lastUpdated: Date.now(),
  };
}

export function saveNarrativeState(state: NarrativeSequenceState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function recordCompletedDay(
  day: number,
  record: Omit<DaySessionRecord, "day" | "completedAt">
): NarrativeSequenceState {
  const current = loadNarrativeState();
  const nextDay = Math.min(4, Math.max(current.currentDay, day + 1));

  const updated: NarrativeSequenceState = {
    ...current,
    currentDay: nextDay,
    completedDays: {
      ...current.completedDays,
      [day]: {
        ...record,
        day,
        completedAt: Date.now(),
      },
    },
    lastUpdated: Date.now(),
  };

  saveNarrativeState(updated);
  return updated;
}

export function isDayUnlocked(day: number, state: NarrativeSequenceState): boolean {
  if (day === 1) return true;
  // Day N is unlocked if Day N-1 is recorded in completedDays
  return Boolean(state.completedDays[day - 1]);
}
