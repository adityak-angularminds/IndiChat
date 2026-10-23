/**
 * Web Audio API synthesizer for realistic call tones.
 * Generates telephone ringback, incoming melodic ring, and call ended tones
 * with zero external assets or network dependencies.
 */

class CallAudioManager {
  private audioCtx: AudioContext | null = null;
  private ringOsc1: OscillatorNode | null = null;
  private ringOsc2: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;
  private ringInterval: number | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Realistic outgoing ringback tone: 440Hz + 480Hz dual tone (US standard PBX)
   * Plays 1.5s ON, 3s OFF until stopped.
   */
  public playOutgoingRing() {
    this.stopAll();
    try {
      const ctx = this.getAudioContext();

      const startBurst = () => {
        if (!this.audioCtx || this.audioCtx.state === 'closed') return;
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        gain.gain.setValueAtTime(0.08, now + 1.4);
        gain.gain.linearRampToValueAtTime(0, now + 1.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.5);
        osc2.stop(now + 1.5);
      };

      startBurst();
      this.ringInterval = window.setInterval(startBurst, 4500);
    } catch (e) {
      console.warn('Call Audio ringback error:', e);
    }
  }

  /**
   * Melodic incoming call ring tone: elegant WhatsApp-like double chime
   */
  public playIncomingRing() {
    this.stopAll();
    try {
      const ctx = this.getAudioContext();

      const chimeNotes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const playMelody = () => {
        if (!this.audioCtx || this.audioCtx.state === 'closed') return;
        const now = ctx.currentTime;

        chimeNotes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteTime = now + idx * 0.16;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0, noteTime);
          gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + 0.36);
        });
      };

      playMelody();
      this.ringInterval = window.setInterval(playMelody, 3000);
    } catch (e) {
      console.warn('Call Audio incoming ring error:', e);
    }
  }

  /**
   * Play short call ended tone
   */
  public playHangupTone() {
    this.stopAll();
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      [480, 480].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const time = now + idx * 0.22;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.09, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.16);
      });
    } catch (e) {
      console.warn('Call Audio hangup tone error:', e);
    }
  }

  public stopAll() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    if (this.ringOsc1) {
      try { this.ringOsc1.stop(); } catch {}
      this.ringOsc1 = null;
    }
    if (this.ringOsc2) {
      try { this.ringOsc2.stop(); } catch {}
      this.ringOsc2 = null;
    }
  }
}

export const callAudio = new CallAudioManager();
