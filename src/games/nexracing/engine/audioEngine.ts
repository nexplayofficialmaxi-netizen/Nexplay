// Procedural Web Audio API sound synthesizer for V8 NASCAR engine, tire screech, crashes, pit wheel-guns, and race cues.

export class RaceAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private oscPrimary: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private oscGrowl: OscillatorNode | null = null;
  private tireGain: GainNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;
  private tireSource: AudioBufferSourceNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private volume = 0.65;
  private muted = false;
  private started = false;

  public setSettings(volume: number, muted: boolean) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.volume * 0.45,
        this.ctx.currentTime,
        0.04,
      );
    }
  }

  public init() {
    if (this.started) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      this.ctx = ctx;

      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : this.volume * 0.45;
      master.connect(ctx.destination);
      this.masterGain = master;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 340;
      filter.Q.value = 2.4;

      const engGain = ctx.createGain();
      engGain.gain.value = 0.0;
      filter.connect(engGain);
      engGain.connect(master);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.value = 55;

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = 27.5;

      const osc3 = ctx.createOscillator();
      osc3.type = 'sawtooth';
      osc3.frequency.value = 82.5;
      osc3.detune.value = 14;

      const g1 = ctx.createGain();
      g1.gain.value = 0.35;
      const g2 = ctx.createGain();
      g2.gain.value = 0.45;
      const g3 = ctx.createGain();
      g3.gain.value = 0.2;

      osc1.connect(g1);
      osc2.connect(g2);
      osc3.connect(g3);
      g1.connect(filter);
      g2.connect(filter);
      g3.connect(filter);

      osc1.start();
      osc2.start();
      osc3.start();

      this.engineFilter = filter;
      this.engineGain = engGain;
      this.oscPrimary = osc1;
      this.oscSub = osc2;
      this.oscGrowl = osc3;

      const bufferSize = ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = noiseBuffer;

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const tireFilter = ctx.createBiquadFilter();
      tireFilter.type = 'bandpass';
      tireFilter.frequency.value = 1350;
      tireFilter.Q.value = 4.2;

      const tireGain = ctx.createGain();
      tireGain.gain.value = 0;

      noise.connect(tireFilter);
      tireFilter.connect(tireGain);
      tireGain.connect(master);
      noise.start();

      this.tireSource = noise;
      this.tireFilter = tireFilter;
      this.tireGain = tireGain;
      this.started = true;
    } catch {
      // Audio unavailable
    }
  }

  public updateEngine(rpm: number, throttle: number, slip: number) {
    if (
      !this.started ||
      !this.ctx ||
      !this.oscPrimary ||
      !this.oscSub ||
      !this.oscGrowl ||
      !this.engineFilter ||
      !this.engineGain ||
      !this.tireGain
    ) {
      return;
    }
    const now = this.ctx.currentTime;
    const clampedRpm = Math.max(1000, Math.min(9200, rpm));
    const baseHz = 38 + (clampedRpm / 9000) * 145;

    this.oscPrimary.frequency.setTargetAtTime(baseHz, now, 0.03);
    this.oscSub.frequency.setTargetAtTime(baseHz * 0.5, now, 0.03);
    this.oscGrowl.frequency.setTargetAtTime(baseHz * 1.49, now, 0.03);

    const filterFreq = 220 + (clampedRpm / 9000) * 1400 + throttle * 450;
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.04);

    const targetEngGain = 0.22 + throttle * 0.22 + (clampedRpm / 9000) * 0.14;
    this.engineGain.gain.setTargetAtTime(targetEngGain, now, 0.05);

    const tireLevel = Math.max(0, Math.min(0.28, slip * 0.28));
    this.tireGain.gain.setTargetAtTime(tireLevel, now, 0.04);
    if (this.tireFilter) {
      this.tireFilter.frequency.setTargetAtTime(1100 + slip * 550, now, 0.05);
    }
  }

  public playCountdownBeep(isGo: boolean) {
    if (!this.started || !this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isGo ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.45 : 0.2));

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + (isGo ? 0.48 : 0.22));
  }

  public playImpact(strength = 0.5) {
    if (!this.started || !this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.2);

    gain.gain.setValueAtTime(Math.min(0.6, strength * 0.55), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.24);

    // Metallic crunch burst for heavy accidents
    if (strength > 0.55 && this.noiseBuffer) {
      const burst = this.ctx.createBufferSource();
      burst.buffer = this.noiseBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(650, now);
      bp.Q.value = 1.6;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(Math.min(0.5, strength * 0.45), now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      burst.connect(bp);
      bp.connect(nGain);
      nGain.connect(this.masterGain);
      burst.start(now);
      burst.stop(now + 0.36);
    }
  }

  public playPitWheelGun() {
    if (!this.started || !this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    [0, 0.16, 0.38, 0.54].forEach((offset) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(620, now + offset);
      osc.frequency.exponentialRampToValueAtTime(1180, now + offset + 0.09);
      gain.gain.setValueAtTime(0.18, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.11);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.12);
    });
  }

  public playLapChime() {
    if (!this.started || !this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.2, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.24);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.26);
    });
  }

  public playTeleport() {
    if (!this.started || !this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.28);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(560, now);
    osc2.frequency.exponentialRampToValueAtTime(1980, now + 0.28);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.36);
    osc2.stop(now + 0.36);
  }

  public dispose() {
    try {
      this.oscPrimary?.stop();
      this.oscSub?.stop();
      this.oscGrowl?.stop();
      this.tireSource?.stop();
      this.ctx?.close();
    } catch {
      // ignore
    }
    this.started = false;
    this.ctx = null;
  }
}
