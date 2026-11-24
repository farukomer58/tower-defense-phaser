import Phaser from 'phaser';
import { DEPTH } from './WorldRenderer';

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;

/** Particle bursts, floating text and other short-lived visual effects. */
export class Effects {
    private dust: Emitter;
    private spark: Emitter;
    private smoke: Emitter;
    private fire: Emitter;
    private frost: Emitter;
    private magic: Emitter;
    private texts: Phaser.GameObjects.Text[] = [];
    private lines: Phaser.GameObjects.Graphics;

    constructor(private scene: Phaser.Scene) {
        const mk = (tex: string, cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig) =>
            scene.add.particles(0, 0, tex, { emitting: false, ...cfg }).setDepth(DEPTH.effects);
        this.dust = mk('px_soft', { speed: { min: 30, max: 110 }, lifespan: 600, scale: { start: 1.1, end: 0 }, alpha: { start: 0.8, end: 0 }, tint: 0xc9a46a });
        this.spark = mk('px_star', { speed: { min: 60, max: 190 }, lifespan: 750, scale: { start: 0.9, end: 0 }, gravityY: 120, tint: [0xffe066, 0xffc107, 0xffffff] });
        this.smoke = mk('px_soft', { speed: { min: 20, max: 80 }, lifespan: 650, scale: { start: 1.2, end: 0.2 }, alpha: { start: 0.7, end: 0 }, tint: [0xffffff, 0xd8d0c0] });
        this.fire = mk('px_soft', { speed: { min: 30, max: 150 }, lifespan: 500, scale: { start: 1.1, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0xffe066, 0xff9a2e, 0xff5722], blendMode: 'ADD' });
        this.frost = mk('px_star', { speed: { min: 30, max: 120 }, lifespan: 600, scale: { start: 0.8, end: 0 }, tint: [0xbfefff, 0xffffff, 0x6cc6e6] });
        this.magic = mk('px_star', { speed: { min: 30, max: 120 }, lifespan: 550, scale: { start: 0.8, end: 0 }, tint: [0xd1b3ff, 0xffffff, 0x9b6cff], blendMode: 'ADD' });
        this.lines = scene.add.graphics().setDepth(DEPTH.effects);
    }

    burst(kind: 'dust' | 'spark' | 'smoke' | 'fire' | 'frost' | 'magic', x: number, y: number, n = 10): void {
        this[kind].explode(n, x, y);
    }

    floatText(x: number, y: number, text: string, color = '#ffe066', size = 16, rise = 34): void {
        let t = this.texts.pop();
        if (!t) {
            t = this.scene.add.text(0, 0, '', {
                fontFamily: 'Georgia, "Palatino Linotype", serif', fontStyle: 'bold', stroke: '#2e1f14', strokeThickness: 4
            }).setOrigin(0.5).setDepth(DEPTH.effects + 1);
        }
        t.setText(text).setColor(color).setFontSize(size).setPosition(x, y).setAlpha(1).setScale(0.6).setVisible(true);
        this.scene.tweens.add({ targets: t, scale: 1, duration: 120, ease: 'Back.out' });
        this.scene.tweens.add({
            targets: t, y: y - rise, alpha: 0, duration: 850, delay: 150, ease: 'Cubic.out',
            onComplete: () => { t!.setVisible(false); this.texts.push(t!); }
        });
    }

    ring(x: number, y: number, radius: number, color: number, duration = 380, width = 4): void {
        const g = this.scene.add.graphics().setDepth(DEPTH.effects);
        g.lineStyle(width, color, 1).strokeCircle(0, 0, radius);
        g.setPosition(x, y).setScale(0.3);
        this.scene.tweens.add({ targets: g, scale: 1, alpha: 0, duration, ease: 'Cubic.out', onComplete: () => g.destroy() });
    }

    explosion(x: number, y: number, radius: number, kind: string): void {
        if (kind === 'ice') {
            this.ring(x, y, radius, 0xbfefff, 350, 3);
            this.burst('frost', x, y, 10);
        } else if (kind === 'firepot') {
            this.ring(x, y, radius, 0xff9a2e, 420, 5);
            this.burst('fire', x, y, 16);
        } else {
            this.ring(x, y, radius, 0xffd27a, 360, 5);
            this.burst('fire', x, y, kind === 'bomblet' ? 5 : 12);
            this.burst('smoke', x, y, kind === 'bomblet' ? 3 : 8);
        }
    }

    lightning(points: { x: number; y: number }[]): void {
        const g = this.lines;
        g.lineStyle(3, 0xe6d2ff, 1);
        for (let i = 1; i < points.length; i++) {
            const a = points[i - 1], b = points[i];
            g.beginPath();
            g.moveTo(a.x, a.y - 14);
            for (let k = 1; k < 4; k++) {
                const t = k / 4;
                g.lineTo(a.x + (b.x - a.x) * t + (Math.random() * 12 - 6), a.y - 14 + (b.y - a.y) * t + (Math.random() * 12 - 6));
            }
            g.lineTo(b.x, b.y - 14);
            g.strokePath();
            this.burst('magic', b.x, b.y - 14, 4);
        }
        this.scene.time.delayedCall(110, () => g.clear());
    }

    destroy(): void {
        this.texts.forEach((t) => t.destroy());
        [this.dust, this.spark, this.smoke, this.fire, this.frost, this.magic, this.lines].forEach((o) => o.destroy());
    }
}
