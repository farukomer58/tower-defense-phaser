import Phaser from 'phaser';
import { CASTLE_SIZE, type DecorationKind } from '../config/mapConfig';
import { GRID_COLS, GRID_ROWS, TILE_SIZE } from '../config/gameConfig';
import type { Simulation } from '../core/Simulation';
import { mulberry32 } from '../core/rng';
import type { ViewTransform } from './ViewTransform';

const OBSTACLE_SIZE: Record<DecorationKind, [number, number]> = {
    cypress: [40, 80], palm: [54, 84], rock: [52, 46], fountain: [64, 58], tent: [62, 56], well: [50, 50]
};

export const DEPTH = {
    ground: -1000, road: -900, scatter: -850, outside: -800, grid: -700, under: -600,
    projectile: 20000, bars: 20500, effects: 21000, preview: 22000
};

/** Draws the static world: ground, road, decorations, castle and build grid. */
export class WorldRenderer {
    private objects: Phaser.GameObjects.GameObject[] = [];
    private grid: Phaser.GameObjects.Graphics;
    castle: Phaser.GameObjects.Image | null = null;
    castlePos = { x: 0, y: 0 };
    spawnPos = { x: 0, y: 0 };

    constructor(private scene: Phaser.Scene) {
        this.grid = scene.add.graphics().setDepth(DEPTH.grid);
    }

    clear(): void {
        this.objects.forEach((o) => o.destroy());
        this.objects = [];
        this.grid.clear();
        this.castle = null;
    }

    build(sim: Simulation, vt: ViewTransform): void {
        this.clear();
        const s = this.scene;
        const theme = sim.map.theme;
        const add = <T extends Phaser.GameObjects.GameObject>(o: T) => { this.objects.push(o); return o; };
        const W = vt.width, H = vt.height;

        // Ground (extends past the map so letterboxing still shows terrain).
        const ground = add(s.add.tileSprite(-2000, -2000, W + 4000, H + 4000, theme.groundTexture).setOrigin(0).setDepth(DEPTH.ground));
        const tex = s.textures.get(theme.groundTexture).getSourceImage() as HTMLImageElement;
        ground.setTileScale(TILE_SIZE * 2 / Math.max(1, tex.width));

        // Road: extend the first point far off-map so enemies walk in from beyond the edge.
        const pts = sim.path.points.map((p) => new Phaser.Math.Vector2(vt.vx(p.x, p.y), vt.vy(p.x, p.y)));
        const d = new Phaser.Math.Vector2(pts[0].x - pts[1].x, pts[0].y - pts[1].y).normalize();
        pts.unshift(new Phaser.Math.Vector2(pts[0].x + d.x * 1200, pts[0].y + d.y * 1200));
        this.spawnPos = { x: pts[1].x, y: pts[1].y };
        const road = add(s.add.graphics().setDepth(DEPTH.road));
        const stroke = (width: number, color: number, alpha = 1) => {
            road.lineStyle(width, color, alpha).strokePoints(pts, false, false);
            road.fillStyle(color, alpha);
            for (const p of pts) road.fillCircle(p.x, p.y, width / 2);
        };
        stroke(54, theme.roadEdgeColor);
        stroke(44, theme.roadColor);
        // Cobbles along the road.
        const rnd = mulberry32(sim.map.id.length * 977);
        for (let dist = 0; dist < sim.path.length; dist += 18) {
            const p = sim.path.sample(dist);
            for (let k = 0; k < 2; k++) {
                const off = (rnd() * 2 - 1) * 15;
                const wx = p.x - p.dy * off, wy = p.y + p.dx * off;
                road.fillStyle(theme.roadStoneColor, 0.9).fillEllipse(vt.vx(wx, wy), vt.vy(wx, wy), 7 + rnd() * 5, 5 + rnd() * 3);
            }
        }

        // Scattered flowers and grass (purely visual).
        for (let i = 0; i < 70; i++) {
            const c = Math.floor(rnd() * GRID_COLS), r = Math.floor(rnd() * GRID_ROWS);
            if (sim.grid.check(c, r) !== 'ok') continue;
            const wx = (c + 0.15 + rnd() * 0.7) * TILE_SIZE, wy = (r + 0.15 + rnd() * 0.7) * TILE_SIZE;
            const key = theme.scatter[Math.floor(rnd() * theme.scatter.length)];
            add(s.add.image(vt.vx(wx, wy), vt.vy(wx, wy), key).setDisplaySize(24, 24).setDepth(DEPTH.scatter).setAlpha(0.95));
        }

        // Darken the area outside the kingdom and frame it.
        const out = add(s.add.graphics().setDepth(DEPTH.outside));
        out.fillStyle(0x10201a, 0.32);
        out.fillRect(-3000, -3000, W + 6000, 3000).fillRect(-3000, H, W + 6000, 3000)
            .fillRect(-3000, 0, 3000, H).fillRect(W, 0, 3000, H);
        out.lineStyle(3, 0xe2b43c, 0.55).strokeRect(-1.5, -1.5, W + 3, H + 3);

        // Spawn marker: pulsing chevrons on the road at the entry.
        const p0 = pts[1], p1 = pts[2];
        const dir = new Phaser.Math.Vector2(p1.x - p0.x, p1.y - p0.y).normalize();
        const chev = add(s.add.graphics().setDepth(DEPTH.under));
        for (let k = 0; k < 3; k++) {
            const cx = p0.x + dir.x * (14 + k * 16), cy = p0.y + dir.y * (14 + k * 16);
            const nx = -dir.y, ny = dir.x;
            chev.lineStyle(5, 0xc0392b, 0.85).beginPath();
            chev.moveTo(cx - dir.x * 7 + nx * 10, cy - dir.y * 7 + ny * 10);
            chev.lineTo(cx + dir.x * 4, cy + dir.y * 4);
            chev.lineTo(cx - dir.x * 7 - nx * 10, cy - dir.y * 7 - ny * 10);
            chev.strokePath();
        }
        s.tweens.add({ targets: chev, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });

        // Obstacles.
        for (const o of sim.map.obstacles) {
            const p = vt.cellCenter(o.c, o.r);
            const [w, h] = OBSTACLE_SIZE[o.kind];
            const img = add(s.add.image(p.x, p.y + 22, `deco_${o.kind}`).setOrigin(0.5, 0.92).setDisplaySize(w, h).setDepth(p.y + 22));
            if (o.kind === 'cypress' || o.kind === 'palm') {
                s.tweens.add({ targets: img, angle: { from: -1.5, to: 1.5 }, duration: 1800 + (o.c * 97) % 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
            }
        }

        // Castle (square 3x3 block, so it fits both orientations).
        const cc = sim.map.castle;
        const cxW = (cc.c + CASTLE_SIZE / 2) * TILE_SIZE, cyW = (cc.r + CASTLE_SIZE / 2) * TILE_SIZE;
        const cx = vt.vx(cxW, cyW), cy = vt.vy(cxW, cyW);
        const bottom = cy + (CASTLE_SIZE * TILE_SIZE) / 2;
        this.castlePos = { x: cx, y: cy };
        this.castle = add(s.add.image(cx, bottom + 4, 'castle').setOrigin(0.5, 0.93).setDisplaySize(210, 236).setDepth(bottom));
    }

    /** Highlights buildable cells while placing a tower. */
    showGrid(sim: Simulation | null, vt: ViewTransform, visible: boolean): void {
        this.grid.clear();
        if (!sim || !visible) return;
        for (let c = 0; c < GRID_COLS; c++) {
            for (let r = 0; r < GRID_ROWS; r++) {
                if (sim.grid.check(c, r) !== 'ok') continue;
                const p = vt.cellCenter(c, r);
                this.grid.fillStyle(0x7dff8a, 0.13).fillRoundedRect(p.x - 29, p.y - 29, 58, 58, 8);
                this.grid.lineStyle(1.5, 0xeaffd0, 0.45).strokeRoundedRect(p.x - 29, p.y - 29, 58, 58, 8);
            }
        }
    }

    destroy(): void {
        this.clear();
        this.grid.destroy();
    }
}
