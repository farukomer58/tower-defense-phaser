import { describe, expect, it } from 'vitest';
import { Simulation } from '../../src/game/core/Simulation';
import { RESEARCH, researchCost } from '../../src/game/config/gameConfig';
import { makeSim, runUntil } from '../helpers';

describe('Simulation integration', () => {
    it('plays the first three levels with a simple defence and survives', () => {
        const sim = makeSim({ coins: 400 });
        for (const [c, r] of [[3, 2], [1, 3], [3, 6], [5, 5]] as const) expect(sim.placeTower('archer', c, r).ok).toBe(true);
        for (let w = 1; w <= 3; w++) {
            expect(sim.startNextWave()).toBe(true);
            runUntil(sim, () => !sim.isWaveActive || sim.status !== 'playing', 400);
        }
        expect(sim.status).toBe('playing');
        expect(sim.completedWaves).toBe(3);
        expect(sim.stats.kills).toBeGreaterThan(10);
        expect(sim.economy.coins).toBeGreaterThan(0);
    });

    it('saves and restores towers, coins, health and research between levels', () => {
        const sim = makeSim({ coins: 5000 });
        const t = sim.placeTower('cannon', 3, 2);
        if (!t.ok) throw new Error('placement failed');
        sim.upgradeTower(t.value.id);
        sim.setTargeting(t.value.id, 'strongest');
        sim.buyResearch('damage');
        const save = sim.serialize();
        const json = JSON.parse(JSON.stringify(save));
        const restored = new Simulation({ mapId: 'ignored', difficulty: 'easy', save: json });
        expect(restored.map.id).toBe('bosphorus');
        expect(restored.difficultyId).toBe('normal');
        expect(restored.economy.coins).toBe(sim.economy.coins);
        expect(restored.towers).toHaveLength(1);
        expect(restored.towers[0].level).toBe(2);
        expect(restored.towers[0].targeting).toBe('strongest');
        expect(restored.research.damage).toBe(1);
        expect(restored.towers[0].global.damage).toBeCloseTo(1 + RESEARCH.damage.perLevel);
        expect(restored.grid.check(3, 2)).toBe('occupied');
    });

    it('treasury research costs coins, boosts towers and caps at max level', () => {
        const sim = makeSim({ coins: 1_000_000 });
        const a = sim.placeTower('archer', 3, 2);
        if (!a.ok) throw new Error('fail');
        const before = sim.economy.coins;
        expect(sim.buyResearch('fireRate').ok).toBe(true);
        expect(sim.economy.coins).toBe(before - researchCost('fireRate', 0)!);
        expect(a.value.fireRate).toBeCloseTo(1 * (1 + RESEARCH.fireRate.perLevel));
        for (let i = 1; i < RESEARCH.fireRate.maxLevel; i++) sim.buyResearch('fireRate');
        expect(sim.buyResearch('fireRate')).toEqual({ ok: false, reason: 'max_level' });
    });

    it('wall repair restores health up to the maximum only', () => {
        const sim = makeSim({ coins: 10_000, health: 15 });
        expect(sim.repairWalls()).toEqual({ ok: true, value: 2 });
        expect(sim.health).toBe(17);
        sim.repairWalls(); sim.repairWalls();
        expect(sim.health).toBe(20);
        expect(sim.repairWalls()).toEqual({ ok: false, reason: 'max_level' });
    });

    it('slimes split on death and bosses heal the castle', () => {
        const sim = makeSim({ completedWaves: 60, health: 10 });
        sim.waves.startNext();
        const slime = sim.spawnEnemy('slime', 'normal', 300);
        sim.damageEnemy(slime, 1e9, -1);
        expect(sim.enemies.filter((e) => e.type === 'slimeling' && e.alive)).toHaveLength(3);
        const boss = sim.spawnEnemy('bossGoblinWarlord', 'normal', 300);
        sim.damageEnemy(boss, 1e9, -1);
        expect(sim.health).toBe(15);
        expect(sim.stats.bossesDefeated).toBe(1);
    });

    it('fixed-step advance gives the same result at 1x and 3x speed', () => {
        const run = (speed: number) => {
            const sim = makeSim({ coins: 200 });
            sim.placeTower('archer', 3, 2);
            sim.placeTower('archer', 1, 3);
            sim.startNextWave();
            for (let i = 0; i < Math.round(1800 / speed); i++) sim.advance((1 / 60) * speed);
            return { kills: sim.stats.kills, breached: sim.breached, coins: sim.economy.coins, time: Math.round(sim.time) };
        };
        expect(run(3)).toEqual(run(1));
    });

    it('burning stops troll regeneration', () => {
        const sim = makeSim({ completedWaves: 30 });
        sim.waves.startNext();
        const troll = sim.spawnEnemy('troll', 'normal', 100);
        sim.damageEnemy(troll, troll.maxHp / 2, -1);
        const hp = troll.hp;
        troll.applyBurn(0.0001, 2, -1);
        sim.tick(0.5);
        expect(troll.hp).toBeLessThanOrEqual(hp);
        troll.burnTimer = 0;
        sim.tick(0.5);
        expect(troll.hp).toBeGreaterThan(hp);
    });
});
