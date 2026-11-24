import { DIFFICULTIES, ECONOMY, RESEARCH, WALL_REPAIR, researchCost, type ResearchId, SIMULATION, TOTAL_WAVES, WAVE_TIMING, WORLD_HEIGHT, WORLD_WIDTH, LANE_SPREAD, type DifficultyDefinition, type DifficultyId, type EnemyRank } from '../config/gameConfig';
import { ENEMIES, type EnemyTypeId } from '../config/enemyConfig';
import { getMap, type MapDefinition } from '../config/mapConfig';
import { TOWERS, TOWER_ORDER, type TowerTypeId } from '../config/towerConfig';
import type { WaveDefinition } from '../config/waveConfig';
import { mitigatedDamage } from './Combat';
import { Economy } from './Economy';
import { Enemy } from './Enemy';
import { EventBus } from './EventBus';
import { Path, type PathSample } from './Path';
import { PlacementGrid, type PlacementResult } from './PlacementGrid';
import { Projectile, type HitPayload } from './Projectile';
import { mulberry32 } from './rng';
import { selectTargets } from './Targeting';
import { Tower, type TargetingMode } from './Tower';
import { WaveManager } from './WaveManager';
import { dist2 } from './math';

export type GameStatus = 'playing' | 'won' | 'lost';

export interface UnlockInfo { kind: 'tower' | 'enemy'; id: string; name: string; description: string }

export type SimEvents = {
    enemySpawned: [Enemy];
    enemyKilled: [Enemy, number];
    enemyLeaked: [Enemy];
    enemyDamaged: [Enemy, number, boolean];
    enemyFrozen: [Enemy];
    enemySummoned: [Enemy];
    enemyBlinked: [Enemy, number, number];
    shieldRaised: [Enemy];
    bossSpawned: [Enemy];
    towerPlaced: [Tower];
    towerUpgraded: [Tower];
    towerSold: [Tower, number];
    researchBought: [ResearchId, number];
    towerFired: [Tower, Projectile];
    projectileHit: [Projectile];
    explosion: [number, number, number, string];
    chain: [{ x: number; y: number }[]];
    coinsChanged: [number];
    healthChanged: [number, number];
    waveStarted: [number, WaveDefinition];
    waveCompleted: [number, number];
    unlocked: [UnlockInfo[]];
    gameOver: [];
    victory: [];
};

export type ActionFailure = Exclude<PlacementResult, 'ok'> | 'locked' | 'insufficient_funds' | 'max_level' | 'not_found' | 'game_over';
export type ActionResult<T = void> = { ok: true; value: T } | { ok: false; reason: ActionFailure };

export interface SavedTower { type: TowerTypeId; c: number; r: number; level: number; invested: number; targeting: TargetingMode; kills: number; damageDealt: number }

export interface SaveData {
    version: 1;
    mapId: string;
    difficulty: DifficultyId;
    completedWaves: number;
    coins: number;
    health: number;
    breached: number;
    stats: SimStats;
    research?: Record<ResearchId, number>;
    towers: SavedTower[];
    savedAt: number;
}

export interface SimStats { kills: number; bossesDefeated: number; towersBuilt: number; coinsEarned: number }

export interface SimOptions { mapId: string; difficulty: DifficultyId; seed?: number; save?: SaveData }

/**
 * The authoritative game simulation. It never touches Phaser or the DOM.
 * Call `advance(dt)` with scaled seconds; it runs fixed-size steps internally.
 */
export class Simulation {
    readonly events = new EventBus<SimEvents>();
    readonly map: MapDefinition;
    readonly path: Path;
    readonly grid: PlacementGrid;
    readonly economy: Economy;
    readonly waves: WaveManager;
    readonly difficulty: DifficultyDefinition;
    readonly difficultyId: DifficultyId;

    enemies: Enemy[] = [];
    towers: Tower[] = [];
    projectiles: Projectile[] = [];
    health: number;
    readonly maxHealth: number;
    breached = 0;
    status: GameStatus = 'playing';
    time = 0;
    autoStart = false;
    /** Seconds until the next wave auto-starts (null when not counting down). */
    countdown: number | null = null;
    stats: SimStats = { kills: 0, bossesDefeated: 0, towersBuilt: 0, coinsEarned: 0 };
    research: Record<ResearchId, number> = { damage: 0, fireRate: 0 };

    private nextId = 1;
    private accumulator = 0;
    private readonly rng: () => number;
    private readonly enemyIndex = new Map<number, Enemy>();
    private readonly sampleTmp: PathSample = { x: 0, y: 0, dx: 1, dy: 0 };

    constructor(opts: SimOptions) {
        const save = opts.save;
        this.map = getMap(save?.mapId ?? opts.mapId);
        this.difficultyId = save?.difficulty ?? opts.difficulty;
        this.difficulty = DIFFICULTIES[this.difficultyId] ?? DIFFICULTIES.normal;
        this.path = new Path(this.map.waypoints);
        this.grid = new PlacementGrid(this.map, this.path.cells);
        this.rng = mulberry32(opts.seed ?? 1234);
        this.maxHealth = this.difficulty.startHealth;
        this.health = save ? Math.min(this.maxHealth, Math.max(1, save.health)) : this.maxHealth;
        this.economy = new Economy(save ? save.coins : this.difficulty.startCoins, (c) => this.events.emit('coinsChanged', c));
        this.waves = new WaveManager(TOTAL_WAVES, save ? Math.min(TOTAL_WAVES - 1, save.completedWaves) : 0);
        if (save) {
            this.breached = save.breached;
            this.stats = { ...save.stats };
            if (save.research) {
                for (const id of Object.keys(RESEARCH) as ResearchId[]) {
                    this.research[id] = Math.max(0, Math.min(RESEARCH[id].maxLevel, save.research[id] ?? 0));
                }
            }
            for (const st of save.towers) {
                if (this.grid.check(st.c, st.r) !== 'ok' || !TOWERS[st.type]) continue;
                const t = this.createTower(st.type, st.c, st.r);
                t.level = Math.max(1, Math.min(5, st.level));
                t.invested = st.invested;
                t.targeting = st.targeting;
                t.kills = st.kills;
                t.damageDealt = st.damageDealt ?? 0;
            }
            this.recomputeBuffs();
        }
    }

    // ------------------------------------------------------------------ queries

    get completedWaves(): number { return this.waves.completedWaves; }
    get currentWave(): number { return this.waves.currentWave; }
    get isWaveActive(): boolean { return this.waves.isActive; }
    get enemiesRemaining(): number {
        return (this.waves.isActive ? this.waves.remainingToSpawn : 0) + this.enemies.length;
    }

    enemyById(id: number): Enemy | undefined { return this.enemyIndex.get(id); }
    towerById(id: number): Tower | undefined { return this.towers.find((t) => t.id === id); }

    isTowerUnlocked(type: TowerTypeId): boolean {
        return TOWERS[type].unlockWave <= this.completedWaves + 1;
    }

    canPlace(type: TowerTypeId, c: number, r: number): ActionResult {
        if (this.status !== 'playing') return { ok: false, reason: 'game_over' };
        if (!this.isTowerUnlocked(type)) return { ok: false, reason: 'locked' };
        const res = this.grid.check(c, r);
        if (res !== 'ok') return { ok: false, reason: res };
        if (!this.economy.canAfford(TOWERS[type].cost)) return { ok: false, reason: 'insufficient_funds' };
        return { ok: true, value: undefined };
    }

    // ------------------------------------------------------------------ commands

    placeTower(type: TowerTypeId, c: number, r: number): ActionResult<Tower> {
        const check = this.canPlace(type, c, r);
        if (!check.ok) return check;
        if (!this.economy.spend(TOWERS[type].cost)) return { ok: false, reason: 'insufficient_funds' };
        const tower = this.createTower(type, c, r);
        this.stats.towersBuilt++;
        this.recomputeBuffs();
        this.events.emit('towerPlaced', tower);
        return { ok: true, value: tower };
    }

    upgradeTower(id: number): ActionResult<Tower> {
        if (this.status !== 'playing') return { ok: false, reason: 'game_over' };
        const t = this.towerById(id);
        if (!t) return { ok: false, reason: 'not_found' };
        const cost = t.upgradeCost;
        if (cost === null) return { ok: false, reason: 'max_level' };
        if (!this.economy.spend(cost)) return { ok: false, reason: 'insufficient_funds' };
        t.level++;
        t.invested += cost;
        this.recomputeBuffs();
        this.events.emit('towerUpgraded', t);
        return { ok: true, value: t };
    }

    sellTower(id: number): ActionResult<number> {
        if (this.status !== 'playing') return { ok: false, reason: 'game_over' };
        const idx = this.towers.findIndex((t) => t.id === id);
        if (idx < 0) return { ok: false, reason: 'not_found' };
        const t = this.towers[idx];
        const refund = t.sellValue;
        this.towers.splice(idx, 1);
        this.grid.release(t.c, t.r);
        this.economy.refund(refund);
        this.recomputeBuffs();
        this.events.emit('towerSold', t, refund);
        return { ok: true, value: refund };
    }

    researchCost(id: ResearchId): number | null {
        return researchCost(id, this.research[id]);
    }

    buyResearch(id: ResearchId): ActionResult<number> {
        if (this.status !== 'playing') return { ok: false, reason: 'game_over' };
        const cost = this.researchCost(id);
        if (cost === null) return { ok: false, reason: 'max_level' };
        if (!this.economy.spend(cost)) return { ok: false, reason: 'insufficient_funds' };
        this.research[id]++;
        this.recomputeBuffs();
        this.events.emit('researchBought', id, this.research[id]);
        return { ok: true, value: this.research[id] };
    }

    get repairCost(): number | null {
        if (this.health >= this.maxHealth) return null;
        return WALL_REPAIR.baseCost + WALL_REPAIR.costPerWave * this.completedWaves;
    }

    repairWalls(): ActionResult<number> {
        if (this.status !== 'playing') return { ok: false, reason: 'game_over' };
        const cost = this.repairCost;
        if (cost === null) return { ok: false, reason: 'max_level' };
        if (!this.economy.spend(cost)) return { ok: false, reason: 'insufficient_funds' };
        const healed = Math.min(this.maxHealth, this.health + WALL_REPAIR.amount) - this.health;
        this.health += healed;
        this.events.emit('healthChanged', this.health, healed);
        return { ok: true, value: healed };
    }

    setTargeting(id: number, mode: TargetingMode): void {
        const t = this.towerById(id);
        if (t) t.targeting = mode;
    }

    startNextWave(): boolean {
        if (this.status !== 'playing') return false;
        const def = this.waves.startNext();
        if (!def) return false;
        this.countdown = null;
        const w = this.waves.currentWave;
        this.events.emit('waveStarted', w, def);
        const newcomers: UnlockInfo[] = [];
        const seen = new Set<EnemyTypeId>();
        for (const grp of def.groups) {
            const e = ENEMIES[grp.type];
            if (e.isBoss || seen.has(grp.type) || e.unlockWave !== w || w === 1) continue;
            seen.add(grp.type);
            newcomers.push({ kind: 'enemy', id: e.id, name: e.name, description: e.description });
        }
        if (newcomers.length) this.events.emit('unlocked', newcomers);
        return true;
    }

    // ------------------------------------------------------------------ simulation loop

    /** Advance the simulation by `dt` (already multiplied by game speed) seconds. */
    advance(dt: number): void {
        if (this.status !== 'playing' || dt <= 0) return;
        this.accumulator += Math.min(dt, SIMULATION.maxFrameDelta * SIMULATION.speeds[SIMULATION.speeds.length - 1]);
        let steps = 0;
        while (this.accumulator >= SIMULATION.step && steps < 40) {
            this.tick(SIMULATION.step);
            this.accumulator -= SIMULATION.step;
            steps++;
            if (this.status !== 'playing') { this.accumulator = 0; break; }
        }
    }

    tick(dt: number): void {
        if (this.status !== 'playing') return;
        this.time += dt;

        if (this.waves.isActive) {
            const completed = this.waves.update(dt, this.enemies.length, (s) => this.spawnEnemy(s.type, s.rank, 0));
            if (completed) this.onWaveCompleted();
        } else if (this.autoStart && this.waves.hasMoreWaves) {
            if (this.countdown === null) this.countdown = WAVE_TIMING.autoStartDelay;
            this.countdown -= dt;
            if (this.countdown <= 0) this.startNextWave();
        } else {
            this.countdown = null;
        }

        this.updateEnemies(dt);
        if (this.status !== 'playing') return;
        this.updateTowers(dt);
        this.updateProjectiles(dt);

        // Remove resolved enemies and projectiles.
        if (this.enemies.some((e) => !e.alive)) {
            this.enemies = this.enemies.filter((e) => {
                if (!e.alive) this.enemyIndex.delete(e.id);
                return e.alive;
            });
        }
        if (this.projectiles.some((p) => !p.alive)) this.projectiles = this.projectiles.filter((p) => p.alive);
    }

    private onWaveCompleted(): void {
        const w = this.waves.currentWave;
        const bonus = Math.round((ECONOMY.waveBonusBase + ECONOMY.waveBonusPerWave * w) * this.difficulty.rewardMultiplier);
        this.economy.earn(bonus);
        this.stats.coinsEarned += bonus;
        this.projectiles = [];
        this.events.emit('waveCompleted', w, bonus);
        if (w >= this.waves.totalWaves) {
            this.status = 'won';
            this.events.emit('victory');
            return;
        }
        const towers: UnlockInfo[] = TOWER_ORDER.filter((t) => TOWERS[t].unlockWave === w + 1)
            .map((t) => ({ kind: 'tower', id: t, name: TOWERS[t].name, description: TOWERS[t].description }));
        if (towers.length) this.events.emit('unlocked', towers);
    }

    // ------------------------------------------------------------------ enemies

    spawnEnemy(type: EnemyTypeId, rank: EnemyRank, distance: number, rewardFactor = 1): Enemy {
        const e = new Enemy({
            id: this.nextId++, type, rank, wave: Math.max(1, this.waves.currentWave), difficulty: this.difficulty,
            distance: Math.max(0, distance), laneOffset: ENEMIES[type].isBoss ? 0 : (this.rng() * 2 - 1) * LANE_SPREAD, rewardFactor
        });
        this.updateEnemyPosition(e);
        this.enemies.push(e);
        this.enemyIndex.set(e.id, e);
        this.events.emit('enemySpawned', e);
        if (e.def.isBoss) this.events.emit('bossSpawned', e);
        return e;
    }

    private updateEnemyPosition(e: Enemy): void {
        const s = this.path.sample(e.distance, this.sampleTmp);
        e.x = s.x - s.dy * e.laneOffset;
        e.y = s.y + s.dx * e.laneOffset;
        e.dirX = s.dx;
        e.dirY = s.dy;
    }

    private updateEnemies(dt: number): void {
        const count = this.enemies.length;
        for (let i = 0; i < count; i++) {
            const e = this.enemies[i];
            if (!e.alive) continue;
            e.age += dt;
            e.lastHitAge += dt;
            const d = e.def;

            if (e.slowTimer > 0) { e.slowTimer -= dt; if (e.slowTimer <= 0) e.slowAmount = 0; }
            if (e.freezeTimer > 0) e.freezeTimer -= dt;
            if (e.burnTimer > 0) {
                e.burnTimer -= dt;
                this.damageEnemy(e, mitigatedDamage(e, e.burnDps * dt, 'fire'), e.burnTowerId, false, true);
                if (!e.alive) continue;
            }
            // Burning stops regeneration, which is how players counter trolls.
            if (d.regen > 0 && e.burnTimer <= 0) e.heal(e.maxHp * d.regen * dt);
            if (d.healAura) {
                const r2 = d.healAura.radius * d.healAura.radius;
                for (const o of this.enemies) {
                    if (o.alive && dist2(o.x, o.y, e.x, e.y) <= r2) o.heal(o.maxHp * d.healAura.perSecond * dt);
                }
            }
            if (d.shield) {
                if (e.shieldTimer > 0) e.shieldTimer -= dt;
                else if ((e.shieldCooldown -= dt) <= 0) {
                    e.shieldTimer = d.shield.duration;
                    e.shieldCooldown = d.shield.interval;
                    this.events.emit('shieldRaised', e);
                }
            }
            if (d.haste) {
                if (e.hasteTimer > 0) e.hasteTimer -= dt;
                else if ((e.hasteCooldown -= dt) <= 0) {
                    e.hasteTimer = d.haste.duration;
                    e.hasteCooldown = d.haste.interval;
                }
            }
            if (d.summon && (e.summonCooldown -= dt) <= 0) {
                e.summonCooldown = d.summon.interval;
                for (let k = 0; k < d.summon.count; k++) {
                    const m = this.spawnEnemy(d.summon.type, 'normal', e.distance - 20 - k * 14, 0.5);
                    this.events.emit('enemySummoned', m);
                }
            }
            if (d.blink && (e.blinkCooldown -= dt) <= 0 && !e.isFrozen) {
                e.blinkCooldown = d.blink.interval;
                const fx = e.x, fy = e.y;
                e.distance = Math.min(this.path.length - 1, e.distance + d.blink.distance);
                this.updateEnemyPosition(e);
                this.events.emit('enemyBlinked', e, fx, fy);
            }

            e.distance += e.currentSpeed * dt;
            if (e.distance >= this.path.length) {
                this.leakEnemy(e);
                if (this.status !== 'playing') return;
                continue;
            }
            this.updateEnemyPosition(e);
        }
    }

    private leakEnemy(e: Enemy): void {
        if (e.resolved) return;
        e.resolved = true;
        e.alive = false;
        e.leaked = true;
        this.breached++;
        this.health = Math.max(0, this.health - e.castleDamage);
        this.events.emit('enemyLeaked', e);
        this.events.emit('healthChanged', this.health, -e.castleDamage);
        if (this.health <= 0) {
            this.status = 'lost';
            this.events.emit('gameOver');
        }
    }

    /** Applies mitigated damage. Kills and rewards the enemy exactly once. */
    damageEnemy(e: Enemy, amount: number, towerId: number, crit = false, silent = false): number {
        if (!e.alive || e.resolved) return 0;
        const dealt = e.applyDamage(amount);
        if (dealt <= 0) return 0;
        const tower = this.towerById(towerId);
        if (tower) tower.damageDealt += dealt;
        if (!silent) this.events.emit('enemyDamaged', e, dealt, crit);
        if (e.hp <= 0) this.killEnemy(e, tower);
        return dealt;
    }

    private killEnemy(e: Enemy, tower?: Tower): void {
        if (e.resolved) return;
        e.resolved = true;
        e.alive = false;
        e.hp = 0;
        this.economy.earn(e.reward);
        this.stats.coinsEarned += e.reward;
        this.stats.kills++;
        if (tower) tower.kills++;
        this.events.emit('enemyKilled', e, e.reward);
        if (e.def.isBoss) {
            this.stats.bossesDefeated++;
            const healed = Math.min(this.maxHealth, this.health + ECONOMY.bossKillHeal) - this.health;
            if (healed > 0) {
                this.health += healed;
                this.events.emit('healthChanged', this.health, healed);
            }
        }
        if (e.def.splitInto) {
            for (let k = 0; k < e.def.splitInto.count; k++) {
                this.spawnEnemy(e.def.splitInto.type, e.rank === 'normal' ? 'normal' : 'elite', e.distance - k * 16);
            }
        }
    }

    // ------------------------------------------------------------------ towers

    private createTower(type: TowerTypeId, c: number, r: number): Tower {
        const t = new Tower(this.nextId++, type, c, r);
        this.towers.push(t);
        this.grid.occupy(c, r, t.id);
        return t;
    }

    /** Mehter auras: each tower gets the strongest aura covering it. Auras do not stack. */
    recomputeBuffs(): void {
        const drums = this.towers.filter((t) => t.def.levels[0].auraDamage !== undefined);
        const globalDamage = 1 + RESEARCH.damage.perLevel * this.research.damage;
        const globalRate = 1 + RESEARCH.fireRate.perLevel * this.research.fireRate;
        for (const t of this.towers) {
            t.buff = { damage: 0, fireRate: 0, range: 0 };
            t.global = { damage: globalDamage, fireRate: globalRate };
            if (t.isSupport) continue;
            for (const d of drums) {
                const s = d.stats;
                if (dist2(d.x, d.y, t.x, t.y) > s.range * s.range) continue;
                t.buff.damage = Math.max(t.buff.damage, s.auraDamage ?? 0);
                t.buff.fireRate = Math.max(t.buff.fireRate, s.auraFireRate ?? 0);
                t.buff.range = Math.max(t.buff.range, s.auraRange ?? 0);
            }
        }
    }

    private updateTowers(dt: number): void {
        for (const t of this.towers) {
            if (t.isSupport) continue;
            t.cooldown -= dt;
            if (t.cooldown > 0) continue;
            const st = t.stats;
            const targets = selectTargets(this.enemies, {
                x: t.x, y: t.y, range: t.range, canHitFlying: t.def.canHitFlying, mode: t.targeting
            }, st.multiShot ?? 1);
            if (targets.length === 0) { t.cooldown = 0; continue; }
            t.cooldown = Math.max(0, t.cooldown) + 1 / t.fireRate;
            t.aimAngle = Math.atan2(targets[0].y - t.y, targets[0].x - t.x);
            for (const target of targets) this.fire(t, target);
        }
    }

    private buildPayload(t: Tower): HitPayload {
        const st = t.stats;
        const crit = (st.critChance ?? 0) > 0 && this.rng() < (st.critChance ?? 0);
        return {
            towerId: t.id,
            damage: t.damage * (crit ? st.critMultiplier ?? 2 : 1),
            damageType: t.def.damageType,
            canHitFlying: t.def.canHitFlying,
            splashRadius: st.splashRadius ?? 0,
            armorPierce: st.armorPierce ?? 0,
            armoredBonus: t.def.armoredBonus ?? 1,
            crit,
            slowAmount: st.slowAmount ?? 0,
            slowDuration: st.slowDuration ?? 0,
            freezeChance: st.freezeChance ?? 0,
            freezeDuration: st.freezeDuration ?? 0,
            burnDps: (st.burnDps ?? 0) * (1 + t.buff.damage) * t.global.damage,
            burnDuration: st.burnDuration ?? 0,
            chainCount: st.chainCount ?? 0,
            chainFalloff: st.chainFalloff ?? 0.6,
            clusterCount: st.clusterCount ?? 0
        };
    }

    /** Predicts where an enemy will be after `seconds`, following the road. */
    predictPosition(e: Enemy, seconds: number): { x: number; y: number } {
        const s = this.path.sample(e.distance + e.currentSpeed * seconds, { x: 0, y: 0, dx: 1, dy: 0 });
        return { x: s.x - s.dy * e.laneOffset, y: s.y + s.dx * e.laneOffset };
    }

    private fire(t: Tower, target: Enemy): void {
        const kind = t.def.projectile!;
        const payload = this.buildPayload(t);
        const lobbed = kind === 'cannonball' || kind === 'firepot';
        let tx = target.x;
        let ty = target.y;
        if (lobbed) {
            let time = Math.hypot(tx - t.x, ty - t.y) / t.def.projectileSpeed;
            for (let k = 0; k < 2; k++) {
                const p = this.predictPosition(target, time);
                tx = p.x; ty = p.y;
                time = Math.hypot(tx - t.x, ty - t.y) / t.def.projectileSpeed;
            }
        }
        const p = new Projectile(this.nextId++, kind, t.x, t.y, tx, ty, t.def.projectileSpeed, payload, lobbed ? null : target.id);
        this.projectiles.push(p);
        this.events.emit('towerFired', t, p);
    }

    // ------------------------------------------------------------------ projectiles

    private updateProjectiles(dt: number): void {
        const count = this.projectiles.length;
        for (let i = 0; i < count; i++) {
            const p = this.projectiles[i];
            if (!p.alive) continue;
            p.age += dt;
            let target: Enemy | undefined;
            if (p.targetId !== null) {
                target = this.enemyIndex.get(p.targetId);
                if (target && target.alive) { p.tx = target.x; p.ty = target.y; } else { target = undefined; p.targetId = null; }
            }
            const step = p.speed * dt;
            const dx = p.tx - p.x;
            const dy = p.ty - p.y;
            const d = Math.hypot(dx, dy);
            const hitRadius = target ? Math.max(6, target.size * 0.25) : 0;
            if (d <= step + hitRadius) {
                p.x = p.tx; p.y = p.ty;
                p.traveled += d;
                this.impact(p, target);
                continue;
            }
            p.x += (dx / d) * step;
            p.y += (dy / d) * step;
            p.traveled += step;
            if (p.age > 6 || p.x < -200 || p.y < -200 || p.x > WORLD_WIDTH + 200 || p.y > WORLD_HEIGHT + 200) p.alive = false;
        }
    }

    private impact(p: Projectile, target: Enemy | undefined): void {
        p.alive = false;
        this.events.emit('projectileHit', p);
        const pl = p.payload;
        if (pl.splashRadius > 0) {
            this.events.emit('explosion', p.x, p.y, pl.splashRadius, p.kind);
            for (const e of this.enemies) {
                if (!e.alive || (e.flying && !pl.canHitFlying)) continue;
                const reach = pl.splashRadius + e.size * 0.3;
                if (dist2(e.x, e.y, p.x, p.y) <= reach * reach) this.applyHit(e, pl);
            }
        } else if (target && target.alive) {
            this.applyHit(target, pl);
            if (pl.chainCount > 0) this.chainFrom(target, pl);
        }
        // A homing shot whose target died simply fizzles: no damage to a dead enemy.
        if (pl.clusterCount > 0 && p.kind !== 'bomblet') {
            for (let k = 0; k < pl.clusterCount; k++) {
                const a = (k / pl.clusterCount) * Math.PI * 2 + this.rng() * 0.8;
                const tx = p.x + Math.cos(a) * 48;
                const ty = p.y + Math.sin(a) * 48;
                const sub: HitPayload = { ...pl, damage: pl.damage * 0.35, splashRadius: 40, clusterCount: 0, crit: false };
                this.projectiles.push(new Projectile(this.nextId++, 'bomblet', p.x, p.y, tx, ty, 200, sub, null));
            }
        }
    }

    private applyHit(e: Enemy, pl: HitPayload): void {
        const dmg = mitigatedDamage(e, pl.damage, pl.damageType, pl.armorPierce, pl.armoredBonus);
        this.damageEnemy(e, dmg, pl.towerId, pl.crit);
        if (!e.alive) return;
        if (pl.slowAmount > 0) e.applySlow(pl.slowAmount, pl.slowDuration);
        if (pl.freezeChance > 0 && this.rng() < pl.freezeChance && e.applyFreeze(pl.freezeDuration)) this.events.emit('enemyFrozen', e);
        if (pl.burnDps > 0) e.applyBurn(pl.burnDps, pl.burnDuration, pl.towerId);
    }

    private chainFrom(first: Enemy, pl: HitPayload): void {
        const hit = new Set<number>([first.id]);
        const points = [{ x: first.x, y: first.y }];
        let cur = first;
        let damage = pl.damage;
        for (let k = 0; k < pl.chainCount; k++) {
            damage *= pl.chainFalloff;
            let best: Enemy | null = null;
            let bestD = 120 * 120;
            for (const e of this.enemies) {
                if (!e.alive || hit.has(e.id) || (e.flying && !pl.canHitFlying)) continue;
                const d = dist2(e.x, e.y, cur.x, cur.y);
                if (d < bestD) { bestD = d; best = e; }
            }
            if (!best) break;
            hit.add(best.id);
            points.push({ x: best.x, y: best.y });
            this.applyHit(best, { ...pl, damage, chainCount: 0 });
            cur = best;
        }
        if (points.length > 1) this.events.emit('chain', points);
    }

    // ------------------------------------------------------------------ persistence

    /** Snapshot for saving. Only meaningful between waves. */
    serialize(): SaveData {
        return {
            version: 1,
            mapId: this.map.id,
            difficulty: this.difficultyId,
            completedWaves: this.completedWaves,
            coins: this.economy.coins,
            health: this.health,
            breached: this.breached,
            stats: { ...this.stats },
            research: { ...this.research },
            towers: this.towers.map((t) => ({
                type: t.type, c: t.c, r: t.r, level: t.level, invested: t.invested, targeting: t.targeting, kills: t.kills,
                damageDealt: Math.round(t.damageDealt)
            })),
            savedAt: Date.now()
        };
    }

    destroy(): void {
        this.events.clear();
        this.enemies = [];
        this.projectiles = [];
        this.enemyIndex.clear();
    }
}
