import type { Enemy } from './Enemy';
import type { TargetingMode } from './Tower';
import { dist2 } from './math';

export interface TargetQuery {
    x: number;
    y: number;
    range: number;
    canHitFlying: boolean;
    mode: TargetingMode;
}

export function isTargetable(e: Enemy, q: TargetQuery): boolean {
    if (!e.alive) return false;
    if (e.flying && !q.canHitFlying) return false;
    return dist2(e.x, e.y, q.x, q.y) <= q.range * q.range;
}

function score(e: Enemy, q: TargetQuery): number {
    switch (q.mode) {
        case 'first': return e.distance;
        case 'last': return -e.distance;
        case 'strongest': return e.hp * 1e4 + e.distance;
        case 'closest': return -dist2(e.x, e.y, q.x, q.y);
    }
}

/** Returns up to `count` targets in range, best first, according to the targeting mode. */
export function selectTargets(enemies: readonly Enemy[], q: TargetQuery, count = 1): Enemy[] {
    if (count === 1) {
        let best: Enemy | null = null;
        let bestScore = -Infinity;
        for (const e of enemies) {
            if (!isTargetable(e, q)) continue;
            const s = score(e, q);
            if (s > bestScore) { bestScore = s; best = e; }
        }
        return best ? [best] : [];
    }
    return enemies.filter((e) => isTargetable(e, q))
        .sort((a, b) => score(b, q) - score(a, q))
        .slice(0, count);
}

export function selectTarget(enemies: readonly Enemy[], q: TargetQuery): Enemy | null {
    return selectTargets(enemies, q, 1)[0] ?? null;
}
