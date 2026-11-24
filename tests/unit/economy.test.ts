import { describe, expect, it } from 'vitest';
import { Economy } from '../../src/game/core/Economy';
import { TOWERS } from '../../src/game/config/towerConfig';
import { ECONOMY } from '../../src/game/config/gameConfig';
import { BUILDABLE, makeSim } from '../helpers';

describe('Economy', () => {
    it('spends and earns without going negative', () => {
        const e = new Economy(100);
        expect(e.spend(60)).toBe(true);
        expect(e.coins).toBe(40);
        expect(e.spend(50)).toBe(false);
        expect(e.coins).toBe(40);
        expect(e.spend(-10)).toBe(false);
        e.earn(15);
        expect(e.coins).toBe(55);
        expect(e.totalEarned).toBe(15);
    });

    it('tower purchase deducts the correct amount', () => {
        const sim = makeSim();
        const res = sim.placeTower('archer', BUILDABLE.c, BUILDABLE.r);
        expect(res.ok).toBe(true);
        expect(sim.economy.coins).toBe(100 - TOWERS.archer.cost);
    });

    it('purchase fails with insufficient funds and changes nothing', () => {
        const sim = makeSim({ coins: 40 });
        const res = sim.placeTower('archer', BUILDABLE.c, BUILDABLE.r);
        expect(res).toEqual({ ok: false, reason: 'insufficient_funds' });
        expect(sim.economy.coins).toBe(40);
        expect(sim.towers.length).toBe(0);
    });

    it('selling returns 60% of the total investment', () => {
        const sim = makeSim({ coins: 1000 });
        const t = sim.placeTower('cannon', BUILDABLE.c, BUILDABLE.r);
        if (!t.ok) throw new Error('placement failed');
        sim.upgradeTower(t.value.id);
        const invested = TOWERS.cannon.cost + TOWERS.cannon.upgradeCosts[0];
        expect(t.value.invested).toBe(invested);
        const before = sim.economy.coins;
        const sold = sim.sellTower(t.value.id);
        expect(sold).toEqual({ ok: true, value: Math.floor(invested * ECONOMY.sellRefundRatio) });
        expect(sim.economy.coins).toBe(before + Math.floor(invested * 0.6));
        expect(sim.grid.check(BUILDABLE.c, BUILDABLE.r)).toBe('ok');
    });

    it('rewards are granted only once per enemy', () => {
        const sim = makeSim();
        sim.waves.startNext();
        const e = sim.spawnEnemy('goblin', 'normal', 100);
        const before = sim.economy.coins;
        sim.damageEnemy(e, 9999, -1);
        sim.damageEnemy(e, 9999, -1);
        expect(sim.economy.coins).toBe(before + e.reward);
        expect(sim.stats.kills).toBe(1);
    });

    it('upgrades fail without enough coins and at max level', () => {
        const sim = makeSim({ coins: 50 });
        const t = sim.placeTower('archer', BUILDABLE.c, BUILDABLE.r);
        if (!t.ok) throw new Error('placement failed');
        expect(sim.upgradeTower(t.value.id)).toEqual({ ok: false, reason: 'insufficient_funds' });
        sim.economy.earn(10_000);
        for (let i = 0; i < 4; i++) expect(sim.upgradeTower(t.value.id).ok).toBe(true);
        expect(t.value.level).toBe(5);
        expect(sim.upgradeTower(t.value.id)).toEqual({ ok: false, reason: 'max_level' });
    });
});
