export interface AffectSliderProps {
  label: string;
  lowLabel: string;
  highLabel: string;
  value: number;
  onChange: (value: number) => void;
  /** Optional hue accent classes (default emerald). */
  accent?: "emerald" | "amber" | "sky" | "rose";
  /** Disable interaction (e.g. reviewing a locked-in score). */
  disabled?: boolean;
}

const ACCENTS: Record<
  NonNullable<AffectSliderProps["accent"]>,
  { fill: string; thumb: string }
> = {
  emerald: { fill: "bg-emerald-500", thumb: "accent-emerald-500" },
  amber: { fill: "bg-amber-500", thumb: "accent-amber-500" },
  sky: { fill: "bg-sky-500", thumb: "accent-sky-500" },
  rose: { fill: "bg-rose-500", thumb: "accent-rose-500" },
};

/**
 * A reusable 0–100 affect scale slider with labeled anchors. Used inside the
 * Pre/Post Writing Subjective Affect tracker for mood and stress scales.
 */
export function AffectSlider({
  label,
  lowLabel,
  highLabel,
  value,
  onChange,
  accent = "emerald",
  disabled = false,
}: AffectSliderProps) {
  const a = ACCENTS[accent];
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-stone-300">
          {label}
        </span>
        <span className="min-w-[2.5rem] rounded-md bg-stone-800 px-2 py-0.5 text-center text-sm font-bold text-stone-100 tabular-nums">
          {Math.round(value)}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={
          "mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-800 outline-none disabled:cursor-not-allowed disabled:opacity-50 " +
          a.thumb
        }
        style={{
          background: `linear-gradient(to right, currentColor 0%, currentColor ${pct}%, rgba(120,113,108,0.3) ${pct}%, rgba(120,113,108,0.3) 100%)`,
          color: value > 0 ? (accent === "emerald" ? "#10b981" : accent === "amber" ? "#f59e0b" : accent === "sky" ? "#0ea5e9" : "#f43f5e") : "#57534e",
        }}
      />

      <div className="mt-1.5 flex items-center justify-between text-[0.65rem] text-stone-500">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
