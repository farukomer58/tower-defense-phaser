import { describe, expect, it } from 'vitest';
import { Enemy } from '../../src/game/core/Enemy';
import { mitigatedDamage } from '../../src/game/core/Combat';
import { selectTarget } from '../../src/game/core/Targeting';
import { DIFFICULTIES } from '../../src/game/config/gameConfig';
import { BUILDABLE, makeSim, runUntil } from '../helpers';

const mk = (type: Enemy['type'] = 'goblin', id = 1) =>
    new Enemy({ id, type, rank: 'normal', wave: 1, difficulty: DIFFICULTIES.normal });

describe('Targeting', () => {
    it('acquires enemies within range and ignores those outside', () => {
        const near = mk('goblin', 1); near.x = 110; near.y = 100; near.distance = 50;
        const far = mk('goblin', 2); far.x = 400; far.y = 100; far.distance = 300;
        const q = { x: 100, y: 100, range: 150, canHitFlying: true, mode: 'first' as const };
        expect(selectTarget([near, far], q)).toBe(near);
        expect(selectTarget([far], q)).toBeNull();
    });

    it('targets the enemy furthest along the path by default', () => {
        const a = mk('goblin', 1); a.x = 100; a.y = 120; a.distance = 50;
        const b = mk('goblin', 2); b.x = 130; b.y = 100; b.distance = 80;
        expect(selectTarget([a, b], { x: 100, y: 100, range: 150, canHitFlying: true, mode: 'first' })).toBe(b);
        expect(selectTarget([a, b], { x: 100, y: 100, range: 150, canHitFlying: true, mode: 'last' })).toBe(a);
    });

    it('cannons ignore flying enemies', () => {
        const wisp = mk('ifrit', 1); wisp.x = 100; wisp.y = 100;
        expect(selectTarget([wisp], { x: 100, y: 100, range: 150, canHitFlying: false, mode: 'first' })).toBeNull();
    });

    it('never targets dead enemies', () => {
        const e = mk(); e.x = 100; e.y = 100; e.alive = false;
        expect(selectTarget([e], { x: 100, y: 100, range: 150, canHitFlying: true, mode: 'first' })).toBeNull();
    });
});

describe('Damage', () => {
    it('reduces enemy health correctly', () => {
        const e = mk();
        expect(e.applyDamage(20)).toBe(20);
        expect(e.hp).toBe(30);
    });

    it('dead enemies cannot receive further damage', () => {
        const sim = makeSim();
        sim.waves.startNext();
        const e = sim.spawnEnemy('goblin', 'normal', 100);
        sim.damageEnemy(e, 1000, -1);
        expect(e.alive).toBe(false);
        expect(e.hp).toBe(0);
        expect(sim.damageEnemy(e, 10, -1)).toBe(0);
        expect(e.applyDamage(10)).toBe(0);
    });

    it('armour reduces physical damage; magic does extra to armoured foes', () => {
        const golem = mk('golem');
        expect(mitigatedDamage(golem, 100, 'physical')).toBeCloseTo(50);
        expect(mitigatedDamage(golem, 100, 'physical', 0.5)).toBeCloseTo(75);
        expect(mitigatedDamage(golem, 100, 'magic', 0, 1.5)).toBeCloseTo(150);
    });
});

describe('Ice tower', () => {
    it('slows enemies and the slow expires', () => {
        const e = mk();
        const base = e.currentSpeed;
        e.applySlow(0.4, 2);
        expect(e.currentSpeed).toBeCloseTo(base * 0.6);
        e.slowTimer = 0; e.slowAmount = 0;
        expect(e.currentSpeed).toBeCloseTo(base);
    });

    it('a frost fountain slows a goblin in range', () => {
        const sim = makeSim();
        expect(sim.placeTower('frost', BUILDABLE.c, BUILDABLE.r).ok).toBe(true);
        sim.waves.startNext();
        const e = sim.spawnEnemy('goblin', 'normal', 180);
        runUntil(sim, () => e.isSlowed || !e.alive, 5);
        expect(e.isSlowed).toBe(true);
        expect(e.currentSpeed).toBeLessThan(e.baseSpeed);
    });
});

describe('Tower combat', () => {
    it('archer kills a goblin with projectiles and grants the reward', () => {
        const sim = makeSim();
        sim.placeTower('archer', BUILDABLE.c, BUILDABLE.r);
        sim.waves.startNext();
        const e = sim.spawnEnemy('goblin', 'normal', 150);
        const coins = sim.economy.coins;
        let sawProjectile = false;
        runUntil(sim, () => !e.alive, 30, () => { if (sim.projectiles.length) sawProjectile = true; });
        expect(sawProjectile).toBe(true);
        expect(e.alive).toBe(false);
        expect(e.leaked).toBe(false);
        expect(sim.economy.coins).toBe(coins + e.reward);
    });

    it('towers do not attack enemies outside their range', () => {
        const sim = makeSim();
        const t = sim.placeTower('archer', 15, 9);
        expect(t.ok).toBe(true);
        sim.waves.startNext();
        sim.spawnEnemy('goblin', 'normal', 0);
        for (let i = 0; i < 30; i++) sim.tick(1 / 60);
        expect(sim.projectiles.length).toBe(0);
    });

    it('mehter aura buffs nearby towers without stacking', () => {
        const sim = makeSim({ completedWaves: 40, coins: 5000 });
        const a = sim.placeTower('archer', 3, 2);
        sim.placeTower('mehter', 3, 3);
        sim.placeTower('mehter', 4, 2);
        if (!a.ok) throw new Error('fail');
        expect(a.value.buff.damage).toBeCloseTo(0.15);
        expect(a.value.damage).toBeCloseTo(10 * 1.15);
    });
});
