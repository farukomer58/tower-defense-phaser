/**
 * Tower definitions. All tower balancing lives here.
 * Each tower has 5 levels: level 1 is the base and levels 2-5 are bought upgrades.
 */

export type TowerTypeId = 'archer' | 'cannon' | 'dervish' | 'frost' | 'janissary' | 'naphtha' | 'mehter';
export type DamageType = 'physical' | 'magic' | 'fire';
export type ProjectileKind = 'arrow' | 'cannonball' | 'orb' | 'ice' | 'bullet' | 'firepot' | 'bomblet';

export interface TowerLevelStats {
    damage: number;
    /** Attack radius in world pixels. */
    range: number;
    /** Attacks per second. */
    fireRate: number;
    splashRadius?: number;
    /** Movement speed multiplier is (1 - slowAmount). */
    slowAmount?: number;
    slowDuration?: number;
    freezeChance?: number;
    freezeDuration?: number;
    burnDps?: number;
    burnDuration?: number;
    /** Fraction of the enemy's armour that is ignored. */
    armorPierce?: number;
    critChance?: number;
    critMultiplier?: number;
    /** Number of simultaneous arrows at different targets. */
    multiShot?: number;
    /** Extra enemies hit by chain lightning, and the damage kept per jump. */
    chainCount?: number;
    chainFalloff?: number;
    /** Number of bomblets scattered on impact. */
    clusterCount?: number;
    /** Support aura (Mehter): buffs for towers in range. */
    auraDamage?: number;
    auraFireRate?: number;
    auraRange?: number;
}

export interface TowerDefinition {
    id: TowerTypeId;
    name: string;
    title: string;
    shortDescription: string;
    description: string;
    cost: number;
    /** Wave number at which the tower becomes available. */
    unlockWave: number;
    damageType: DamageType;
    projectile: ProjectileKind | null;
    projectileSpeed: number;
    canHitFlying: boolean;
    /** Damage multiplier against enemies whose armour is at least `armoredThreshold`. */
    armoredBonus?: number;
    /** Ability text shown in the info panel, unlocked at max level. */
    ability: { name: string; description: string };
    /** Costs to upgrade to level 2, 3, 4 and 5. */
    upgradeCosts: number[];
    levels: TowerLevelStats[];
    /** Hotkey colour accent used by the UI. */
    color: string;
}

export const MAX_TOWER_LEVEL = 5;
export const ARMORED_THRESHOLD = 0.25;

const upgradeCosts = (base: number, factors = [0.8, 1.4, 2.2, 3.4]) => factors.map((f) => Math.round((base * f) / 5) * 5);

export const TOWERS: Record<TowerTypeId, TowerDefinition> = {
    archer: {
        id: 'archer',
        name: 'Archer Tower',
        title: 'Okçu Kulesi',
        shortDescription: 'Fast single-target arrows.',
        description: 'Composite-bow archers fire swift arrows at a single foe. Reliable and cheap.',
        cost: 50,
        unlockWave: 1,
        damageType: 'physical',
        projectile: 'arrow',
        projectileSpeed: 620,
        canHitFlying: true,
        ability: { name: 'Arrow Volley', description: 'At level 5, fires at 3 enemies at once.' },
        upgradeCosts: upgradeCosts(50),
        color: '#c8873a',
        levels: [
            { damage: 10, range: 150, fireRate: 1.0 },
            { damage: 16, range: 160, fireRate: 1.1 },
            { damage: 26, range: 170, fireRate: 1.25 },
            { damage: 40, range: 180, fireRate: 1.4 },
            { damage: 58, range: 190, fireRate: 1.6, multiShot: 3 }
        ]
    },
    cannon: {
        id: 'cannon',
        name: 'Bombard Bastion',
        title: 'Topçu Tabyası',
        shortDescription: 'Slow, heavy area damage.',
        description: 'Great bronze bombards lob cannonballs that explode on impact. Cannot hit flying enemies.',
        cost: 100,
        unlockWave: 1,
        damageType: 'physical',
        projectile: 'cannonball',
        projectileSpeed: 360,
        canHitFlying: false,
        ability: { name: 'Cluster Shot', description: 'At level 5, each blast scatters 3 bomblets.' },
        upgradeCosts: upgradeCosts(100),
        color: '#8a6a4a',
        levels: [
            { damage: 30, range: 125, fireRate: 0.5, splashRadius: 55 },
            { damage: 48, range: 132, fireRate: 0.55, splashRadius: 60 },
            { damage: 75, range: 140, fireRate: 0.6, splashRadius: 66 },
            { damage: 115, range: 148, fireRate: 0.65, splashRadius: 72 },
            { damage: 170, range: 156, fireRate: 0.7, splashRadius: 80, clusterCount: 3 }
        ]
    },
    dervish: {
        id: 'dervish',
        name: 'Dervish Sanctum',
        title: 'Derviş Tekkesi',
        shortDescription: 'Magic orbs pierce armour.',
        description: 'Whirling mystics fire orbs of light. Magic ignores armour and deals +50% to armoured foes.',
        cost: 125,
        unlockWave: 1,
        damageType: 'magic',
        projectile: 'orb',
        projectileSpeed: 420,
        canHitFlying: true,
        armoredBonus: 1.5,
        ability: { name: 'Chain Light', description: 'At level 5, orbs arc to 3 more enemies.' },
        upgradeCosts: upgradeCosts(125),
        color: '#7b5cd6',
        levels: [
            { damage: 15, range: 175, fireRate: 0.8 },
            { damage: 24, range: 182, fireRate: 0.85 },
            { damage: 38, range: 190, fireRate: 0.9 },
            { damage: 58, range: 198, fireRate: 1.0 },
            { damage: 85, range: 206, fireRate: 1.1, chainCount: 3, chainFalloff: 0.65 }
        ]
    },
    frost: {
        id: 'frost',
        name: 'Frost Fountain',
        title: 'Buz Çeşmesi',
        shortDescription: 'Ice shards slow enemies.',
        description: 'An enchanted marble fountain hurls ice shards that slow enemies for a short time.',
        cost: 75,
        unlockWave: 1,
        damageType: 'magic',
        projectile: 'ice',
        projectileSpeed: 480,
        canHitFlying: true,
        ability: { name: 'Deep Freeze', description: 'At level 5, 15% chance to freeze enemies solid.' },
        upgradeCosts: upgradeCosts(75),
        color: '#5ec8e8',
        levels: [
            { damage: 5, range: 140, fireRate: 1.0, slowAmount: 0.4, slowDuration: 2 },
            { damage: 8, range: 146, fireRate: 1.05, slowAmount: 0.45, slowDuration: 2.2 },
            { damage: 12, range: 152, fireRate: 1.1, slowAmount: 0.5, slowDuration: 2.4, splashRadius: 36 },
            { damage: 18, range: 158, fireRate: 1.15, slowAmount: 0.55, slowDuration: 2.6, splashRadius: 42 },
            {
                damage: 26, range: 166, fireRate: 1.2, slowAmount: 0.6, slowDuration: 3, splashRadius: 50,
                freezeChance: 0.15, freezeDuration: 0.8
            }
        ]
    },
    janissary: {
        id: 'janissary',
        name: 'Janissary Post',
        title: 'Yeniçeri Karakolu',
        shortDescription: 'Long-range armour-piercing shots.',
        description: 'Elite musketeers snipe from afar. Their shots ignore half of enemy armour.',
        cost: 150,
        unlockWave: 11,
        damageType: 'physical',
        projectile: 'bullet',
        projectileSpeed: 1400,
        canHitFlying: true,
        ability: { name: 'Marksman', description: 'At level 5, 25% chance to deal triple damage.' },
        upgradeCosts: upgradeCosts(150),
        color: '#c0392b',
        levels: [
            { damage: 55, range: 240, fireRate: 0.45, armorPierce: 0.5 },
            { damage: 85, range: 250, fireRate: 0.48, armorPierce: 0.55 },
            { damage: 130, range: 260, fireRate: 0.52, armorPierce: 0.6 },
            { damage: 195, range: 270, fireRate: 0.56, armorPierce: 0.65 },
            { damage: 290, range: 285, fireRate: 0.6, armorPierce: 0.7, critChance: 0.25, critMultiplier: 3 }
        ]
    },
    naphtha: {
        id: 'naphtha',
        name: 'Naphtha Kiln',
        title: 'Neft Ocağı',
        shortDescription: 'Fire pots burn groups.',
        description: 'Throws pots of burning naphtha that set every enemy in the blast ablaze.',
        cost: 160,
        unlockWave: 21,
        damageType: 'fire',
        projectile: 'firepot',
        projectileSpeed: 340,
        canHitFlying: true,
        ability: { name: 'Inferno', description: 'At level 5, flames burn longer and hotter.' },
        upgradeCosts: upgradeCosts(160),
        color: '#e67e22',
        levels: [
            { damage: 6, range: 125, fireRate: 0.6, splashRadius: 45, burnDps: 18, burnDuration: 3 },
            { damage: 10, range: 130, fireRate: 0.62, splashRadius: 50, burnDps: 28, burnDuration: 3 },
            { damage: 15, range: 136, fireRate: 0.65, splashRadius: 55, burnDps: 42, burnDuration: 3.2 },
            { damage: 22, range: 142, fireRate: 0.68, splashRadius: 60, burnDps: 62, burnDuration: 3.4 },
            { damage: 32, range: 150, fireRate: 0.72, splashRadius: 70, burnDps: 92, burnDuration: 4.2 }
        ]
    },
    mehter: {
        id: 'mehter',
        name: 'Mehter Pavilion',
        title: 'Mehterhane',
        shortDescription: 'War drums empower towers.',
        description: 'The thunder of the mehter band makes nearby towers hit harder and faster. Does not attack. Auras from several pavilions do not stack.',
        cost: 200,
        unlockWave: 31,
        damageType: 'physical',
        projectile: null,
        projectileSpeed: 0,
        canHitFlying: false,
        ability: { name: 'Battle Hymn', description: 'At level 5, buffed towers also gain +10% range.' },
        upgradeCosts: upgradeCosts(200),
        color: '#d4a017',
        levels: [
            { damage: 0, range: 140, fireRate: 0, auraDamage: 0.15, auraFireRate: 0.1 },
            { damage: 0, range: 150, fireRate: 0, auraDamage: 0.2, auraFireRate: 0.12 },
            { damage: 0, range: 160, fireRate: 0, auraDamage: 0.25, auraFireRate: 0.15 },
            { damage: 0, range: 170, fireRate: 0, auraDamage: 0.3, auraFireRate: 0.18 },
            { damage: 0, range: 185, fireRate: 0, auraDamage: 0.4, auraFireRate: 0.22, auraRange: 0.1 }
        ]
    }
};

export const TOWER_ORDER: TowerTypeId[] = ['archer', 'cannon', 'dervish', 'frost', 'janissary', 'naphtha', 'mehter'];

export function towerTextureTier(level: number): 1 | 2 | 3 {
    return level >= 5 ? 3 : level >= 3 ? 2 : 1;
}
