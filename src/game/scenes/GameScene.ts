import Phaser from 'phaser';
import { sound, type SoundId } from '../audio/SoundSystem';
import { TOWERS, type TowerTypeId } from '../config/towerConfig';
import { GRID_COLS, GRID_ROWS } from '../config/gameConfig';
import { Simulation } from '../core/Simulation';
import { EntityRenderer } from '../render/EntityRenderer';
import { Effects } from '../render/Effects';
import { ViewTransform } from '../render/ViewTransform';
import { DEPTH, WorldRenderer } from '../render/WorldRenderer';
import type { GameSession } from '../session/GameSession';

const FIRE_SOUND: Record<string, SoundId> = {
    arrow: 'arrow', cannonball: 'cannon', orb: 'magic', ice: 'ice', bullet: 'musket', firepot: 'fire'
};

/**
 * Renders the active simulation (or an attract-mode demo behind the main menu)
 * and turns pointer input into placement and selection commands.
 */
export class GameScene extends Phaser.Scene {
    private session!: GameSession;
    private vt = new ViewTransform();
    private world!: WorldRenderer;
    private entities!: EntityRenderer;
    private effects!: Effects;
    private sim: Simulation | null = null;
    private demo = false;
    private simUnsubs: (() => void)[] = [];
    private sessionUnsubs: (() => void)[] = [];

    private ghost!: Phaser.GameObjects.Image;
    private ghostRange!: Phaser.GameObjects.Graphics;
    private pointerDown = false;
    private hoverCell: { c: number; r: number } | null = null;

    constructor() { super('Game'); }

    create(): void {
        this.session = this.registry.get('session') as GameSession;
        this.world = new WorldRenderer(this);
        this.entities = new EntityRenderer(this);
        this.effects = new Effects(this);
        this.ghost = this.add.image(0, 0, 'tower_archer_1').setVisible(false).setAlpha(0.7).setDepth(DEPTH.preview);
        this.ghostRange = this.add.graphics().setDepth(DEPTH.preview - 1);

        this.sessionUnsubs.push(
            this.session.events.on('simChanged', (sim) => this.attach(sim)),
            this.session.events.on('placementMode', () => this.refreshPlacement()),
            this.session.events.on('selection', (id) => { this.entities.selectedTowerId = id; }),
            this.session.events.on('settings', (s) => { sound.enabled = s.sound; })
        );
        sound.enabled = this.session.settings.sound;

        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerup', this.onPointerUp, this);
        this.input.on('gameout', () => { this.hoverCell = null; this.entities.hoverTowerId = null; this.refreshPlacement(); });
        this.scale.on('resize', this.layout, this);

        this.events.once('shutdown', () => this.cleanup());
        this.attach(this.session.sim);
    }

    // ---------------------------------------------------------------- simulation binding

    /** Binds to a simulation. Without one, shows a self-playing demo behind the menu. */
    private attach(sim: Simulation | null): void {
        this.simUnsubs.forEach((u) => u());
        this.simUnsubs = [];
        if (this.demo && this.sim) this.sim.destroy();
        this.entities.reset();
        this.demo = !sim;
        this.sim = sim ?? this.createDemo();
        this.bindEffects(this.sim);
        this.layout(true);
    }

    private createDemo(): Simulation {
        const demo = new Simulation({ mapId: 'bosphorus', difficulty: 'easy', seed: 99 });
        demo.economy.earn(5000);
        const spots: [TowerTypeId, number, number][] = [
            ['archer', 3, 2], ['frost', 1, 6], ['cannon', 5, 6], ['dervish', 7, 3], ['archer', 9, 3], ['cannon', 11, 7], ['archer', 3, 5], ['dervish', 11, 3]
        ];
        for (const [t, c, r] of spots) {
            const res = demo.placeTower(t, c, r);
            if (res.ok) for (let i = 0; i < 2; i++) demo.upgradeTower(res.value.id);
        }
        demo.autoStart = true;
        demo.countdown = 1;
        return demo;
    }

    private bindEffects(sim: Simulation): void {
        const fx = this.effects;
        const vt = this.vt;
        const live = () => !this.demo;
        const at = (x: number, y: number) => ({ x: vt.vx(x, y), y: vt.vy(x, y) });
        this.simUnsubs.push(
            sim.events.on('towerFired', (_t, p) => { if (live()) sound.play(FIRE_SOUND[p.kind] ?? 'arrow', 70); }),
            sim.events.on('explosion', (x, y, r, kind) => {
                const p = at(x, y);
                fx.explosion(p.x, p.y, r, kind);
                if (live() && kind !== 'ice') sound.play('explode', 90);
            }),
            sim.events.on('chain', (pts) => fx.lightning(pts.map((q) => at(q.x, q.y)))),
            sim.events.on('projectileHit', (p) => {
                if (p.payload.splashRadius > 0) return;
                const q = at(p.x, p.y);
                if (p.kind === 'ice') fx.burst('frost', q.x, q.y - 12, 5);
                else if (p.kind === 'orb') fx.burst('magic', q.x, q.y - 12, 5);
            }),
            sim.events.on('enemyDamaged', (e, dmg, crit) => {
                if (crit && this.session.settings.showDamage) {
                    const q = at(e.x, e.y);
                    fx.floatText(q.x, q.y - e.size - 10, `${Math.round(dmg)}!`, '#ff6b4a', 18);
                }
            }),
            sim.events.on('enemyFrozen', (e) => { const q = at(e.x, e.y); fx.burst('frost', q.x, q.y - e.size / 2, 10); }),
            sim.events.on('enemyKilled', (e, reward) => {
                const q = at(e.x, e.y);
                const y = q.y - e.size * 0.4 - (e.flying ? 22 : 0);
                fx.burst('smoke', q.x, y, e.def.isBoss ? 30 : 8);
                if (e.def.isBoss) { fx.burst('spark', q.x, y, 40); this.cameras.main.shake(300, 0.006); }
                if (!live()) return;
                fx.floatText(q.x, y - 10, `+${reward}`, '#ffd54f', e.def.isBoss ? 26 : 15);
                sound.play(e.def.isBoss ? 'victory' : 'coin', 50);
            }),
            sim.events.on('enemyLeaked', (e) => {
                if (!this.world.castle) return;
                const c = this.world.castlePos;
                this.cameras.main.shake(e.def.isBoss ? 450 : 150, e.def.isBoss ? 0.012 : 0.004);
                this.world.castle.setTintFill(0xff4444);
                this.time.delayedCall(120, () => this.world.castle?.clearTint());
                if (!live()) return;
                fx.floatText(c.x, c.y - 60, `-${e.castleDamage}`, '#ff5252', 24, 40);
                sound.play('leak', 80);
            }),
            sim.events.on('enemySummoned', (e) => { const q = at(e.x, e.y); fx.burst('magic', q.x, q.y - 10, 8); }),
            sim.events.on('enemyBlinked', (e, fxX, fyY) => {
                const a = at(fxX, fyY), b = at(e.x, e.y);
                fx.burst('magic', a.x, a.y - 20, 10); fx.burst('magic', b.x, b.y - 20, 10);
            }),
            sim.events.on('shieldRaised', (e) => { const q = at(e.x, e.y); fx.ring(q.x, q.y - e.size / 2, e.size * 0.7, 0x9fe6ff, 400); }),
            sim.events.on('towerPlaced', (t) => {
                const q = at(t.x, t.y);
                this.time.delayedCall(0, () => {
                    const spr = this.entities.towerSprite(t.id);
                    if (spr) {
                        const sx = spr.scaleX, sy = spr.scaleY;
                        spr.setScale(sx * 0.2, sy * 1.4);
                        this.tweens.add({ targets: spr, scaleX: sx, scaleY: sy, duration: 380, ease: 'Back.out' });
                    }
                });
                fx.burst('dust', q.x, q.y + 20, 14);
                if (live()) sound.play('place');
                this.refreshPlacement();
            }),
            sim.events.on('towerUpgraded', (t) => {
                const q = at(t.x, t.y);
                fx.burst('spark', q.x, q.y - 20, 24);
                fx.ring(q.x, q.y, 44, 0xffd54f, 450);
                const spr = this.entities.towerSprite(t.id);
                if (spr) this.tweens.add({ targets: spr, scaleY: spr.scaleY * 1.12, duration: 120, yoyo: true });
                fx.floatText(q.x, q.y - 60, `Level ${t.level}`, '#ffe066', 16);
                if (live()) sound.play('upgrade');
            }),
            sim.events.on('towerSold', (t, refund) => {
                const q = at(t.x, t.y);
                fx.burst('dust', q.x, q.y + 10, 16);
                fx.floatText(q.x, q.y - 30, `+${refund}`, '#ffd54f', 16);
                if (live()) sound.play('sell');
                this.refreshPlacement();
            }),
            sim.events.on('waveStarted', (_w, def) => { if (live()) sound.play(def.isBoss ? 'boss' : 'waveStart'); }),
            sim.events.on('waveCompleted', () => { if (live()) sound.play('waveClear'); }),
            sim.events.on('gameOver', () => { if (live()) sound.play('defeat'); }),
            sim.events.on('victory', () => { if (live()) sound.play('victory'); })
        );
    }

    // ---------------------------------------------------------------- layout

    /** Fits the map to the canvas, choosing portrait or landscape by aspect ratio. */
    private layout(force: boolean | unknown = false): void {
        const w = this.scale.width, h = this.scale.height;
        if (w <= 0 || h <= 0) return;
        // Hysteresis: only flip when the aspect ratio clearly changes, so small
        // layout shifts (panels opening) never rotate the map under the player.
        const portrait = this.vt.portrait ? h > w * 0.9 : h > w * 1.1;
        if (force === true || portrait !== this.vt.portrait) {
            this.vt.portrait = portrait;
            this.entities.reset();
            if (this.sim) this.world.build(this.sim, this.vt);
            this.refreshPlacement();
        }
        const cam = this.cameras.main;
        const zoom = Math.min(w / this.vt.width, h / this.vt.height);
        cam.setZoom(zoom);
        cam.centerOn(this.vt.width / 2, this.vt.height / 2);
    }

    // ---------------------------------------------------------------- input

    private cellAt(p: Phaser.Input.Pointer): { c: number; r: number } | null {
        const cell = this.vt.cellAtView(p.worldX, p.worldY);
        if (cell.c < 0 || cell.r < 0 || cell.c >= GRID_COLS || cell.r >= GRID_ROWS) return null;
        return cell;
    }

    private onPointerDown(p: Phaser.Input.Pointer): void {
        sound.unlock();
        if (this.demo || !this.sim) return;
        this.pointerDown = true;
        this.hoverCell = this.cellAt(p);
        this.refreshPlacement();
    }

    private onPointerMove(p: Phaser.Input.Pointer): void {
        if (this.demo || !this.sim) return;
        const cell = this.cellAt(p);
        if (cell?.c !== this.hoverCell?.c || cell?.r !== this.hoverCell?.r) {
            this.hoverCell = cell;
            this.refreshPlacement();
        }
        if (!this.session.placementType) {
            const id = cell ? this.sim.grid.towerAt(cell.c, cell.r) : undefined;
            this.entities.hoverTowerId = p.wasTouch ? null : id ?? null;
        }
    }

    private onPointerUp(p: Phaser.Input.Pointer): void {
        if (this.demo || !this.sim || !this.pointerDown) return;
        this.pointerDown = false;
        const cell = this.cellAt(p);
        if (this.session.placementType) {
            if (cell) {
                const shift = (p.event as MouseEvent | undefined)?.shiftKey ?? false;
                if (!this.session.placeAt(cell.c, cell.r, shift)) sound.play('error');
            }
            if (p.wasTouch) this.hoverCell = null;
            this.refreshPlacement();
            return;
        }
        const id = cell ? this.sim.grid.towerAt(cell.c, cell.r) : undefined;
        if (id !== undefined) sound.play('click');
        this.session.select(id ?? null);
    }

    /** Updates the ghost tower, its range and the build grid. */
    private refreshPlacement(): void {
        const type = this.demo ? null : this.session.placementType;
        this.world.showGrid(this.sim, this.vt, type !== null);
        this.ghostRange.clear();
        const cell = this.hoverCell;
        if (!type || !cell || !this.sim) { this.ghost.setVisible(false); return; }
        const def = TOWERS[type];
        const ok = this.sim.canPlace(type, cell.c, cell.r);
        const p = this.vt.cellCenter(cell.c, cell.r);
        const color = ok.ok ? 0x7dff8a : 0xff5252;
        this.ghost.setTexture(`tower_${type}_1`).setOrigin(0.5, 0.88).setDisplaySize(74, 92)
            .setPosition(p.x, p.y + 24).setVisible(true).setAlpha(ok.ok ? 0.75 : 0.45);
        if (ok.ok) this.ghost.clearTint(); else this.ghost.setTint(0xff8080);
        this.ghostRange.fillStyle(color, 0.12).fillCircle(p.x, p.y, def.levels[0].range);
        this.ghostRange.lineStyle(2, color, 0.8).strokeCircle(p.x, p.y, def.levels[0].range);
        this.ghostRange.fillStyle(color, 0.35).fillRoundedRect(p.x - 30, p.y - 30, 60, 60, 8);
    }

    // ---------------------------------------------------------------- frame

    update(_time: number, delta: number): void {
        const dt = Math.min(delta / 1000, 0.1);
        if (this.demo && this.sim) {
            this.sim.advance(dt);
            if (this.sim.status !== 'playing') this.attach(null);
        } else {
            this.session.update(dt);
        }
        // Animations follow simulation time, so they freeze when paused and speed up at 2x/3x.
        if (this.sim) this.entities.sync(this.sim, this.vt, this.sim.time * 1000);
        // Burning enemies smoulder.
        if (this.sim && !this.session.paused && Math.random() < 0.3) {
            for (const e of this.sim.enemies) {
                if (e.isBurning && Math.random() < 0.25) this.effects.burst('fire', this.vt.vx(e.x, e.y), this.vt.vy(e.x, e.y) - e.size * 0.4, 1);
            }
        }
    }

    private cleanup(): void {
        this.simUnsubs.forEach((u) => u());
        this.sessionUnsubs.forEach((u) => u());
        this.scale.off('resize', this.layout, this);
        if (this.demo) this.sim?.destroy();
        this.entities.destroy();
        this.world.destroy();
        this.effects.destroy();
    }
}
