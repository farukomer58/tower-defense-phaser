import { GRID_COLS, GRID_ROWS } from '../config/gameConfig';
import { CASTLE_SIZE, type MapDefinition } from '../config/mapConfig';

export type PlacementResult = 'ok' | 'out_of_bounds' | 'road' | 'blocked' | 'occupied';

export const PLACEMENT_MESSAGES: Record<Exclude<PlacementResult, 'ok'>, string> = {
    out_of_bounds: 'Outside the kingdom',
    road: 'Cannot build on the road',
    blocked: 'Something is in the way',
    occupied: 'A tower is already here'
};

const key = (c: number, r: number) => `${c},${r}`;

/** Tracks which grid cells can be built on. */
export class PlacementGrid {
    readonly cols = GRID_COLS;
    readonly rows = GRID_ROWS;
    private readonly road: Set<string>;
    private readonly blocked = new Set<string>();
    private readonly occupied = new Map<string, number>();

    constructor(map: MapDefinition, roadCells: Set<string>) {
        this.road = roadCells;
        for (let dc = 0; dc < CASTLE_SIZE; dc++) {
            for (let dr = 0; dr < CASTLE_SIZE; dr++) this.blocked.add(key(map.castle.c + dc, map.castle.r + dr));
        }
        for (const o of map.obstacles) this.blocked.add(key(o.c, o.r));
    }

    check(c: number, r: number): PlacementResult {
        if (!Number.isInteger(c) || !Number.isInteger(r) || c < 0 || r < 0 || c >= this.cols || r >= this.rows) return 'out_of_bounds';
        const k = key(c, r);
        if (this.road.has(k)) return 'road';
        if (this.blocked.has(k)) return 'blocked';
        if (this.occupied.has(k)) return 'occupied';
        return 'ok';
    }

    isRoad(c: number, r: number): boolean { return this.road.has(key(c, r)); }
    isBlocked(c: number, r: number): boolean { return this.blocked.has(key(c, r)); }
    towerAt(c: number, r: number): number | undefined { return this.occupied.get(key(c, r)); }

    occupy(c: number, r: number, towerId: number): void { this.occupied.set(key(c, r), towerId); }
    release(c: number, r: number): void { this.occupied.delete(key(c, r)); }
}
