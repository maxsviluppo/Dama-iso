
class SoundService {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createGain(startTime: number, duration: number, startValue: number = 0.1) {
    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(startValue, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    gain.connect(this.ctx!.destination);
    return gain;
  }

  playSelect() {
    this.initContext();
    const now = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.createGain(now, 0.1, 0.05);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playMove() {
    this.initContext();
    const now = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.createGain(now, 0.2, 0.1);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playCapture() {
    this.initContext();
    const now = this.ctx!.currentTime;
    
    // Low thud
    const osc1 = this.ctx!.createOscillator();
    const gain1 = this.createGain(now, 0.3, 0.2);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.exponentialRampToValueAtTime(60, now + 0.3);
    osc1.connect(gain1);
    
    // High click
    const osc2 = this.ctx!.createOscillator();
    const gain2 = this.createGain(now, 0.05, 0.1);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1000, now);
    osc2.connect(gain2);

    osc1.start(now);
    osc1.stop(now + 0.3);
    osc2.start(now);
    osc2.stop(now + 0.05);
  }

  playKing() {
    this.initContext();
    const now = this.ctx!.currentTime;
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    frequencies.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.createGain(now + i * 0.05, 0.6, 0.05);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      osc.connect(gain);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.6);
    });
  }
}

export const soundService = new SoundService();
