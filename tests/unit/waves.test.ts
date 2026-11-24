import { describe, expect, it } from 'vitest';
import { buildSchedule, WaveManager } from '../../src/game/core/WaveManager';
import { getWave, waveEnemyCount } from '../../src/game/config/waveConfig';
import { ENEMIES } from '../../src/game/config/enemyConfig';
import { TOTAL_WAVES } from '../../src/game/config/gameConfig';
import { killAll, makeSim, runUntil } from '../helpers';

const composition = (wave: number) => {
    const counts: Record<string, number> = {};
    for (const s of buildSchedule(getWave(wave))) counts[s.type] = (counts[s.type] ?? 0) + 1;
    return counts;
};

describe('Wave definitions', () => {
    it('opening waves match the design table', () => {
        expect(composition(1)).toEqual({ goblin: 5 });
        expect(composition(2)).toEqual({ goblin: 8 });
        expect(composition(3)).toEqual({ goblin: 6, orc: 2 });
        expect(composition(6)).toEqual({ goblin: 8, orc: 5, golem: 2 });
        expect(composition(9)).toEqual({ orc: 10, wolfRider: 5, golem: 3 });
    });

    it('every 10th wave has exactly one boss and enemy counts grow', () => {
        for (let w = 1; w <= TOTAL_WAVES; w++) {
            const bosses = getWave(w).groups.filter((g) => ENEMIES[g.type].isBoss).reduce((n, g) => n + g.count, 0);
            expect(bosses).toBe(w % 10 === 0 ? 1 : 0);
        }
        expect(waveEnemyCount(getWave(50))).toBeGreaterThan(waveEnemyCount(getWave(11)));
        expect(waveEnemyCount(getWave(99))).toBeGreaterThan(waveEnemyCount(getWave(50)));
    });

    it('new enemy types appear at their unlock wave', () => {
        expect(composition(11).scorpion).toBeGreaterThan(0);
        expect(composition(91).djinn).toBeGreaterThan(0);
        expect(composition(15).griffin).toBeUndefined();
    });

    it('generation is deterministic', () => {
        expect(JSON.stringify(getWave(57))).toBe(JSON.stringify(getWave(57)));
    });
});

describe('WaveManager', () => {
    it('spawns the scheduled enemies and completes only when none remain', () => {
        const wm = new WaveManager(100);
        wm.startNext();
        const spawned: string[] = [];
        let alive = 0;
        let completedCount = 0;
        for (let i = 0; i < 60 * 30; i++) {
            if (wm.update(1 / 60, alive, (s) => { spawned.push(s.type); alive++; })) completedCount++;
        }
        expect(spawned.length).toBe(5);
        expect(completedCount).toBe(0); // enemies still alive
        alive = 0;
        expect(wm.update(1 / 60, alive, () => undefined)).toBe(true);
        expect(wm.update(1 / 60, alive, () => undefined)).toBe(false); // no duplicate completion
        expect(wm.state).toBe('idle');
    });

    it('cannot start the next wave while one is active', () => {
        const wm = new WaveManager(100);
        expect(wm.startNext()).not.toBeNull();
        expect(wm.canStartNext()).toBe(false);
        expect(wm.startNext()).toBeNull();
        expect(wm.currentWave).toBe(1);
    });
});

describe('Simulation waves', () => {
    it('completes a wave when enemies leak or die, and pays the bonus once', () => {
        const sim = makeSim();
        let completions = 0;
        sim.events.on('waveCompleted', () => completions++);
        expect(sim.startNextWave()).toBe(true);
        expect(sim.startNextWave()).toBe(false);
        runUntil(sim, () => !sim.isWaveActive, 300);
        expect(completions).toBe(1);
        expect(sim.breached).toBe(5); // no towers: all goblins leak
        expect(sim.health).toBe(15);
        runUntil(sim, () => false, 2);
        expect(completions).toBe(1);
    });

    it('does not spawn enemies after a wave is completed', () => {
        const sim = makeSim();
        sim.startNextWave();
        runUntil(sim, () => !sim.isWaveActive, 300, () => killAll(sim));
        runUntil(sim, () => false, 10);
        expect(sim.enemies.length).toBe(0);
    });

    it('victory triggers after the final wave', () => {
        const sim = makeSim({ completedWaves: TOTAL_WAVES - 1, coins: 0 });
        let won = false;
        sim.events.on('victory', () => { won = true; });
        sim.startNextWave();
        runUntil(sim, () => sim.status !== 'playing', 900, () => killAll(sim));
        expect(won).toBe(true);
        expect(sim.status).toBe('won');
        expect(sim.startNextWave()).toBe(false);
    });

    it('game over when castle health reaches zero, never negative', () => {
        const sim = makeSim({ health: 1 });
        let over = 0;
        sim.events.on('gameOver', () => over++);
        sim.startNextWave();
        runUntil(sim, () => sim.status !== 'playing', 300);
        expect(sim.status).toBe('lost');
        expect(sim.health).toBe(0);
        expect(over).toBe(1);
    });
});
