/**
 * Wave definitions. Waves 1-10 are hand-authored; waves 11-100 come from a
 * deterministic generator driven by the parameters below.
 */
import { BOSS_EVERY, RANK_CHANCE, TOTAL_WAVES, WAVE_TIMING, type EnemyRank } from './gameConfig';
import { BOSS_ORDER, ENEMIES, REGULAR_ENEMY_ORDER, type EnemyTypeId } from './enemyConfig';
import { mulberry32 } from '../core/rng';

export interface SpawnGroup {
    type: EnemyTypeId;
    count: number;
    /** Seconds between spawns inside this group. */
    interval: number;
    /** Seconds to wait after the previous group finished spawning. */
    delay: number;
    rank: EnemyRank;
}

export interface WaveDefinition {
    wave: number;
    isBoss: boolean;
    groups: SpawnGroup[];
}

const g = (type: EnemyTypeId, count: number, interval = 1.0, delay: number = WAVE_TIMING.groupGap, rank: EnemyRank = 'normal'): SpawnGroup =>
    ({ type, count, interval, delay, rank });

/** Hand-authored opening waves (from the design brief). */
export const AUTHORED_WAVES: WaveDefinition[] = [
    { wave: 1, isBoss: false, groups: [g('goblin', 5, 1.4, 0)] },
    { wave: 2, isBoss: false, groups: [g('goblin', 8, 1.1, 0)] },
    { wave: 3, isBoss: false, groups: [g('goblin', 6, 1.0, 0), g('orc', 2, 1.8)] },
    { wave: 4, isBoss: false, groups: [g('goblin', 8, 0.9, 0), g('orc', 3, 1.6)] },
    { wave: 5, isBoss: false, groups: [g('goblin', 8, 0.9, 0), g('wolfRider', 4, 1.0)] },
    { wave: 6, isBoss: false, groups: [g('goblin', 8, 0.8, 0), g('orc', 5, 1.4), g('golem', 2, 3.0)] },
    { wave: 7, isBoss: false, groups: [g('goblin', 10, 0.7, 0), g('wolfRider', 5, 0.9)] },
    { wave: 8, isBoss: false, groups: [g('orc', 8, 1.2, 0), g('golem', 4, 2.4)] },
    { wave: 9, isBoss: false, groups: [g('orc', 10, 1.0, 0), g('wolfRider', 5, 0.8), g('golem', 3, 2.2)] },
    {
        wave: 10, isBoss: true, groups: [
            g('goblin', 10, 0.7, 0), g('orc', 4, 1.2), g('bossGoblinWarlord', 1, 1, 2.5), g('wolfRider', 4, 0.9, 4)
        ]
    }
];

export const GENERATOR = {
    baseCount: 6,
    countPerWave: 0.55,
    maxGroups: 6,
    baseInterval: 1.0,
    intervalPerWave: 0.006,
    minInterval: 0.3,
    /** Share of a wave given to a newly introduced enemy type. */
    featuredShare: 0.45,
    /** Boss waves only have this fraction of a normal wave's escorts. */
    bossEscortShare: 0.55
};

/** Relative "weight" of one enemy: heavier enemies are spawned in smaller numbers. */
function heaviness(type: EnemyTypeId): number {
    return Math.max(1, Math.sqrt(ENEMIES[type].hp / 120));
}

function rankChances(wave: number): { elite: number; champion: number } {
    const elite = wave >= RANK_CHANCE.eliteStartWave
        ? Math.min(RANK_CHANCE.eliteMax, (wave - RANK_CHANCE.eliteStartWave + 1) * RANK_CHANCE.elitePerWave) : 0;
    const champion = wave >= RANK_CHANCE.championStartWave
        ? Math.min(RANK_CHANCE.championMax, (wave - RANK_CHANCE.championStartWave + 1) * RANK_CHANCE.championPerWave) : 0;
    return { elite, champion };
}

/** Adds a group, splitting off elite and champion sub-groups according to the wave's rank chances. */
function pushRanked(groups: SpawnGroup[], type: EnemyTypeId, count: number, interval: number, delay: number, wave: number) {
    const { elite, champion } = rankChances(wave);
    const champions = Math.floor(count * champion);
    const elites = Math.floor(count * elite);
    const normals = Math.max(0, count - champions - elites);
    let d = delay;
    if (normals > 0) { groups.push(g(type, normals, interval, d)); d = interval * 2; }
    if (elites > 0) { groups.push(g(type, elites, interval * 1.3, d, 'elite')); d = interval * 2; }
    if (champions > 0) { groups.push(g(type, champions, interval * 1.6, d, 'champion')); }
}

export function unlockedRegularEnemies(wave: number): EnemyTypeId[] {
    return REGULAR_ENEMY_ORDER.filter((t) => ENEMIES[t].unlockWave <= wave);
}

export function generateWave(wave: number): WaveDefinition {
    const rng = mulberry32(wave * 7919 + 17);
    const isBoss = wave % BOSS_EVERY === 0;
    const pool = unlockedRegularEnemies(wave);
    const newest = pool[pool.length - 1];
    const featured = ENEMIES[newest].unlockWave >= wave - 1 ? newest : null;

    let total = Math.round(GENERATOR.baseCount + GENERATOR.countPerWave * wave);
    if (isBoss) total = Math.round(total * GENERATOR.bossEscortShare);
    const interval = Math.max(GENERATOR.minInterval, GENERATOR.baseInterval - GENERATOR.intervalPerWave * wave);

    const groups: SpawnGroup[] = [];
    let remaining = total;

    if (featured) {
        const share = Math.round(total * GENERATOR.featuredShare);
        const n = Math.max(2, Math.round(share / heaviness(featured)));
        pushRanked(groups, featured, n, interval * Math.sqrt(heaviness(featured)), 0, wave);
        remaining -= share;
    }

    const groupCount = Math.min(GENERATOR.maxGroups, 2 + Math.floor(wave / 20));
    // Weighted pick: more recently unlocked types are more common, which keeps late waves fresh.
    const weights = pool.map((_, i) => 1 + i * 0.6);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < groupCount && remaining > 0; i++) {
        let r = rng() * weightSum;
        let idx = 0;
        while (r > weights[idx] && idx < weights.length - 1) { r -= weights[idx]; idx++; }
        const type = pool[idx];
        const share = i === groupCount - 1 ? remaining : Math.max(1, Math.round(remaining / (groupCount - i) * (0.7 + rng() * 0.6)));
        const n = Math.max(1, Math.round(share / heaviness(type)));
        pushRanked(groups, type, n, interval * Math.sqrt(heaviness(type)), groups.length === 0 ? 0 : WAVE_TIMING.groupGap, wave);
        remaining -= share;
    }

    if (isBoss) {
        const bossType = BOSS_ORDER[Math.min(BOSS_ORDER.length - 1, wave / BOSS_EVERY - 1)];
        // The boss arrives in the middle of its escort so the fight is dramatic.
        const insertAt = Math.max(1, Math.floor(groups.length / 2));
        groups.splice(insertAt, 0, g(bossType, 1, 1, 3));
    }
    return { wave, isBoss, groups };
}

const cache = new Map<number, WaveDefinition>();

export function getWave(wave: number): WaveDefinition {
    if (wave < 1 || wave > TOTAL_WAVES) throw new Error(`Wave ${wave} out of range`);
    let def = cache.get(wave);
    if (!def) {
        def = wave <= AUTHORED_WAVES.length ? AUTHORED_WAVES[wave - 1] : generateWave(wave);
        cache.set(wave, def);
    }
    return def;
}

export function waveEnemyCount(def: WaveDefinition): number {
    return def.groups.reduce((n, grp) => n + grp.count, 0);
}
