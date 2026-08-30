/**
 * NarrativeRebuild — Acoustic / Ambient Atmosphere Sound Engine (Module 4, Member 1).
 *
 * Procedural multi-track audio engine built on the Web Audio API.
 * Generates lyric-free, non-distracting soundscapes in real time without
 * requiring external audio downloads or network requests:
 *  - Binaural Beats (Theta 6Hz for deep somatic calming / Alpha 10Hz for cognitive focus)
 *  - Pink Noise (1/f natural soothing rain-like spectrum)
 *  - White Noise (gentle lowpass-masked focus noise)
 *  - Brownian / Deep Ambient Drone (warm harmonic grounding resonance)
 *
 * Provides multi-track mixing with independent channel gains and clinical presets.
 */

export interface TrackLevels {
  binaural: number;
  pinkNoise: number;
  whiteNoise: number;
  deepDrone: number;
}

export type BinauralMode = "theta" | "alpha" | "delta";

export interface SoundscapePreset {
  id: string;
  name: string;
  description: string;
  binauralMode: BinauralMode;
  levels: TrackLevels;
}

export const SOUNDSCAPE_PRESETS: SoundscapePreset[] = [
  {
    id: "theta-calm",
    name: "Theta Somatic Calm (6 Hz)",
    description: "Gentle binaural theta waves with soft pink noise to lower physiological arousal.",
    binauralMode: "theta",
    levels: { binaural: 0.75, pinkNoise: 0.55, whiteNoise: 0.0, deepDrone: 0.35 },
  },
  {
    id: "alpha-flow",
    name: "Alpha Cognitive Flow (10 Hz)",
    description: "Alpha frequency offset tuned for alert yet grounded stream-of-consciousness writing.",
    binauralMode: "alpha",
    levels: { binaural: 0.8, pinkNoise: 0.35, whiteNoise: 0.25, deepDrone: 0.2 },
  },
  {
    id: "pink-rain",
    name: "Soothing Pink Rain",
    description: "Natural 1/f acoustic blanket masking room distractions without intrusive tones.",
    binauralMode: "theta",
    levels: { binaural: 0.2, pinkNoise: 0.85, whiteNoise: 0.1, deepDrone: 0.4 },
  },
  {
    id: "deep-grounding",
    name: "Deep Earth Drone & White Noise",
    description: "Low-frequency grounding drone paired with soft noise for emotional containment.",
    binauralMode: "delta",
    levels: { binaural: 0.3, pinkNoise: 0.4, whiteNoise: 0.45, deepDrone: 0.8 },
  },
];

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private isRunning = false;
  private masterVolume = 0.7;
  private isMuted = false;

  private masterGain: GainNode | null = null;

  // Track Gains
  private binauralGain: GainNode | null = null;
  private pinkGain: GainNode | null = null;
  private whiteGain: GainNode | null = null;
  private droneGain: GainNode | null = null;

  // Oscillators & Nodes
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private pinkSource: AudioBufferSourceNode | null = null;
  private whiteSource: AudioBufferSourceNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;

  private trackLevels: TrackLevels = {
    binaural: 0.7,
    pinkNoise: 0.5,
    whiteNoise: 0.2,
    deepDrone: 0.35,
  };

  private binauralMode: BinauralMode = "theta";
  private activePresetId: string = "theta-calm";
  private listeners: Array<() => void> = [];

  public getStatus() {
    return {
      isPlaying: this.isRunning,
      masterVolume: this.masterVolume,
      isMuted: this.isMuted,
      trackLevels: { ...this.trackLevels },
      binauralMode: this.binauralMode,
      activePresetId: this.activePresetId,
    };
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    for (const fn of this.listeners) {
      try {
        fn();
      } catch {
        // ignore
      }
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    const ctx = this.getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const now = ctx.currentTime;

    // Master Gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(
      this.isMuted ? 0 : this.masterVolume,
      now
    );
    this.masterGain.connect(ctx.destination);

    // 1. Binaural Beats Engine
    this.setupBinauralBeats(ctx);

    // 2. Pink Noise Engine
    this.setupPinkNoise(ctx);

    // 3. White Noise Engine
    this.setupWhiteNoise(ctx);

    // 4. Grounding Drone Engine
    this.setupDeepDrone(ctx);

    this.isRunning = true;
    this.notify();
  }

  public stop(): void {
    if (!this.isRunning || !this.ctx) return;

    try {
      this.leftOsc?.stop();
      this.rightOsc?.stop();
      this.pinkSource?.stop();
      this.whiteSource?.stop();
      this.droneOsc1?.stop();
      this.droneOsc2?.stop();
    } catch {
      // ignore already stopped nodes
    }

    this.leftOsc = null;
    this.rightOsc = null;
    this.pinkSource = null;
    this.whiteSource = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;

    this.isRunning = false;
    this.notify();
  }

  public toggle(): void {
    if (this.isRunning) {
      this.stop();
    } else {
      void this.start();
    }
  }

  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.masterVolume,
        this.ctx.currentTime,
        0.05
      );
    }
    this.notify();
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.masterVolume,
        this.ctx.currentTime,
        0.05
      );
    }
    this.notify();
  }

  public setTrackLevel(track: keyof TrackLevels, val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.trackLevels[track] = clamped;
    this.activePresetId = "custom";

    if (!this.ctx) {
      this.notify();
      return;
    }

    const t = this.ctx.currentTime;
    switch (track) {
      case "binaural":
        this.binauralGain?.gain.setTargetAtTime(clamped * 0.4, t, 0.05);
        break;
      case "pinkNoise":
        this.pinkGain?.gain.setTargetAtTime(clamped * 0.35, t, 0.05);
        break;
      case "whiteNoise":
        this.whiteGain?.gain.setTargetAtTime(clamped * 0.25, t, 0.05);
        break;
      case "deepDrone":
        this.droneGain?.gain.setTargetAtTime(clamped * 0.35, t, 0.05);
        break;
    }
    this.notify();
  }

  public applyPreset(presetId: string): void {
    const preset = SOUNDSCAPE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    this.activePresetId = preset.id;
    this.binauralMode = preset.binauralMode;
    this.trackLevels = { ...preset.levels };

    if (this.isRunning && this.ctx) {
      this.updateBinauralFrequencies();
      const t = this.ctx.currentTime;
      this.binauralGain?.gain.setTargetAtTime(preset.levels.binaural * 0.4, t, 0.1);
      this.pinkGain?.gain.setTargetAtTime(preset.levels.pinkNoise * 0.35, t, 0.1);
      this.whiteGain?.gain.setTargetAtTime(preset.levels.whiteNoise * 0.25, t, 0.1);
      this.droneGain?.gain.setTargetAtTime(preset.levels.deepDrone * 0.35, t, 0.1);
    }
    this.notify();
  }

  public setBinauralMode(mode: BinauralMode): void {
    this.binauralMode = mode;
    this.updateBinauralFrequencies();
    this.notify();
  }

  private getBeatOffset(mode: BinauralMode): number {
    switch (mode) {
      case "delta":
        return 3.5; // 3.5 Hz deep relaxation
      case "theta":
        return 6.0; // 6 Hz somatic processing / calm
      case "alpha":
        return 10.0; // 10 Hz calm focus
    }
  }

  private updateBinauralFrequencies(): void {
    if (!this.leftOsc || !this.rightOsc || !this.ctx) return;
    const baseFreq = 216; // Soothing harmonic carrier tone
    const offset = this.getBeatOffset(this.binauralMode);
    const t = this.ctx.currentTime;
    this.leftOsc.frequency.setTargetAtTime(baseFreq, t, 0.1);
    this.rightOsc.frequency.setTargetAtTime(baseFreq + offset, t, 0.1);
  }

  // --- Track Setup Implementations ---

  private setupBinauralBeats(ctx: AudioContext): void {
    if (!this.masterGain) return;
    const baseFreq = 216;
    const offset = this.getBeatOffset(this.binauralMode);

    this.binauralGain = ctx.createGain();
    this.binauralGain.gain.setValueAtTime(
      this.trackLevels.binaural * 0.4,
      ctx.currentTime
    );

    // Channel merger for true stereo left/right separation
    const merger = ctx.createChannelMerger(2);

    const leftOsc = ctx.createOscillator();
    leftOsc.type = "sine";
    leftOsc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

    const rightOsc = ctx.createOscillator();
    rightOsc.type = "sine";
    rightOsc.frequency.setValueAtTime(baseFreq + offset, ctx.currentTime);

    leftOsc.connect(merger, 0, 0); // connect to left output channel
    rightOsc.connect(merger, 0, 1); // connect to right output channel

    // Lowpass filter to ensure tone is mellow and soothing
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    merger.connect(filter);
    filter.connect(this.binauralGain);
    this.binauralGain.connect(this.masterGain);

    leftOsc.start();
    rightOsc.start();

    this.leftOsc = leftOsc;
    this.rightOsc = rightOsc;
  }

  private setupPinkNoise(ctx: AudioContext): void {
    if (!this.masterGain) return;
    const bufferSize = 5 * ctx.sampleRate; // 5 seconds looped buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    // Paul Kellet's filter method for accurate 1/f Pink Noise
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, ctx.currentTime);

    this.pinkGain = ctx.createGain();
    this.pinkGain.gain.setValueAtTime(
      this.trackLevels.pinkNoise * 0.35,
      ctx.currentTime
    );

    noiseSource.connect(filter);
    filter.connect(this.pinkGain);
    this.pinkGain.connect(this.masterGain);

    noiseSource.start();
    this.pinkSource = noiseSource;
  }

  private setupWhiteNoise(ctx: AudioContext): void {
    if (!this.masterGain) return;
    const bufferSize = 4 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const whiteSource = ctx.createBufferSource();
    whiteSource.buffer = buffer;
    whiteSource.loop = true;

    // Filter to avoid harsh highs
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.Q.setValueAtTime(0.8, ctx.currentTime);

    this.whiteGain = ctx.createGain();
    this.whiteGain.gain.setValueAtTime(
      this.trackLevels.whiteNoise * 0.25,
      ctx.currentTime
    );

    whiteSource.connect(filter);
    filter.connect(this.whiteGain);
    this.whiteGain.connect(this.masterGain);

    whiteSource.start();
    this.whiteSource = whiteSource;
  }

  private setupDeepDrone(ctx: AudioContext): void {
    if (!this.masterGain) return;

    this.droneGain = ctx.createGain();
    this.droneGain.gain.setValueAtTime(
      this.trackLevels.deepDrone * 0.35,
      ctx.currentTime
    );

    // Warm grounding harmonic drone: fundamental (108 Hz) + fifth (162 Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(108, ctx.currentTime);

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(162, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(250, ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    osc1.start();
    osc2.start();

    this.droneOsc1 = osc1;
    this.droneOsc2 = osc2;
  }
}

export const soundscapeEngine = new SoundscapeEngine();
