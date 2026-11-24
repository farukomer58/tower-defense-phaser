import { Simulation, type SaveData } from '../src/game/core/Simulation';

export function makeSim(save?: Partial<SaveData>): Simulation {
    if (!save) return new Simulation({ mapId: 'bosphorus', difficulty: 'normal', seed: 1 });
    const full: SaveData = {
        version: 1, mapId: 'bosphorus', difficulty: 'normal', completedWaves: 0, coins: 100, health: 20, breached: 0,
        stats: { kills: 0, bossesDefeated: 0, towersBuilt: 0, coinsEarned: 0 }, towers: [], savedAt: 0, ...save
    };
    return new Simulation({ mapId: 'bosphorus', difficulty: 'normal', seed: 1, save: full });
}

/** Runs ticks until `done()` or the time limit (simulated seconds). Returns elapsed seconds. */
export function runUntil(sim: Simulation, done: () => boolean, limitSeconds = 600, eachTick?: () => void): number {
    const step = 1 / 60;
    let t = 0;
    while (!done() && t < limitSeconds) {
        eachTick?.();
        sim.tick(step);
        t += step;
    }
    return t;
}

/** Kills every living enemy (used to fast-forward waves in tests). */
export function killAll(sim: Simulation): void {
    for (const e of [...sim.enemies]) if (e.alive) sim.damageEnemy(e, e.hp + 1, -1);
}

// Known cells on the Bosphorus map.
export const BUILDABLE = { c: 3, r: 2 };
export const ROAD = { c: 2, r: 3 };
export const OBSTACLE = { c: 4, r: 4 };
