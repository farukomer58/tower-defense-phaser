/**
 * Global game configuration and balancing formulas.
 * Every tunable number that is not specific to a tower or enemy type lives here.
 */

export const TILE_SIZE = 64;
export const GRID_COLS = 16;
export const GRID_ROWS = 10;
/** Canonical (landscape) world size. Portrait views are rendered transposed. */
export const WORLD_WIDTH = GRID_COLS * TILE_SIZE; // 1024
export const WORLD_HEIGHT = GRID_ROWS * TILE_SIZE; // 640

export const TOTAL_WAVES = 100;
export const BOSS_EVERY = 10;

export type DifficultyId = 'easy' | 'normal' | 'hard';

export interface DifficultyDefinition {
    id: DifficultyId;
    name: string;
    description: string;
    startCoins: number;
    startHealth: number;
    enemyHpMultiplier: number;
    rewardMultiplier: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyDefinition> = {
    easy: {
        id: 'easy',
        name: 'Apprentice',
        description: 'Weaker enemies, more gold, sturdier walls.',
        startCoins: 150,
        startHealth: 30,
        enemyHpMultiplier: 0.75,
        rewardMultiplier: 1.15
    },
    normal: {
        id: 'normal',
        name: 'Pasha',
        description: 'The intended challenge.',
        startCoins: 100,
        startHealth: 20,
        enemyHpMultiplier: 1,
        rewardMultiplier: 1
    },
    hard: {
        id: 'hard',
        name: 'Grand Vizier',
        description: 'Tougher enemies and tighter coffers.',
        startCoins: 100,
        startHealth: 20,
        enemyHpMultiplier: 1.25,
        rewardMultiplier: 0.9
    }
};

export const ECONOMY = {
    /** Fraction of total investment returned when selling a tower. */
    sellRefundRatio: 0.6,
    /** Coins awarded when a wave is cleared: base + perWave * wave. */
    waveBonusBase: 25,
    waveBonusPerWave: 4,
    /** Extra castle health restored when a boss is defeated (capped at the starting health). */
    bossKillHeal: 5
};

/** Per-wave scaling of enemy statistics. `w` is the 1-based wave number. */
export const SCALING = {
    hpLinear: 0.11,
    hpQuadratic: 0.0028,
    rewardLinear: 0.045,
    speedLinear: 0.003,
    speedCap: 1.3,
    hpMultiplier(w: number): number {
        const n = w - 1;
        return 1 + this.hpLinear * n + this.hpQuadratic * n * n;
    },
    rewardMultiplier(w: number): number {
        return 1 + this.rewardLinear * (w - 1);
    },
    speedMultiplier(w: number): number {
        return Math.min(this.speedCap, 1 + this.speedLinear * (w - 1));
    }
};

export type EnemyRank = 'normal' | 'elite' | 'champion';

/** Elite and champion variants make enemies bigger, faster, and stronger. */
export const RANKS: Record<EnemyRank, { hp: number; reward: number; speed: number; scale: number; castleDamageBonus: number }> = {
    normal: { hp: 1, reward: 1, speed: 1, scale: 1, castleDamageBonus: 0 },
    elite: { hp: 2.2, reward: 2, speed: 1.06, scale: 1.2, castleDamageBonus: 1 },
    champion: { hp: 4.5, reward: 3.5, speed: 1.1, scale: 1.38, castleDamageBonus: 2 }
};

export const RANK_CHANCE = {
    eliteStartWave: 25,
    elitePerWave: 0.008,
    eliteMax: 0.35,
    championStartWave: 60,
    championPerWave: 0.006,
    championMax: 0.2
};

/**
 * Treasury (Hazine): kingdom-wide upgrades bought with coins. They give late-game
 * gold a use once every tower is maxed. Costs grow geometrically.
 */
export type ResearchId = 'damage' | 'fireRate';
export interface ResearchDefinition { id: ResearchId; name: string; description: string; perLevel: number; baseCost: number; growth: number; maxLevel: number }

export const RESEARCH: Record<ResearchId, ResearchDefinition> = {
    damage: {
        id: 'damage', name: 'Damascus Steel', description: '+10% damage for every tower.',
        perLevel: 0.1, baseCost: 400, growth: 1.45, maxLevel: 15
    },
    fireRate: {
        id: 'fireRate', name: 'Drill Masters', description: '+6% attack speed for every tower.',
        perLevel: 0.06, baseCost: 500, growth: 1.45, maxLevel: 10
    }
};

export function researchCost(id: ResearchId, currentLevel: number): number | null {
    const r = RESEARCH[id];
    if (currentLevel >= r.maxLevel) return null;
    return Math.round((r.baseCost * Math.pow(r.growth, currentLevel)) / 10) * 10;
}

export const WALL_REPAIR = {
    /** Health restored per purchase (capped at the starting health). */
    amount: 2,
    baseCost: 100,
    costPerWave: 10
};

export const WAVE_TIMING = {
    /** Seconds between waves when auto-start is enabled. */
    autoStartDelay: 8,
    /** Seconds between spawn groups. */
    groupGap: 1.6
};

export const SIMULATION = {
    /** Fixed simulation step (seconds). */
    step: 1 / 60,
    /** Maximum frame delta accepted (seconds) to avoid spiral of death after tab switches. */
    maxFrameDelta: 0.1,
    speeds: [1, 2, 3] as const
};

/** Visual lane spread: enemies walk slightly offset from the road centre so groups don't stack. */
export const LANE_SPREAD = 12;
