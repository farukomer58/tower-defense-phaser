import { TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from '../config/gameConfig';

/**
 * Maps canonical (landscape) simulation coordinates to view coordinates.
 * In portrait the map is transposed (x <-> y). That is a reflection, so all
 * distances, ranges and path lengths are preserved and the simulation never
 * needs to know about orientation.
 */
export class ViewTransform {
    portrait = false;

    get width(): number { return this.portrait ? WORLD_HEIGHT : WORLD_WIDTH; }
    get height(): number { return this.portrait ? WORLD_WIDTH : WORLD_HEIGHT; }

    vx(wx: number, wy: number): number { return this.portrait ? wy : wx; }
    vy(wx: number, wy: number): number { return this.portrait ? wx : wy; }

    toWorld(vx: number, vy: number): { x: number; y: number } {
        return this.portrait ? { x: vy, y: vx } : { x: vx, y: vy };
    }

    /** Converts a world-space angle to view space. */
    angle(worldAngle: number): number {
        return this.portrait ? Math.atan2(Math.cos(worldAngle), Math.sin(worldAngle)) : worldAngle;
    }

    /** Converts a world-space direction to view space. */
    dir(dx: number, dy: number): { x: number; y: number } {
        return this.portrait ? { x: dy, y: dx } : { x: dx, y: dy };
    }

    cellAtView(vx: number, vy: number): { c: number; r: number } {
        const w = this.toWorld(vx, vy);
        return { c: Math.floor(w.x / TILE_SIZE), r: Math.floor(w.y / TILE_SIZE) };
    }

    /** View-space centre of a canonical grid cell. */
    cellCenter(c: number, r: number): { x: number; y: number } {
        const wx = (c + 0.5) * TILE_SIZE;
        const wy = (r + 0.5) * TILE_SIZE;
        return { x: this.vx(wx, wy), y: this.vy(wx, wy) };
    }
}
