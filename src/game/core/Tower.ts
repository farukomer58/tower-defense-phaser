import { ECONOMY, TILE_SIZE } from '../config/gameConfig';
import { MAX_TOWER_LEVEL, TOWERS, type TowerDefinition, type TowerLevelStats, type TowerTypeId } from '../config/towerConfig';

export type TargetingMode = 'first' | 'last' | 'strongest' | 'closest';
export const TARGETING_MODES: TargetingMode[] = ['first', 'last', 'strongest', 'closest'];

export interface TowerBuff { damage: number; fireRate: number; range: number }

/** Plain simulation object for one placed tower. */
export class Tower {
    readonly id: number;
    readonly type: TowerTypeId;
    readonly def: TowerDefinition;
    readonly c: number;
    readonly r: number;
    readonly x: number;
    readonly y: number;
    level = 1;
    invested: number;
    cooldown = 0;
    targeting: TargetingMode = 'first';
    kills = 0;
    damageDealt = 0;
    /** Aim angle in radians (world space), for turret rotation. */
    aimAngle = 0;
    buff: TowerBuff = { damage: 0, fireRate: 0, range: 0 };
    /** Kingdom-wide multipliers from the Treasury. */
    global = { damage: 1, fireRate: 1 };

    constructor(id: number, type: TowerTypeId, c: number, r: number) {
        this.id = id;
        this.type = type;
        this.def = TOWERS[type];
        this.c = c;
        this.r = r;
        this.x = (c + 0.5) * TILE_SIZE;
        this.y = (r + 0.5) * TILE_SIZE;
        this.invested = this.def.cost;
    }

    get stats(): TowerLevelStats { return this.def.levels[this.level - 1]; }
    get isSupport(): boolean { return this.def.projectile === null; }
    get range(): number { return this.stats.range * (1 + this.buff.range); }
    get damage(): number { return this.stats.damage * (1 + this.buff.damage) * this.global.damage; }
    get fireRate(): number { return this.stats.fireRate * (1 + this.buff.fireRate) * this.global.fireRate; }
    get isMaxLevel(): boolean { return this.level >= MAX_TOWER_LEVEL; }

    /** Cost of the next upgrade, or null when at max level. */
    get upgradeCost(): number | null {
        return this.isMaxLevel ? null : this.def.upgradeCosts[this.level - 1];
    }

    get sellValue(): number {
        return Math.floor(this.invested * ECONOMY.sellRefundRatio);
    }

    statsAtLevel(level: number): TowerLevelStats {
        return this.def.levels[Math.min(MAX_TOWER_LEVEL, Math.max(1, level)) - 1];
    }
}
