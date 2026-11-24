import { ENEMIES, type EnemyDefinition, type EnemyTypeId } from '../config/enemyConfig';
import { RANKS, SCALING, type DifficultyDefinition, type EnemyRank } from '../config/gameConfig';

export interface EnemySpawnOptions {
    id: number;
    type: EnemyTypeId;
    rank: EnemyRank;
    wave: number;
    difficulty: DifficultyDefinition;
    distance?: number;
    laneOffset?: number;
    /** Reward multiplier (e.g. summoned minions give less). */
    rewardFactor?: number;
}

/** Plain simulation object for one enemy. It has no rendering code. */
export class Enemy {
    readonly id: number;
    readonly type: EnemyTypeId;
    readonly def: EnemyDefinition;
    readonly rank: EnemyRank;
    readonly maxHp: number;
    hp: number;
    readonly baseSpeed: number;
    readonly reward: number;
    readonly castleDamage: number;
    readonly scale: number;

    distance: number;
    laneOffset: number;
    x = 0;
    y = 0;
    dirX = 1;
    dirY = 0;

    alive = true;
    /** True once the reward or leak has been processed. Guards against duplicate rewards. */
    resolved = false;
    leaked = false;

    slowAmount = 0;
    slowTimer = 0;
    freezeTimer = 0;
    burnDps = 0;
    burnTimer = 0;
    burnTowerId = -1;

    shieldTimer = 0;
    shieldCooldown: number;
    hasteTimer = 0;
    hasteCooldown: number;
    summonCooldown: number;
    blinkCooldown: number;

    /** Seconds since the last time the enemy took damage (used for hit flashes). */
    lastHitAge = 99;
    age = 0;

    constructor(o: EnemySpawnOptions) {
        this.id = o.id;
        this.type = o.type;
        this.def = ENEMIES[o.type];
        this.rank = o.rank;
        const rank = RANKS[o.rank];
        this.maxHp = Math.round(this.def.hp * SCALING.hpMultiplier(o.wave) * rank.hp * o.difficulty.enemyHpMultiplier);
        this.hp = this.maxHp;
        this.baseSpeed = this.def.speed * SCALING.speedMultiplier(o.wave) * rank.speed;
        this.reward = Math.max(1, Math.round(this.def.reward * SCALING.rewardMultiplier(o.wave) * rank.reward
            * o.difficulty.rewardMultiplier * (o.rewardFactor ?? 1)));
        this.castleDamage = this.def.castleDamage + rank.castleDamageBonus;
        this.scale = rank.scale;
        this.distance = o.distance ?? 0;
        this.laneOffset = o.laneOffset ?? 0;
        this.shieldCooldown = this.def.shield?.interval ?? 0;
        this.hasteCooldown = this.def.haste?.interval ?? 0;
        this.summonCooldown = this.def.summon?.interval ?? 0;
        this.blinkCooldown = this.def.blink?.interval ?? 0;
    }

    get isShielded(): boolean { return this.shieldTimer > 0; }
    get isFrozen(): boolean { return this.freezeTimer > 0; }
    get isSlowed(): boolean { return this.slowTimer > 0; }
    get isBurning(): boolean { return this.burnTimer > 0; }
    get hpFraction(): number { return this.hp / this.maxHp; }
    get armor(): number { return this.def.armor; }
    get magicResist(): number { return this.def.magicResist; }
    get flying(): boolean { return this.def.flying; }
    get size(): number { return this.def.size * this.scale; }

    /** Current movement speed in px/s including slows, freezes and haste. */
    get currentSpeed(): number {
        if (!this.alive) return 0;
        const resist = this.def.slowResist;
        if (this.freezeTimer > 0) return 0;
        let s = this.baseSpeed;
        if (this.slowTimer > 0) s *= 1 - this.slowAmount * (1 - resist);
        if (this.hasteTimer > 0 && this.def.haste) s *= this.def.haste.multiplier;
        return s;
    }

    /** Applies already-mitigated damage. Returns the damage actually dealt (0 if already dead). */
    applyDamage(amount: number): number {
        if (!this.alive || amount <= 0) return 0;
        const dealt = Math.min(this.hp, amount);
        this.hp -= dealt;
        this.lastHitAge = 0;
        return dealt;
    }

    heal(amount: number): void {
        if (!this.alive) return;
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    applySlow(amount: number, duration: number): void {
        if (!this.alive) return;
        // Keep the stronger slow; refresh the duration.
        if (amount >= this.slowAmount || this.slowTimer <= 0) this.slowAmount = amount;
        this.slowTimer = Math.max(this.slowTimer, duration);
    }

    applyFreeze(duration: number): boolean {
        if (!this.alive || this.def.isBoss) return false;
        this.freezeTimer = Math.max(this.freezeTimer, duration * (1 - this.def.slowResist));
        return this.freezeTimer > 0;
    }

    applyBurn(dps: number, duration: number, towerId: number): void {
        if (!this.alive || this.def.burnImmune) return;
        if (dps >= this.burnDps || this.burnTimer <= 0) {
            this.burnDps = dps;
            this.burnTowerId = towerId;
        }
        this.burnTimer = Math.max(this.burnTimer, duration);
    }
}
