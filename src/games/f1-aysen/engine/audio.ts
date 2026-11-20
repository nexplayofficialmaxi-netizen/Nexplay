import { AudioSettings } from '../types/game';

class RacingAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineBusGain: GainNode | null = null;
  private tiresBusGain: GainNode | null = null;
  private effectsBusGain: GainNode | null = null;

  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSub: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private tireNoiseNode: AudioBufferSourceNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;
  private tireGain: GainNode | null = null;
  private driftOsc: OscillatorNode | null = null;
  private driftSquealGain: GainNode | null = null;

  private muted = false;
  private masterVolume = 0.8;
  private engineVolume = 0.85;
  private tiresVolume = 0.85;
  private effectsVolume = 0.9;
  private running = false;
  private lastGear = 1;

  public isMuted(): boolean {
    return this.muted;
  }

  public getAudioSettings(): AudioSettings {
    return {
      muted: this.muted,
      masterVolume: Math.round(this.masterVolume * 100),
      engineVolume: Math.round(this.engineVolume * 100),
      tiresVolume: Math.round(this.tiresVolume * 100),
      effectsVolume: Math.round(this.effectsVolume * 100),
    };
  }

  private syncBusGains(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.masterVolume * 0.45,
        now,
        0.04
      );
    }
    if (this.engineBusGain) {
      this.engineBusGain.gain.setTargetAtTime(this.engineVolume, now, 0.04);
    }
    if (this.tiresBusGain) {
      this.tiresBusGain.gain.setTargetAtTime(this.tiresVolume, now, 0.04);
    }
    if (this.effectsBusGain) {
      this.effectsBusGain.gain.setTargetAtTime(this.effectsVolume, now, 0.04);
    }
  }

  public applyAudioSettings(settings: AudioSettings): void {
    this.muted = Boolean(settings.muted);
    this.masterVolume = Math.max(0, Math.min(1, settings.masterVolume / 100));
    this.engineVolume = Math.max(0, Math.min(1, settings.engineVolume / 100));
    this.tiresVolume = Math.max(0, Math.min(1, settings.tiresVolume / 100));
    this.effectsVolume = Math.max(0, Math.min(1, settings.effectsVolume / 100));
    this.syncBusGains();
  }

  public setMuted(m: boolean): void {
    this.muted = m;
    this.syncBusGains();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.masterVolume * 0.45;
      this.masterGain.connect(this.ctx.destination);

      this.engineBusGain = this.ctx.createGain();
      this.engineBusGain.gain.value = this.engineVolume;
      this.engineBusGain.connect(this.masterGain);

      this.tiresBusGain = this.ctx.createGain();
      this.tiresBusGain.gain.value = this.tiresVolume;
      this.tiresBusGain.connect(this.masterGain);

      this.effectsBusGain = this.ctx.createGain();
      this.effectsBusGain.gain.value = this.effectsVolume;
      this.effectsBusGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public startEngine(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.engineBusGain || !this.tiresBusGain || this.running) return;

    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 520;
    this.engineFilter.Q.value = 3.2;

    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0.08;

    this.engineOsc1 = ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.value = 85;

    this.engineOsc2 = ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.value = 170;

    this.engineSub = ctx.createOscillator();
    this.engineSub.type = 'sine';
    this.engineSub.frequency.value = 42.5;

    const subGain = ctx.createGain();
    subGain.gain.value = 0.5;

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineSub.connect(subGain);
    subGain.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.engineBusGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineSub.start();

    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.tireNoiseNode = ctx.createBufferSource();
    this.tireNoiseNode.buffer = noiseBuffer;
    this.tireNoiseNode.loop = true;

    this.tireFilter = ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.value = 1450;
    this.tireFilter.Q.value = 2.4;

    this.tireGain = ctx.createGain();
    this.tireGain.gain.value = 0;

    this.tireNoiseNode.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.tiresBusGain);
    this.tireNoiseNode.start();

    this.driftOsc = ctx.createOscillator();
    this.driftOsc.type = 'triangle';
    this.driftOsc.frequency.value = 790;

    this.driftSquealGain = ctx.createGain();
    this.driftSquealGain.gain.value = 0;

    this.driftOsc.connect(this.driftSquealGain);
    this.driftSquealGain.connect(this.tiresBusGain);
    this.driftOsc.start();

    this.running = true;
  }

  public updateTelemetry(
    rpm: number,
    gear: number,
    throttle: boolean,
    slip: number,
    drsActive: boolean,
    isDrifting = false
  ): void {
    if (
      !this.running ||
      !this.ctx ||
      !this.engineOsc1 ||
      !this.engineOsc2 ||
      !this.engineSub ||
      !this.engineFilter ||
      !this.engineGain ||
      !this.tireGain
    ) {
      return;
    }

    const now = this.ctx.currentTime;
    const normRpm = Math.max(0.15, Math.min(1.1, rpm / 13500));
    const baseFreq = 62 + normRpm * 215 + (drsActive ? 18 : 0);

    if (gear > this.lastGear) {
      this.engineGain.gain.setValueAtTime(0.03, now);
      this.engineGain.gain.exponentialRampToValueAtTime(
        throttle ? 0.24 : 0.11,
        now + 0.07
      );
    }
    this.lastGear = gear;

    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.03);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.99, now, 0.03);
    this.engineSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.03);

    const filterFreq = 320 + normRpm * 1650 + (throttle ? 480 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.04);

    const targetGain = throttle ? 0.16 + normRpm * 0.11 : 0.07 + normRpm * 0.04;
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);

    const driftBoost = isDrifting ? Math.max(0.95, slip) : slip;
    const targetTire = isDrifting
      ? Math.min(0.46, 0.28 + driftBoost * 0.16)
      : Math.min(0.22, Math.max(0, slip * 0.18));
    this.tireGain.gain.setTargetAtTime(targetTire, now, 0.035);

    if (this.tireFilter) {
      this.tireFilter.frequency.setTargetAtTime(
        isDrifting ? 1550 + Math.sin(now * 28) * 180 : 1200,
        now,
        0.04
      );
    }

    if (this.driftOsc && this.driftSquealGain) {
      const squealFreq =
        760 + Math.sin(now * 22) * 55 + Math.min(240, driftBoost * 110);
      this.driftOsc.frequency.setTargetAtTime(squealFreq, now, 0.03);
      const targetSqueal = isDrifting
        ? 0.085
        : slip > 0.65
          ? (slip - 0.65) * 0.08
          : 0;
      this.driftSquealGain.gain.setTargetAtTime(targetSqueal, now, 0.035);
    }
  }

  public playLightBeep(isGo = false): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.effectsBusGain || this.muted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = isGo ? 880 : 440;

    const now = ctx.currentTime;
    const dur = isGo ? 0.42 : 0.16;
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.effectsBusGain);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  public playLapChime(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.effectsBusGain || this.muted) return;
    const notes = [587.33, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = ctx.currentTime + idx * 0.09;
      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(gain);
      gain.connect(this.effectsBusGain!);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  }

  public playPitCrewSound(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.effectsBusGain || this.muted) return;
    const times = [0, 0.14, 0.28];
    times.forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 2 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(
        idx === 2 ? 784 : 320 + idx * 90,
        ctx.currentTime + offset
      );
      osc.frequency.exponentialRampToValueAtTime(
        idx === 2 ? 1046 : 640,
        ctx.currentTime + offset + 0.11
      );
      gain.gain.setValueAtTime(0.15, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + offset + 0.12
      );
      osc.connect(gain);
      gain.connect(this.effectsBusGain!);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.13);
    });
  }

  public playTestSound(channel: 'engine' | 'drift' | 'effects' = 'effects'): void {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;

    if (channel === 'effects') {
      this.playPitCrewSound();
      return;
    }

    const now = ctx.currentTime;
    if (channel === 'engine' && this.engineBusGain) {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(255, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.65);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.exponentialRampToValueAtTime(1850, now + 0.35);
      filter.Q.value = 3.0;

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.engineBusGain);
      osc.start(now);
      osc.stop(now + 0.7);
      return;
    }

    if (channel === 'drift' && this.tiresBusGain) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(840, now);
      osc.frequency.linearRampToValueAtTime(920, now + 0.2);
      osc.frequency.linearRampToValueAtTime(770, now + 0.45);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      osc.connect(gain);
      gain.connect(this.tiresBusGain);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  }

  public stopEngine(): void {
    if (!this.running) return;
    try {
      this.engineOsc1?.stop();
      this.engineOsc2?.stop();
      this.engineSub?.stop();
      this.tireNoiseNode?.stop();
      this.driftOsc?.stop();
    } catch {
      // already stopped
    }
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineSub = null;
    this.tireNoiseNode = null;
    this.driftOsc = null;
    this.driftSquealGain = null;
    this.running = false;
  }
}

export const audioEngine = new RacingAudioEngine();
