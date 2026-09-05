import { useEffect, useState } from "react";
import {
  soundscapeEngine,
  SOUNDSCAPE_PRESETS,
  type BinauralMode,
  type TrackLevels,
} from "../lib/soundscapes";

export interface AmbientAtmosphereSelectorProps {
  className?: string;
  compact?: boolean;
}

export function AmbientAtmosphereSelector({
  className = "",
  compact = false,
}: AmbientAtmosphereSelectorProps) {
  const [status, setStatus] = useState(() => soundscapeEngine.getStatus());
  const [isExpanded, setIsExpanded] = useState(!compact);

  useEffect(() => {
    const unsub = soundscapeEngine.subscribe(() => {
      setStatus(soundscapeEngine.getStatus());
    });
    return unsub;
  }, []);

  const handleTogglePlay = () => {
    soundscapeEngine.toggle();
  };

  const handlePresetSelect = (presetId: string) => {
    soundscapeEngine.applyPreset(presetId);
    if (!status.isPlaying) {
      void soundscapeEngine.start();
    }
  };

  const handleTrackChange = (track: keyof TrackLevels, val: number) => {
    soundscapeEngine.setTrackLevel(track, val);
  };

  const handleBinauralModeChange = (mode: BinauralMode) => {
    soundscapeEngine.setBinauralMode(mode);
  };

  if (compact && !isExpanded) {
    return (
      <div className={"flex items-center gap-3 " + className}>
        <button
          onClick={handleTogglePlay}
          className={
            "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 " +
            (status.isPlaying
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              : "bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200")
          }
          title={status.isPlaying ? "Pause ambient soundscape" : "Start calming ambient soundscape"}
        >
          <span
            className={
              "inline-block h-2 w-2 rounded-full " +
              (status.isPlaying ? "bg-emerald-400 animate-pulse" : "bg-stone-500")
            }
          />
          {status.isPlaying ? "Ambience Playing" : "Acoustic Ambience"}
        </button>

        <button
          onClick={() => setIsExpanded(true)}
          className="text-xs text-stone-500 hover:text-stone-300 underline"
          title="Open multi-track sound controls"
        >
          Mixer
        </button>
      </div>
    );
  }

  return (
    <section
      className={
        "rounded-2xl border border-stone-800/80 bg-stone-900/60 backdrop-blur-md p-5 text-stone-200 " +
        className
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={
              "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 " +
              (status.isPlaying
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-stone-800 text-stone-400")
            }
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-stone-100">
              Acoustic / Ambient Atmosphere
            </h3>
            <p className="text-xs text-stone-400">
              Multi-track lyric-free soundscapes for somatic calming & focus
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            className={
              "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all " +
              (status.isPlaying
                ? "bg-emerald-500 text-stone-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                : "bg-stone-800 text-stone-200 hover:bg-stone-700")
            }
          >
            {status.isPlaying ? (
              <>
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                Play Soundscape
              </>
            )}
          </button>

          {compact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-800 hover:text-stone-300"
              title="Collapse mixer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Preset Profiles */}
      <div className="mt-4">
        <label className="text-[0.7rem] uppercase tracking-wider text-stone-500">
          Clinical Soundscape Presets
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SOUNDSCAPE_PRESETS.map((preset) => {
            const isSelected = status.activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={
                  "rounded-xl border p-2.5 text-left transition-all " +
                  (isSelected
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 shadow-sm"
                    : "border-stone-800 bg-stone-950/40 text-stone-400 hover:border-stone-700 hover:text-stone-300")
                }
              >
                <div className="text-xs font-medium">{preset.name}</div>
                <div className="mt-1 line-clamp-2 text-[0.65rem] text-stone-500">
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Track Mixer */}
      <div className="mt-5 rounded-xl border border-stone-800/60 bg-stone-950/50 p-4">
        <div className="mb-3 flex items-center justify-between text-xs font-medium text-stone-300">
          <span>Multi-Track Level Mixer</span>
          <div className="flex items-center gap-2">
            <span className="text-[0.7rem] text-stone-500">Binaural Wave:</span>
            <select
              value={status.binauralMode}
              onChange={(e) =>
                handleBinauralModeChange(e.target.value as BinauralMode)
              }
              className="rounded border border-stone-700 bg-stone-900 px-2 py-0.5 text-xs text-stone-300"
            >
              <option value="theta">Theta (6 Hz - Deep Calm)</option>
              <option value="alpha">Alpha (10 Hz - Flow/Focus)</option>
              <option value="delta">Delta (3.5 Hz - Grounding)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Binaural Tones */}
          <div>
            <div className="flex justify-between text-xs text-stone-400">
              <span>Binaural Carrier Beat</span>
              <span>{Math.round(status.trackLevels.binaural * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={status.trackLevels.binaural}
              onChange={(e) =>
                handleTrackChange("binaural", parseFloat(e.target.value))
              }
              className="mt-1 w-full accent-emerald-400"
            />
          </div>

          {/* Pink Noise */}
          <div>
            <div className="flex justify-between text-xs text-stone-400">
              <span>Pink Noise (1/f Rain Spectrum)</span>
              <span>{Math.round(status.trackLevels.pinkNoise * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={status.trackLevels.pinkNoise}
              onChange={(e) =>
                handleTrackChange("pinkNoise", parseFloat(e.target.value))
              }
              className="mt-1 w-full accent-emerald-400"
            />
          </div>

          {/* White Noise */}
          <div>
            <div className="flex justify-between text-xs text-stone-400">
              <span>White Noise (Gentle Masking)</span>
              <span>{Math.round(status.trackLevels.whiteNoise * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={status.trackLevels.whiteNoise}
              onChange={(e) =>
                handleTrackChange("whiteNoise", parseFloat(e.target.value))
              }
              className="mt-1 w-full accent-emerald-400"
            />
          </div>

          {/* Deep Grounding Drone */}
          <div>
            <div className="flex justify-between text-xs text-stone-400">
              <span>Deep Harmonic Drone</span>
              <span>{Math.round(status.trackLevels.deepDrone * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={status.trackLevels.deepDrone}
              onChange={(e) =>
                handleTrackChange("deepDrone", parseFloat(e.target.value))
              }
              className="mt-1 w-full accent-emerald-400"
            />
          </div>
        </div>

        {/* Master Controls */}
        <div className="mt-4 flex items-center justify-between border-t border-stone-800/80 pt-3 text-xs">
          <button
            onClick={() => soundscapeEngine.toggleMute()}
            className={
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition " +
              (status.isMuted
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-stone-400 hover:text-stone-200")
            }
          >
            {status.isMuted ? "Unmute Master" : "Mute Soundscape"}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-stone-500">Master Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={status.masterVolume}
              onChange={(e) =>
                soundscapeEngine.setMasterVolume(parseFloat(e.target.value))
              }
              className="w-28 accent-emerald-400"
            />
            <span className="w-8 text-right text-stone-400">
              {Math.round(status.masterVolume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
