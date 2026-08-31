export const BODY_SENSATIONS = [
  "Chest tightness or constriction",
  "Shallow / rapid breathing",
  "Shoulder or neck tension",
  "Jaw clenching / teeth gritting",
  "Stomach knotting / nausea",
  "Lump in throat / difficulty speaking",
  "Warmth / release of heaviness",
  "Tears / eye burning",
  "Lethargy or heavy limbs",
  "Grounded calm / deep breathing",
];

export interface SomatizationFormProps {
  selectedSensations?: string[];
  onChange: (sensations: string[]) => void;
  className?: string;
}

export function SomatizationForm({
  selectedSensations = [],
  onChange,
  className = "",
}: SomatizationFormProps) {
  const toggleSensation = (item: string) => {
    if (selectedSensations.includes(item)) {
      onChange(selectedSensations.filter((s) => s !== item));
    } else {
      onChange([...selectedSensations, item]);
    }
  };

  return (
    <div className={"p-6 bg-stone-950/70 border border-stone-800 rounded-3xl space-y-4 shadow-sm text-left " + className}>
      <div className="flex items-center space-x-2.5">
        <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <div>
          <h3 className="text-sm font-extrabold text-stone-100">Somatization Reflection (Bodily Awareness)</h3>
          <p className="text-xs text-stone-400">Select any physical sensations experienced while writing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {BODY_SENSATIONS.map((item) => {
          const isSelected = selectedSensations.includes(item);
          return (
            <button
              type="button"
              key={item}
              onClick={() => toggleSensation(item)}
              className={`p-2.5 rounded-xl text-left text-xs transition flex items-center justify-between border ${
                isSelected
                  ? "bg-rose-950/60 border-rose-700 text-rose-100 font-bold"
                  : "bg-stone-900/60 border-stone-800/80 text-stone-400 hover:bg-stone-800/60 hover:text-stone-300"
              }`}
            >
              <span>{item}</span>
              {isSelected && (
                <svg className="w-3.5 h-3.5 text-rose-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
