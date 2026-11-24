import { describe, expect, it } from 'vitest';
import { Path } from '../../src/game/core/Path';
import { MAPS } from '../../src/game/config/mapConfig';
import { BUILDABLE, OBSTACLE, ROAD, makeSim } from '../helpers';

describe('Placement', () => {
    it('allows valid locations', () => {
        const sim = makeSim();
        expect(sim.canPlace('archer', BUILDABLE.c, BUILDABLE.r).ok).toBe(true);
        expect(sim.placeTower('archer', BUILDABLE.c, BUILDABLE.r).ok).toBe(true);
    });

    it('rejects the road', () => {
        const sim = makeSim();
        expect(sim.placeTower('archer', ROAD.c, ROAD.r)).toEqual({ ok: false, reason: 'road' });
    });

    it('rejects overlapping towers', () => {
        const sim = makeSim({ coins: 500 });
        sim.placeTower('archer', BUILDABLE.c, BUILDABLE.r);
        expect(sim.placeTower('cannon', BUILDABLE.c, BUILDABLE.r)).toEqual({ ok: false, reason: 'occupied' });
    });

    it('rejects obstacles, the castle and out-of-bounds cells', () => {
        const sim = makeSim({ coins: 500 });
        expect(sim.placeTower('archer', OBSTACLE.c, OBSTACLE.r)).toEqual({ ok: false, reason: 'blocked' });
        expect(sim.placeTower('archer', 14, 4)).toEqual({ ok: false, reason: 'blocked' });
        expect(sim.placeTower('archer', -1, 0)).toEqual({ ok: false, reason: 'out_of_bounds' });
        expect(sim.placeTower('archer', 16, 0)).toEqual({ ok: false, reason: 'out_of_bounds' });
    });

    it('rejects placement with insufficient currency', () => {
        const sim = makeSim({ coins: 10 });
        expect(sim.placeTower('archer', BUILDABLE.c, BUILDABLE.r)).toEqual({ ok: false, reason: 'insufficient_funds' });
    });

    it('locks advanced towers until their unlock wave', () => {
        const sim = makeSim({ coins: 1000 });
        expect(sim.placeTower('janissary', BUILDABLE.c, BUILDABLE.r)).toEqual({ ok: false, reason: 'locked' });
        const later = makeSim({ coins: 1000, completedWaves: 10 });
        expect(later.placeTower('janissary', BUILDABLE.c, BUILDABLE.r).ok).toBe(true);
    });
});

describe('Maps and paths', () => {
    it.each(MAPS.map((m) => [m.id, m] as const))('%s has a valid path that ends at the castle', (_id, map) => {
        const path = new Path(map.waypoints);
        expect(path.length).toBeGreaterThan(600);
        const end = path.sample(path.length);
        expect(end.x).toBeGreaterThanOrEqual(map.castle.c * 64);
        for (const o of map.obstacles) expect(path.cells.has(`${o.c},${o.r}`)).toBe(false);
    });

    it('samples positions continuously along the path', () => {
        const path = new Path(MAPS[0].waypoints);
        let prev = path.sample(0);
        for (let d = 2; d <= path.length; d += 2) {
            const s = path.sample(d);
            expect(Math.hypot(s.x - prev.x, s.y - prev.y)).toBeLessThan(2.5);
            prev = s;
        }
    });
});
