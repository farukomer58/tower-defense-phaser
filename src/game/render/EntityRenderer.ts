import Phaser from 'phaser';
import { towerTextureTier } from '../config/towerConfig';
import type { Enemy } from '../core/Enemy';
import type { Projectile } from '../core/Projectile';
import type { Simulation } from '../core/Simulation';
import type { Tower } from '../core/Tower';
import type { ViewTransform } from './ViewTransform';
import { DEPTH } from './WorldRenderer';

const TOWER_W = 74;
const TOWER_H = 92;
const TOWER_FOOT = 24; // foot offset below the cell centre
const FLY_HEIGHT = 22;

interface TowerView { base: Phaser.GameObjects.Image; barrel?: Phaser.GameObjects.Image; pips: Phaser.GameObjects.Graphics; level: number; tier: number }
interface EnemyView { sprite: Phaser.GameObjects.Image; phase: number }

/** Keeps Phaser sprites in sync with simulation entities, using pools for frequent objects. */
export class EntityRenderer {
    private towers = new Map<number, TowerView>();
    private enemies = new Map<number, EnemyView>();
    private projectiles = new Map<number, Phaser.GameObjects.Image>();
    private projectilePool = new Map<string, Phaser.GameObjects.Image[]>();
    private enemyPool = new Map<string, Phaser.GameObjects.Image[]>();
    private bars: Phaser.GameObjects.Graphics;
    private under: Phaser.GameObjects.Graphics;
    private seen = new Set<number>();
    selectedTowerId: number | null = null;
    hoverTowerId: number | null = null;

    constructor(private scene: Phaser.Scene) {
        this.bars = scene.add.graphics().setDepth(DEPTH.bars);
        this.under = scene.add.graphics().setDepth(DEPTH.under);
    }

    /** Removes every sprite (used when the simulation or orientation changes). */
    reset(): void {
        for (const v of this.towers.values()) { v.base.destroy(); v.barrel?.destroy(); v.pips.destroy(); }
        for (const v of this.enemies.values()) this.releaseEnemy(v);
        for (const p of this.projectiles.values()) this.releaseProjectile(p);
        this.towers.clear();
        this.enemies.clear();
        this.projectiles.clear();
        this.bars.clear();
        this.under.clear();
    }

    towerSprite(id: number): Phaser.GameObjects.Image | undefined { return this.towers.get(id)?.base; }
    enemySprite(id: number): Phaser.GameObjects.Image | undefined { return this.enemies.get(id)?.sprite; }

    /** View position of a tower's top (where projectiles appear to leave from). */
    towerTop(t: Tower, vt: ViewTransform): { x: number; y: number } {
        return { x: vt.vx(t.x, t.y), y: vt.vy(t.x, t.y) - 26 };
    }

    sync(sim: Simulation, vt: ViewTransform, time: number): void {
        this.syncTowers(sim, vt);
        this.syncEnemies(sim, vt, time);
        this.syncProjectiles(sim, vt, time);
    }

    // ---------------------------------------------------------------- towers

    private syncTowers(sim: Simulation, vt: ViewTransform): void {
        this.seen.clear();
        for (const t of sim.towers) {
            this.seen.add(t.id);
            let v = this.towers.get(t.id);
            const cx = vt.vx(t.x, t.y), cy = vt.vy(t.x, t.y);
            const foot = cy + TOWER_FOOT;
            if (!v) {
                const tier = towerTextureTier(t.level);
                const base = this.scene.add.image(cx, foot, `tower_${t.type}_${tier}`).setOrigin(0.5, 0.88).setDisplaySize(TOWER_W, TOWER_H).setDepth(foot);
                const pips = this.scene.add.graphics().setDepth(foot + 0.5);
                v = { base, pips, level: -1, tier };
                if (t.type === 'cannon') {
                    v.barrel = this.scene.add.image(cx, foot - 40, 'tower_cannon_barrel').setOrigin(14 / 72, 0.5).setDisplaySize(44, 20).setDepth(foot + 0.4);
                }
                this.towers.set(t.id, v);
            }
            if (v.level !== t.level) {
                const tier = towerTextureTier(t.level);
                if (tier !== v.tier) { v.base.setTexture(`tower_${t.type}_${tier}`).setDisplaySize(TOWER_W, TOWER_H); v.tier = tier; }
                v.level = t.level;
                this.drawPips(v.pips, cx, foot + 6, t.level);
            }
            if (v.barrel) v.barrel.setRotation(vt.angle(t.aimAngle));
        }
        for (const [id, v] of this.towers) {
            if (!this.seen.has(id)) {
                v.base.destroy(); v.barrel?.destroy(); v.pips.destroy();
                this.towers.delete(id);
            }
        }
    }

    private drawPips(g: Phaser.GameObjects.Graphics, x: number, y: number, level: number): void {
        g.clear();
        const n = 5, gap = 9;
        for (let i = 0; i < n; i++) {
            const px = x + (i - (n - 1) / 2) * gap;
            g.fillStyle(0x2e1f14, 0.8).fillCircle(px, y, 3.6);
            g.fillStyle(i < level ? 0xffd54f : 0x6b5a45, 1).fillCircle(px, y, 2.6);
        }
    }

    // ---------------------------------------------------------------- enemies

    private acquireEnemy(e: Enemy): Phaser.GameObjects.Image {
        const key = `enemy_${e.type}`;
        const pool = this.enemyPool.get(key);
        const img = pool?.pop() ?? this.scene.add.image(0, 0, key);
        img.setVisible(true).setActive(true).setAlpha(1).clearTint().setAngle(0).setFlipX(false);
        img.setOrigin(0.5, 0.92).setDisplaySize(e.size, e.size);
        img.setData('poolKey', key);
        return img;
    }

    private releaseEnemy(v: EnemyView): void {
        const key = v.sprite.getData('poolKey') as string;
        v.sprite.setVisible(false).setActive(false);
        this.scene.tweens.killTweensOf(v.sprite);
        let pool = this.enemyPool.get(key);
        if (!pool) { pool = []; this.enemyPool.set(key, pool); }
        pool.push(v.sprite);
    }

    private syncEnemies(sim: Simulation, vt: ViewTransform, time: number): void {
        this.seen.clear();
        const bars = this.bars.clear();
        const under = this.under.clear();
        for (const e of sim.enemies) {
            if (!e.alive) continue;
            this.seen.add(e.id);
            let v = this.enemies.get(e.id);
            if (!v) {
                v = { sprite: this.acquireEnemy(e), phase: Math.random() * Math.PI * 2 };
                this.enemies.set(e.id, v);
                v.sprite.setScale(v.sprite.scaleX * 0.2, v.sprite.scaleY * 0.2);
                this.scene.tweens.add({ targets: v.sprite, scaleX: v.sprite.scaleX * 5, scaleY: v.sprite.scaleY * 5, duration: 220, ease: 'Back.out' });
            }
            const s = v.sprite;
            const x = vt.vx(e.x, e.y), y = vt.vy(e.x, e.y);
            const dir = vt.dir(e.dirX, e.dirY);
            if (Math.abs(dir.x) > 0.2) s.setFlipX(dir.x < 0);
            const moving = !e.isFrozen;
            const t = time / 1000;
            const bob = moving ? Math.abs(Math.sin(t * (e.currentSpeed / 9) + v.phase)) * (e.flying ? 0 : 3) : 0;
            const hover = e.flying ? FLY_HEIGHT + Math.sin(t * 3 + v.phase) * 4 : 0;
            s.setPosition(x, y - bob - hover);
            s.setAngle(moving && !e.flying ? Math.sin(t * (e.currentSpeed / 9) + v.phase) * 4 : 0);
            s.setDepth(y);

            // Tint by status: hit flash > frozen > slowed > burning > shielded.
            if (e.lastHitAge < 0.07) s.setTintFill(0xffffff);
            else if (e.isFrozen) s.setTint(0x8fd8ff);
            else if (e.isSlowed) s.setTint(0xb8e6ff);
            else if (e.isBurning) s.setTint(Math.sin(t * 20) > 0 ? 0xffb080 : 0xffd0a0);
            else s.clearTint();

            // Ground marks: flying shadow and rank rings.
            if (e.flying) under.fillStyle(0x000000, 0.18).fillEllipse(x, y, e.size * 0.6, e.size * 0.18);
            if (e.rank !== 'normal' || e.def.isBoss) {
                const col = e.def.isBoss ? 0xff5252 : e.rank === 'champion' ? 0xb388ff : 0xffd54f;
                under.lineStyle(3, col, 0.8).strokeEllipse(x, y, e.size * 0.75, e.size * 0.24);
            }

            // Health bar.
            const top = y - hover - e.size * 0.92 - 6;
            const bw = Phaser.Math.Clamp(e.size * 0.8, 26, 90);
            const bh = e.def.isBoss ? 8 : 5;
            const frac = Phaser.Math.Clamp(e.hp / e.maxHp, 0, 1);
            if (frac < 1 || e.def.isBoss || e.rank !== 'normal') {
                bars.fillStyle(0x2e1f14, 0.85).fillRoundedRect(x - bw / 2 - 1.5, top - 1.5, bw + 3, bh + 3, 2);
                const col = frac > 0.5 ? 0x6ad04a : frac > 0.25 ? 0xf0c030 : 0xe74c3c;
                bars.fillStyle(col, 1).fillRect(x - bw / 2, top, bw * frac, bh);
                if (e.isShielded) bars.lineStyle(2, 0x7fd8ff, 1).strokeRoundedRect(x - bw / 2 - 2, top - 2, bw + 4, bh + 4, 2);
            }
            if (e.isShielded) {
                bars.lineStyle(3, 0x9fe6ff, 0.6 + Math.sin(t * 10) * 0.2).strokeCircle(x, y - hover - e.size * 0.45, e.size * 0.6);
            }
        }
        for (const [id, v] of this.enemies) {
            if (!this.seen.has(id)) {
                this.releaseEnemy(v);
                this.enemies.delete(id);
            }
        }

        // Range of the selected or hovered tower, and mehter auras.
        for (const tw of sim.towers) {
            const sel = tw.id === this.selectedTowerId;
            const hov = tw.id === this.hoverTowerId;
            if (!sel && !hov && !tw.isSupport) continue;
            const cx = vt.vx(tw.x, tw.y), cy = vt.vy(tw.x, tw.y);
            if (tw.isSupport) {
                const pulse = 0.08 + Math.sin(t2(time) * 3) * 0.04;
                under.fillStyle(0xffd54f, sel ? 0.16 : pulse).fillCircle(cx, cy, tw.range);
            }
            if (sel || hov) {
                under.fillStyle(0xffffff, sel ? 0.12 : 0.07).fillCircle(cx, cy, tw.range);
                under.lineStyle(2, 0xffffff, sel ? 0.8 : 0.45).strokeCircle(cx, cy, tw.range);
            }
            if (sel) under.lineStyle(3, 0xffd54f, 1).strokeRoundedRect(cx - 30, cy - 30, 60, 60, 8);
        }
    }

    // ---------------------------------------------------------------- projectiles

    private acquireProjectile(kind: string): Phaser.GameObjects.Image {
        const pool = this.projectilePool.get(kind);
        const img = pool?.pop() ?? this.scene.add.image(0, 0, `proj_${kind}`).setDepth(DEPTH.projectile);
        const sizes: Record<string, [number, number]> = {
            arrow: [26, 8], cannonball: [14, 14], bomblet: [10, 10], orb: [20, 20], ice: [20, 10], bullet: [12, 4], firepot: [16, 16]
        };
        const [w, h] = sizes[kind] ?? [12, 12];
        img.setDisplaySize(w, h).setVisible(true).setActive(true).setAlpha(1).setRotation(0);
        img.setData('kind', kind);
        return img;
    }

    private releaseProjectile(img: Phaser.GameObjects.Image): void {
        const kind = img.getData('kind') as string;
        img.setVisible(false).setActive(false);
        let pool = this.projectilePool.get(kind);
        if (!pool) { pool = []; this.projectilePool.set(kind, pool); }
        pool.push(img);
    }

    private syncProjectiles(sim: Simulation, vt: ViewTransform, time: number): void {
        this.seen.clear();
        for (const p of sim.projectiles) {
            if (!p.alive) continue;
            this.seen.add(p.id);
            let img = this.projectiles.get(p.id);
            if (!img) {
                img = this.acquireProjectile(p.kind);
                this.projectiles.set(p.id, img);
            }
            this.placeProjectile(img, p, vt, time);
        }
        for (const [id, img] of this.projectiles) {
            if (!this.seen.has(id)) {
                this.releaseProjectile(img);
                this.projectiles.delete(id);
            }
        }
    }

    private placeProjectile(img: Phaser.GameObjects.Image, p: Projectile, vt: ViewTransform, time: number): void {
        const x = vt.vx(p.x, p.y), y = vt.vy(p.x, p.y);
        const prog = p.progress;
        let lift: number;
        if (p.isLobbed) {
            const arc = Phaser.Math.Clamp(p.plannedDistance * 0.35, 24, 80);
            lift = Math.sin(Math.PI * prog) * arc + 26 * (1 - prog);
            img.setRotation(img.rotation + 0.15);
        } else {
            lift = 26 * Math.max(0, 1 - prog) + 10;
            const d = vt.dir(p.tx - p.x, p.ty - p.y);
            img.setRotation(Math.atan2(d.y, d.x));
        }
        if (p.kind === 'orb') img.setAlpha(0.8 + Math.sin(time / 60) * 0.2);
        img.setPosition(x, y - lift);
    }

    destroy(): void {
        this.reset();
        for (const pool of [...this.projectilePool.values(), ...this.enemyPool.values()]) pool.forEach((i) => i.destroy());
        this.bars.destroy();
        this.under.destroy();
    }
}

const t2 = (ms: number) => ms / 1000;
