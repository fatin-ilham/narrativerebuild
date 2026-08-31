import { useState, useEffect } from "react";

export interface SafeWordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SafeWordModal({ isOpen, onClose }: SafeWordModalProps) {
  const [phase, setPhase] = useState<string>("Inhale through nose");
  const [phaseTimer, setPhaseTimer] = useState<number>(4);

  useEffect(() => {
    if (!isOpen) return;

    let timer = 0;
    const interval = setInterval(() => {
      timer = (timer + 1) % 19;
      if (timer < 4) {
        setPhase("Inhale through nose");
        setPhaseTimer(4 - timer);
      } else if (timer < 11) {
        setPhase("Hold your breath gently");
        setPhaseTimer(11 - timer);
      } else {
        setPhase("Exhale completely through mouth");
        setPhaseTimer(19 - timer);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-lg">
      <div className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* Header Alert Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-rose-950/70 border border-rose-800/60 text-rose-300 text-xs font-bold">
          <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Safe-Word Emergency Halt Triggered</span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100">
            You are safe. The session is stopped.
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-md mx-auto">
            All written text on the screen has been wiped from memory. Let's ground your body and restore calm.
          </p>
        </div>

        {/* 4-7-8 Guided Breathing Circle */}
        <div className="py-4 flex flex-col items-center justify-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-pulse" />
            <div className="absolute inset-4 rounded-full bg-teal-600/30 border border-teal-400/40" />
            <div className="relative z-10 flex flex-col items-center">
              <svg className="w-6 h-6 text-teal-300 mb-1 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs font-bold text-stone-100">{phase}</span>
              <span className="text-2xl font-extrabold text-teal-300 mt-1">{phaseTimer}s</span>
            </div>
          </div>
        </div>

        {/* 5-4-3-2-1 Somatic Grounding Exercise */}
        <div className="p-4 bg-stone-950/60 border border-stone-800/80 rounded-2xl text-left space-y-2">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
            5-4-3-2-1 Grounding Exercise
          </span>
          <ul className="text-xs text-stone-300 space-y-1">
            <li>• <strong>5 things</strong> you can see in the room around you.</li>
            <li>• <strong>4 things</strong> you can physically touch (feel your feet on the floor).</li>
            <li>• <strong>3 things</strong> you can hear right now.</li>
            <li>• <strong>2 things</strong> you can smell.</li>
            <li>• <strong>1 deep sip</strong> of cool water.</li>
          </ul>
        </div>

        {/* Crisis Support Lifeline */}
        <div className="p-3 bg-stone-950/40 rounded-xl border border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Crisis & Support Lifeline: Dial <strong>999</strong> or local emergency services</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-full bg-teal-400 hover:bg-teal-300 text-stone-950 font-bold text-sm shadow-md transition flex items-center justify-center space-x-2"
        >
          <span>I am Ready to Return to Workspace</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}