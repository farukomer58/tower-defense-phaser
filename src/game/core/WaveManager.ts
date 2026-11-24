import { TOTAL_WAVES, type EnemyRank } from '../config/gameConfig';
import type { EnemyTypeId } from '../config/enemyConfig';
import { getWave, type WaveDefinition } from '../config/waveConfig';

export interface ScheduledSpawn { time: number; type: EnemyTypeId; rank: EnemyRank }

export type WaveState = 'idle' | 'active';

/** Turns a wave definition into a time-ordered spawn schedule. */
export function buildSchedule(def: WaveDefinition): ScheduledSpawn[] {
    const out: ScheduledSpawn[] = [];
    let t = 0;
    for (const grp of def.groups) {
        t += grp.delay;
        for (let i = 0; i < grp.count; i++) {
            out.push({ time: t, type: grp.type, rank: grp.rank });
            if (i < grp.count - 1) t += grp.interval;
        }
    }
    return out.sort((a, b) => a.time - b.time);
}

/**
 * Manages wave progression. A wave is complete once every scheduled enemy has
 * spawned AND no enemies remain alive (killed or leaked).
 */
export class WaveManager {
    /** Number of the most recently started wave (0 before the first). */
    currentWave = 0;
    state: WaveState = 'idle';
    private schedule: ScheduledSpawn[] = [];
    private cursor = 0;
    private elapsed = 0;
    readonly totalWaves: number;

    constructor(totalWaves = TOTAL_WAVES, startCompleted = 0) {
        this.totalWaves = totalWaves;
        this.currentWave = startCompleted;
    }

    get completedWaves(): number {
        return this.state === 'idle' ? this.currentWave : this.currentWave - 1;
    }

    get isActive(): boolean { return this.state === 'active'; }
    get allSpawned(): boolean { return this.cursor >= this.schedule.length; }
    get remainingToSpawn(): number { return this.schedule.length - this.cursor; }
    get scheduledCount(): number { return this.schedule.length; }
    get hasMoreWaves(): boolean { return this.currentWave < this.totalWaves; }

    canStartNext(): boolean {
        return this.state === 'idle' && this.hasMoreWaves;
    }

    /** Starts the next wave. Returns its definition, or null if not allowed. */
    startNext(): WaveDefinition | null {
        if (!this.canStartNext()) return null;
        this.currentWave++;
        const def = getWave(this.currentWave);
        this.schedule = buildSchedule(def);
        this.cursor = 0;
        this.elapsed = 0;
        this.state = 'active';
        return def;
    }

    /**
     * Advances the spawn timer. Calls `spawn` for each due enemy.
     * Returns true exactly once, on the update when the wave completes.
     */
    update(dt: number, aliveEnemies: number, spawn: (s: ScheduledSpawn) => void): boolean {
        if (this.state !== 'active') return false;
        this.elapsed += dt;
        while (this.cursor < this.schedule.length && this.schedule[this.cursor].time <= this.elapsed) {
            spawn(this.schedule[this.cursor]);
            this.cursor++;
            aliveEnemies++;
        }
        if (this.allSpawned && aliveEnemies === 0) {
            this.state = 'idle';
            this.schedule = [];
            this.cursor = 0;
            return true;
        }
        return false;
    }
}
