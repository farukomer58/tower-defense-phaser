import type { DamageType, ProjectileKind } from '../config/towerConfig';

/** Everything a projectile carries to apply on impact. */
export interface HitPayload {
    towerId: number;
    damage: number;
    damageType: DamageType;
    canHitFlying: boolean;
    splashRadius: number;
    armorPierce: number;
    armoredBonus: number;
    crit: boolean;
    slowAmount: number;
    slowDuration: number;
    freezeChance: number;
    freezeDuration: number;
    burnDps: number;
    burnDuration: number;
    chainCount: number;
    chainFalloff: number;
    clusterCount: number;
}

/**
 * Projectiles either home in on a target enemy (arrows, orbs, ice, bullets)
 * or fly to a fixed ground point and explode there (cannonballs, fire pots).
 */
export class Projectile {
    readonly id: number;
    readonly kind: ProjectileKind;
    readonly payload: HitPayload;
    readonly speed: number;
    readonly homing: boolean;
    readonly startX: number;
    readonly startY: number;
    x: number;
    y: number;
    targetId: number | null;
    /** Destination (the last known target position for homing projectiles). */
    tx: number;
    ty: number;
    alive = true;
    traveled = 0;
    /** Total planned distance, used for the arc height of lobbed shots. */
    plannedDistance: number;
    age = 0;

    constructor(id: number, kind: ProjectileKind, x: number, y: number, tx: number, ty: number,
        speed: number, payload: HitPayload, targetId: number | null) {
        this.id = id;
        this.kind = kind;
        this.x = this.startX = x;
        this.y = this.startY = y;
        this.tx = tx;
        this.ty = ty;
        this.speed = speed;
        this.payload = payload;
        this.targetId = targetId;
        this.homing = targetId !== null;
        this.plannedDistance = Math.max(1, Math.hypot(tx - x, ty - y));
    }

    /** 0..1 progress for lobbed projectiles (used for the arc). */
    get progress(): number {
        return Math.min(1, this.traveled / this.plannedDistance);
    }

    get isLobbed(): boolean {
        return !this.homing;
    }
}
