/**
 * Tiny synthesised sound effects using the Web Audio API. There are no audio files to ship.
 * To use real recordings later, swap the bodies of `play()` cases for AudioBuffer playback.
 */
export type SoundId =
    | 'arrow' | 'cannon' | 'magic' | 'ice' | 'musket' | 'fire'
    | 'explode' | 'coin' | 'leak' | 'place' | 'upgrade' | 'sell' | 'error'
    | 'waveStart' | 'waveClear' | 'boss' | 'victory' | 'defeat' | 'click';

export class SoundSystem {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private noiseBuffer: AudioBuffer | null = null;
    enabled = true;
    /** Per-sound throttle so 50 archers firing at once do not clip. */
    private lastPlayed = new Map<SoundId, number>();

    /** Must be called from a user gesture on mobile browsers. */
    unlock(): void {
        if (!this.ctx) {
            const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AC) return;
            this.ctx = new AC();
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.35;
            this.master.connect(this.ctx.destination);
            const len = this.ctx.sampleRate * 0.5;
            this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
            const data = this.noiseBuffer.getChannelData(0);
            for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        }
        if (this.ctx.state === 'suspended') void this.ctx.resume();
    }

    private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, slideTo?: number, delay = 0): void {
        const ctx = this.ctx!;
        const t0 = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(g).connect(this.master!);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
    }

    private noise(dur: number, vol = 0.3, filterFreq = 1200, type: BiquadFilterType = 'lowpass', delay = 0): void {
        const ctx = this.ctx!;
        const t0 = ctx.currentTime + delay;
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = filterFreq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        src.connect(filter).connect(g).connect(this.master!);
        src.start(t0);
        src.stop(t0 + dur);
    }

    play(id: SoundId, minGapMs = 60): void {
        if (!this.enabled || !this.ctx || !this.master || this.ctx.state !== 'running') return;
        const now = performance.now();
        if (now - (this.lastPlayed.get(id) ?? 0) < minGapMs) return;
        this.lastPlayed.set(id, now);
        switch (id) {
            case 'arrow': this.noise(0.08, 0.12, 3000, 'highpass'); break;
            case 'cannon': this.tone(110, 0.25, 'triangle', 0.35, 45); this.noise(0.2, 0.25, 600); break;
            case 'magic': this.tone(660, 0.18, 'sine', 0.15, 990); break;
            case 'ice': this.tone(1400, 0.1, 'triangle', 0.1, 900); break;
            case 'musket': this.noise(0.15, 0.35, 1800); this.tone(180, 0.1, 'square', 0.08, 80); break;
            case 'fire': this.noise(0.25, 0.15, 900, 'bandpass'); break;
            case 'explode': this.noise(0.35, 0.35, 500); this.tone(70, 0.3, 'sine', 0.3, 35); break;
            case 'coin': this.tone(1320, 0.08, 'square', 0.06); this.tone(1760, 0.1, 'square', 0.06, undefined, 0.06); break;
            case 'leak': this.tone(220, 0.3, 'sawtooth', 0.15, 110); break;
            case 'place': this.tone(300, 0.12, 'triangle', 0.25, 160); this.noise(0.12, 0.15, 700); break;
            case 'upgrade': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.15, undefined, i * 0.06)); break;
            case 'sell': this.tone(880, 0.1, 'square', 0.06, 440); break;
            case 'error': this.tone(160, 0.15, 'square', 0.1, 120); break;
            case 'click': this.tone(900, 0.04, 'triangle', 0.08); break;
            case 'waveStart':
                // Mehter-style drum hits and a horn.
                [0, 0.18, 0.36].forEach((d) => { this.tone(90, 0.2, 'sine', 0.45, 50, d); this.noise(0.08, 0.15, 400, 'lowpass', d); });
                this.tone(392, 0.5, 'sawtooth', 0.08, 392, 0.5);
                break;
            case 'waveClear': [392, 494, 587, 784].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.14, undefined, i * 0.1)); break;
            case 'boss':
                [0, 0.3, 0.6, 0.9].forEach((d) => this.tone(70, 0.35, 'sine', 0.5, 40, d));
                this.tone(196, 1.2, 'sawtooth', 0.1, 185, 0.2);
                break;
            case 'victory': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.16, undefined, i * 0.15)); break;
            case 'defeat': [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.4, 'sawtooth', 0.1, undefined, i * 0.25)); break;
        }
    }
}

export const sound = new SoundSystem();
