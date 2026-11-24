import { Simulation } from '../../src/game/core/Simulation';
import { TOWERS, type TowerTypeId } from '../../src/game/config/towerConfig';
import { GRID_COLS, GRID_ROWS, TILE_SIZE, type DifficultyId } from '../../src/game/config/gameConfig';

/**
 * A simple greedy bot used to sanity-check balance. It builds towers on the
 * cells that cover the most road, cycles through tower types, and upgrades
 * when building is no longer the best option. A skilled human should beat it.
 */
export interface BotResult { map: string; difficulty: DifficultyId; reachedWave: number; won: boolean; health: number; towers: number; avgLevel: number }

const BUILD_ORDER: TowerTypeId[] = ['archer', 'archer', 'frost', 'cannon', 'dervish', 'archer', 'dervish', 'janissary', 'naphtha', 'mehter', 'dervish', 'janissary', 'frost', 'cannon'];

function coverage(sim: Simulation, c: number, r: number, range: number): number {
    const x = (c + 0.5) * TILE_SIZE;
    const y = (r + 0.5) * TILE_SIZE;
    let n = 0;
    for (let d = 0; d < sim.path.length; d += 16) {
        const s = sim.path.sample(d);
        if ((s.x - x) ** 2 + (s.y - y) ** 2 <= range * range) n++;
    }
    return n;
}

export function runBot(mapId: string, difficulty: DifficultyId, maxWave = 100): BotResult {
    const sim = new Simulation({ mapId, difficulty, seed: 7 });
    const cells: { c: number; r: number; score: number }[] = [];
    for (let c = 0; c < GRID_COLS; c++) for (let r = 0; r < GRID_ROWS; r++) {
        if (sim.grid.check(c, r) === 'ok') cells.push({ c, r, score: coverage(sim, c, r, 150) });
    }
    cells.sort((a, b) => b.score - a.score);
    let buildIdx = 0;

    const spend = () => {
        for (let guard = 0; guard < 50; guard++) {
            const unlocked = BUILD_ORDER.filter((t) => sim.isTowerUnlocked(t));
            const nextType = unlocked[buildIdx % unlocked.length];
            const freeCell = cells.find((cell) => sim.grid.check(cell.c, cell.r) === 'ok' && cell.score > 6);
            const upgradable = sim.towers.filter((t) => t.upgradeCost !== null).sort((a, b) => a.level - b.level || (a.upgradeCost! - b.upgradeCost!));
            const avgLevel = sim.towers.reduce((s, t) => s + t.level, 0) / Math.max(1, sim.towers.length);
            const wantBuild = freeCell && (sim.towers.length < 4 || avgLevel >= 2.2 || !upgradable.length);
            if (wantBuild && sim.economy.canAfford(TOWERS[nextType].cost)) {
                if (sim.placeTower(nextType, freeCell!.c, freeCell!.r).ok) { buildIdx++; continue; }
            }
            const up = upgradable[0];
            if (up && !wantBuild && sim.economy.canAfford(up.upgradeCost!)) { sim.upgradeTower(up.id); continue; }
            if (!up && !freeCell) {
                if (sim.repairCost !== null && sim.health < sim.maxHealth / 2 && sim.repairWalls().ok) continue;
                const res = (['damage', 'fireRate'] as const).map((id) => ({ id, cost: sim.researchCost(id) }))
                    .filter((x) => x.cost !== null).sort((a, b) => a.cost! - b.cost!)[0];
                if (res && sim.buyResearch(res.id).ok) continue;
            }
            break;
        }
    };

    const step = 1 / 30;
    while (sim.status === 'playing' && sim.completedWaves < maxWave) {
        spend();
        sim.startNextWave();
        let t = 0;
        while (sim.isWaveActive && sim.status === 'playing') {
            sim.tick(step);
            t += step;
            if (t > 2) { spend(); t = 0; }
        }
    }
    return {
        map: mapId, difficulty, reachedWave: sim.status === 'lost' ? sim.currentWave : sim.completedWaves, won: sim.status === 'won',
        health: sim.health, towers: sim.towers.length,
        avgLevel: Math.round(sim.towers.reduce((s, t) => s + t.level, 0) / Math.max(1, sim.towers.length) * 10) / 10
    };
}
