import { describe, expect, it } from 'vitest';
import { runBot } from './balanceBot';
import { MAPS } from '../../src/game/config/mapConfig';

/**
 * Balance sanity check with a greedy bot. The bot is deliberately mediocre, so
 * it should get well into the campaign but not breeze through all 100 levels on normal.
 */
describe('Balance simulation', () => {
    for (const map of MAPS) {
        it(`bot makes solid progress on ${map.name} (normal)`, () => {
            const r = runBot(map.id, 'normal');
            console.log(`[balance] ${map.id} normal: reached wave ${r.reachedWave} won=${r.won} hp=${r.health} towers=${r.towers} avgLv=${r.avgLevel}`);
            expect(r.reachedWave).toBeGreaterThanOrEqual(20);
        }, 120_000);
    }

    it('easy is at least as far as hard', () => {
        const easy = runBot('bosphorus', 'easy');
        const hard = runBot('bosphorus', 'hard');
        console.log(`[balance] bosphorus easy: ${easy.reachedWave} won=${easy.won} | hard: ${hard.reachedWave} won=${hard.won}`);
        expect(easy.reachedWave).toBeGreaterThanOrEqual(hard.reachedWave);
    }, 240_000);
});
