import { TILE_SIZE } from '../config/gameConfig';
import type { GridPoint } from '../config/mapConfig';

export interface PathSample { x: number; y: number; dx: number; dy: number }

/**
 * A smoothed polyline that enemies follow. Built from grid waypoints, with
 * rounded corners so movement and lane offsets stay smooth.
 */
export class Path {
    readonly points: { x: number; y: number }[];
    private readonly cumulative: number[];
    readonly length: number;
    /** Grid cells covered by the road (keys are "c,r"). */
    readonly cells: Set<string>;

    constructor(waypoints: GridPoint[], cornerRadius = TILE_SIZE * 0.45) {
        if (waypoints.length < 2) throw new Error('Path needs at least 2 waypoints');
        const px = waypoints.map((w) => ({ x: (w.c + 0.5) * TILE_SIZE, y: (w.r + 0.5) * TILE_SIZE }));
        this.points = Path.roundCorners(px, cornerRadius);
        this.cumulative = [0];
        for (let i = 1; i < this.points.length; i++) {
            const a = this.points[i - 1];
            const b = this.points[i];
            this.cumulative.push(this.cumulative[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
        }
        this.length = this.cumulative[this.cumulative.length - 1];
        this.cells = Path.coveredCells(waypoints);
    }

    static roundCorners(pts: { x: number; y: number }[], radius: number, samples = 8) {
        const out: { x: number; y: number }[] = [pts[0]];
        for (let i = 1; i < pts.length - 1; i++) {
            const a = pts[i - 1];
            const p = pts[i];
            const b = pts[i + 1];
            const inLen = Math.hypot(p.x - a.x, p.y - a.y);
            const outLen = Math.hypot(b.x - p.x, b.y - p.y);
            const r = Math.min(radius, inLen / 2, outLen / 2);
            const s = { x: p.x - ((p.x - a.x) / inLen) * r, y: p.y - ((p.y - a.y) / inLen) * r };
            const e = { x: p.x + ((b.x - p.x) / outLen) * r, y: p.y + ((b.y - p.y) / outLen) * r };
            for (let k = 0; k <= samples; k++) {
                const t = k / samples;
                const u = 1 - t;
                out.push({ x: u * u * s.x + 2 * u * t * p.x + t * t * e.x, y: u * u * s.y + 2 * u * t * p.y + t * t * e.y });
            }
        }
        out.push(pts[pts.length - 1]);
        return out;
    }

    static coveredCells(waypoints: GridPoint[]): Set<string> {
        const cells = new Set<string>();
        for (let i = 1; i < waypoints.length; i++) {
            const a = waypoints[i - 1];
            const b = waypoints[i];
            if (a.c !== b.c && a.r !== b.r) throw new Error('Path segments must be axis aligned');
            const steps = Math.max(Math.abs(b.c - a.c), Math.abs(b.r - a.r));
            for (let s = 0; s <= steps; s++) {
                const c = a.c + Math.sign(b.c - a.c) * s;
                const r = a.r + Math.sign(b.r - a.r) * s;
                cells.add(`${c},${r}`);
            }
        }
        return cells;
    }

    /** Position and unit direction at a distance along the path (clamped). */
    sample(distance: number, out: PathSample = { x: 0, y: 0, dx: 1, dy: 0 }): PathSample {
        const d = Math.max(0, Math.min(this.length, distance));
        // Binary search for the segment.
        let lo = 0;
        let hi = this.cumulative.length - 1;
        while (lo < hi - 1) {
            const mid = (lo + hi) >> 1;
            if (this.cumulative[mid] <= d) lo = mid; else hi = mid;
        }
        const a = this.points[lo];
        const b = this.points[hi];
        const segLen = this.cumulative[hi] - this.cumulative[lo] || 1;
        const t = (d - this.cumulative[lo]) / segLen;
        out.x = a.x + (b.x - a.x) * t;
        out.y = a.y + (b.y - a.y) * t;
        out.dx = (b.x - a.x) / segLen;
        out.dy = (b.y - a.y) / segLen;
        return out;
    }
}
