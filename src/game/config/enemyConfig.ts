/**
 * Enemy definitions. All enemy balancing lives here.
 * Base stats are for wave 1. Per-wave scaling is in gameConfig.SCALING.
 */

export type EnemyTypeId =
    | 'goblin' | 'orc' | 'wolfRider' | 'golem'
    | 'scorpion' | 'ifrit' | 'troll' | 'shaman' | 'wraith' | 'slime' | 'slimeling' | 'griffin' | 'mammoth' | 'djinn'
    | 'bossGoblinWarlord' | 'bossOrcWarchief' | 'bossScorpionKing' | 'bossColossus' | 'bossIfritKing'
    | 'bossTrollBehemoth' | 'bossGrandShaman' | 'bossHydra' | 'bossRoc' | 'bossShadowDjinn';

export interface EnemyDefinition {
    id: EnemyTypeId;
    name: string;
    description: string;
    hp: number;
    /** Pixels per second. */
    speed: number;
    reward: number;
    castleDamage: number;
    /** Physical damage reduction, from 0 to 1. */
    armor: number;
    /** Magic damage reduction, from 0 to 1. */
    magicResist: number;
    flying: boolean;
    /** Fraction of slow and freeze effects that is ignored. */
    slowResist: number;
    burnImmune: boolean;
    /** Fraction of max HP regenerated per second. */
    regen: number;
    healAura?: { radius: number; perSecond: number };
    splitInto?: { type: EnemyTypeId; count: number };
    summon?: { type: EnemyTypeId; count: number; interval: number };
    shield?: { interval: number; duration: number; reduction: number };
    haste?: { interval: number; duration: number; multiplier: number };
    blink?: { interval: number; distance: number };
    /** Display size in world pixels. */
    size: number;
    isBoss: boolean;
    /** Wave at which this enemy first appears (used for unlock announcements). */
    unlockWave: number;
}

const base = {
    armor: 0, magicResist: 0, flying: false, slowResist: 0, burnImmune: false, regen: 0, isBoss: false
};

export const ENEMIES: Record<EnemyTypeId, EnemyDefinition> = {
    goblin: {
        ...base, id: 'goblin', name: 'Goblin', description: 'A sneaky little raider. Weak, but there are many.',
        hp: 50, speed: 45, reward: 10, castleDamage: 1, size: 40, unlockWave: 1
    },
    orc: {
        ...base, id: 'orc', name: 'Orc', description: 'Tough brute with light armour.',
        hp: 120, speed: 30, reward: 20, castleDamage: 2, armor: 0.1, size: 50, unlockWave: 3
    },
    wolfRider: {
        ...base, id: 'wolfRider', name: 'Wolf Rider', description: 'Fast goblin cavalry. Slow them down!',
        hp: 65, speed: 75, reward: 15, castleDamage: 1, size: 50, unlockWave: 5
    },
    golem: {
        ...base, id: 'golem', name: 'Armored Golem', description: 'Slow stone giant. Heavy armour: use magic.',
        hp: 300, speed: 20, reward: 40, castleDamage: 4, armor: 0.5, slowResist: 0.3, size: 58, unlockWave: 6
    },
    scorpion: {
        ...base, id: 'scorpion', name: 'Sand Scorpion', description: 'Armoured and quick desert hunter.',
        hp: 90, speed: 60, reward: 18, castleDamage: 1, armor: 0.3, size: 46, unlockWave: 11
    },
    ifrit: {
        ...base, id: 'ifrit', name: 'Ifrit Wisp', description: 'A flying fire spirit. Immune to burning, and bombards cannot hit it.',
        hp: 110, speed: 52, reward: 22, castleDamage: 2, magicResist: 0.2, flying: true, burnImmune: true,
        size: 44, unlockWave: 21
    },
    troll: {
        ...base, id: 'troll', name: 'Cave Troll', description: 'Regenerates health quickly. Burst it down.',
        hp: 400, speed: 28, reward: 45, castleDamage: 3, armor: 0.15, regen: 0.02, size: 60, unlockWave: 31
    },
    shaman: {
        ...base, id: 'shaman', name: 'Goblin Shaman', description: 'Heals nearby enemies. Kill it first!',
        hp: 160, speed: 36, reward: 35, castleDamage: 2, magicResist: 0.3,
        healAura: { radius: 90, perSecond: 0.04 }, size: 46, unlockWave: 41
    },
    wraith: {
        ...base, id: 'wraith', name: 'Desert Wraith', description: 'Ghostly: physical attacks mostly pass through it.',
        hp: 220, speed: 46, reward: 40, castleDamage: 3, armor: 0.7, slowResist: 0.5, size: 50, unlockWave: 51
    },
    slime: {
        ...base, id: 'slime', name: 'Sand Slime', description: 'Splits into three slimelings when destroyed.',
        hp: 350, speed: 32, reward: 30, castleDamage: 3, magicResist: 0.25,
        splitInto: { type: 'slimeling', count: 3 }, size: 54, unlockWave: 61
    },
    slimeling: {
        ...base, id: 'slimeling', name: 'Slimeling', description: 'A small piece of a Sand Slime.',
        hp: 80, speed: 48, reward: 6, castleDamage: 1, magicResist: 0.25, size: 30, unlockWave: 61
    },
    griffin: {
        ...base, id: 'griffin', name: 'Griffin', description: 'Swift flyer. Bombards cannot hit it.',
        hp: 260, speed: 86, reward: 45, castleDamage: 3, flying: true, size: 58, unlockWave: 71
    },
    mammoth: {
        ...base, id: 'mammoth', name: 'War Mammoth', description: 'Colossal armoured beast that shrugs off slows.',
        hp: 2000, speed: 18, reward: 120, castleDamage: 6, armor: 0.4, slowResist: 0.5, size: 78, unlockWave: 81
    },
    djinn: {
        ...base, id: 'djinn', name: 'Shadow Djinn', description: 'Resists magic and blinks forward along the road.',
        hp: 600, speed: 54, reward: 80, castleDamage: 4, armor: 0.3, magicResist: 0.5, flying: true,
        blink: { interval: 5, distance: 90 }, size: 56, unlockWave: 91
    },

    // ----- Bosses (one every 10 levels) -----
    bossGoblinWarlord: {
        ...base, isBoss: true, id: 'bossGoblinWarlord', name: 'Goblin Warlord',
        description: 'Leads the horde and calls goblin reinforcements.',
        hp: 1500, speed: 26, reward: 250, castleDamage: 10, armor: 0.1,
        summon: { type: 'goblin', count: 3, interval: 6 }, size: 96, unlockWave: 10
    },
    bossOrcWarchief: {
        ...base, isBoss: true, id: 'bossOrcWarchief', name: 'Orc Warchief',
        description: 'Raises his great shield and blocks most damage for a while.',
        hp: 2600, speed: 22, reward: 400, castleDamage: 10, armor: 0.25,
        shield: { interval: 8, duration: 3, reduction: 0.75 }, size: 104, unlockWave: 20
    },
    bossScorpionKing: {
        ...base, isBoss: true, id: 'bossScorpionKing', name: 'Scorpion King',
        description: 'Heavily armoured. Charges in sudden bursts of speed.',
        hp: 3600, speed: 30, reward: 550, castleDamage: 10, armor: 0.45,
        haste: { interval: 7, duration: 2, multiplier: 2.4 }, size: 108, unlockWave: 30
    },
    bossColossus: {
        ...base, isBoss: true, id: 'bossColossus', name: 'Stone Colossus',
        description: 'A walking mountain. Nearly immune to physical harm.',
        hp: 6000, speed: 15, reward: 700, castleDamage: 12, armor: 0.65, slowResist: 0.6, size: 124, unlockWave: 40
    },
    bossIfritKing: {
        ...base, isBoss: true, id: 'bossIfritKing', name: 'Ifrit King',
        description: 'A flying lord of flame who summons wisps. Immune to fire.',
        hp: 5200, speed: 24, reward: 850, castleDamage: 12, magicResist: 0.2, flying: true, burnImmune: true,
        summon: { type: 'ifrit', count: 2, interval: 6 }, size: 112, unlockWave: 50
    },
    bossTrollBehemoth: {
        ...base, isBoss: true, id: 'bossTrollBehemoth', name: 'Troll Behemoth',
        description: 'Regenerates at a terrifying rate.',
        hp: 9000, speed: 17, reward: 1000, castleDamage: 14, armor: 0.25, regen: 0.012, size: 128, unlockWave: 60
    },
    bossGrandShaman: {
        ...base, isBoss: true, id: 'bossGrandShaman', name: 'Grand Shaman',
        description: 'Heals the whole horde and summons shamans.',
        hp: 8500, speed: 20, reward: 1150, castleDamage: 14, magicResist: 0.35,
        healAura: { radius: 150, perSecond: 0.03 }, summon: { type: 'shaman', count: 2, interval: 9 },
        size: 110, unlockWave: 70
    },
    bossHydra: {
        ...base, isBoss: true, id: 'bossHydra', name: 'Sand Hydra',
        description: 'When slain, it splits into three ravenous slimes.',
        hp: 13000, speed: 16, reward: 1300, castleDamage: 16, armor: 0.3, magicResist: 0.3,
        splitInto: { type: 'slime', count: 3 }, size: 132, unlockWave: 80
    },
    bossRoc: {
        ...base, isBoss: true, id: 'bossRoc', name: 'Great Roc',
        description: 'A colossal flying bird with blinding speed.',
        hp: 12000, speed: 40, reward: 1500, castleDamage: 16, flying: true, slowResist: 0.4,
        haste: { interval: 6, duration: 2, multiplier: 1.8 }, size: 136, unlockWave: 90
    },
    bossShadowDjinn: {
        ...base, isBoss: true, id: 'bossShadowDjinn', name: 'Shadow Djinn Emperor',
        description: 'The final threat. Shields, summons, and blinks forward.',
        hp: 24000, speed: 18, reward: 3000, castleDamage: 20, armor: 0.35, magicResist: 0.35, flying: true,
        slowResist: 0.5, shield: { interval: 10, duration: 3, reduction: 0.7 },
        summon: { type: 'djinn', count: 2, interval: 10 }, blink: { interval: 9, distance: 70 },
        size: 140, unlockWave: 100
    }
};

/** Regular enemies, in the order they are introduced. */
export const REGULAR_ENEMY_ORDER: EnemyTypeId[] = [
    'goblin', 'orc', 'wolfRider', 'golem', 'scorpion', 'ifrit', 'troll', 'shaman', 'wraith', 'slime', 'griffin', 'mammoth', 'djinn'
];

/** Boss for each boss wave (10, 20, ..., 100). */
export const BOSS_ORDER: EnemyTypeId[] = [
    'bossGoblinWarlord', 'bossOrcWarchief', 'bossScorpionKing', 'bossColossus', 'bossIfritKing',
    'bossTrollBehemoth', 'bossGrandShaman', 'bossHydra', 'bossRoc', 'bossShadowDjinn'
];
