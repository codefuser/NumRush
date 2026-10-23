class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    // Read saved preference from localStorage
    const savedMute = localStorage.getItem('numrush_sound_muted');
    if (savedMute !== null) {
      this.muted = savedMute === 'true';
    }
  }

  private getAudioContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    localStorage.setItem('numrush_sound_muted', String(muted));
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // 1. Countdown Tick
  public playCountdown(isGo: boolean = false) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isGo ? 'triangle' : 'sine';
    const now = ctx.currentTime;
    const freq = isGo ? 880 : 440; // A5 for GO, A4 for tick

    osc.frequency.setValueAtTime(freq, now);
    if (isGo) {
      osc.frequency.exponentialRampToValueAtTime(1174, now + 0.2); // Up to D6
    }

    gain.gain.setValueAtTime(this.volume * (isGo ? 0.6 : 0.3), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.4 : 0.15));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + (isGo ? 0.45 : 0.18));
  }

  // 2. Correct Number Claim Chime (Ascending dual-tone)
  public playCorrect() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5

    osc2.frequency.setValueAtTime(659.25, now + 0.05); // E5
    osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18); // C6

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.05);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }

  // 3. Wrong Click (Subtle bass buzz)
  public playWrong() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.15);

    gain.gain.setValueAtTime(this.volume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // 4. Target Advanced Notification
  public playTargetPing() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  // 5. Victory Fanfare
  public playVictory() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const startTime = now + index * 0.12;
      const duration = index === notes.length - 1 ? 0.6 : 0.2;

      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(this.volume * 0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  }
}

export const soundManager = new SoundEffectsManager();
