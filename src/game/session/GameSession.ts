import { SIMULATION, type DifficultyId } from '../config/gameConfig';
import type { TowerTypeId } from '../config/towerConfig';
import { EventBus } from '../core/EventBus';
import { Simulation, type ActionFailure } from '../core/Simulation';
import { PLACEMENT_MESSAGES } from '../core/PlacementGrid';
import { SaveSystem, type Settings } from './SaveSystem';

export type Screen = 'loading' | 'menu' | 'playing' | 'gameover' | 'victory';

export type SessionEvents = {
    /** A new simulation was created (or cleared). Renderers and UI must rebind. */
    simChanged: [Simulation | null];
    screen: [Screen];
    paused: [boolean];
    speed: [number];
    placementMode: [TowerTypeId | null];
    selection: [number | null];
    settings: [Settings];
    toast: [string, 'info' | 'error' | 'good'];
    hoverCell: [{ c: number; r: number } | null];
};

export const FAILURE_MESSAGES: Record<ActionFailure, string> = {
    ...PLACEMENT_MESSAGES,
    locked: 'This tower is still locked',
    insufficient_funds: 'Not enough gold',
    max_level: 'Already at maximum level',
    not_found: 'Tower not found',
    game_over: 'The battle is over'
};

/**
 * Glue between the simulation, the Phaser renderer and the DOM UI.
 * It owns pause and speed state, selection, saving and settings.
 */
export class GameSession {
    readonly events = new EventBus<SessionEvents>();
    sim: Simulation | null = null;
    screen: Screen = 'loading';
    paused = false;
    speedIndex = 0;
    placementType: TowerTypeId | null = null;
    selectedTowerId: number | null = null;
    settings: Settings = SaveSystem.loadSettings();
    private unsub: (() => void)[] = [];

    get speed(): number { return SIMULATION.speeds[this.speedIndex]; }
    get hasSave(): boolean { return SaveSystem.loadGame() !== null; }

    // ------------------------------------------------------------ lifecycle

    newGame(mapId: string, difficulty: DifficultyId): void {
        SaveSystem.clearGame();
        this.startSim(new Simulation({ mapId, difficulty, seed: Date.now() & 0xffff }));
    }

    continueGame(): boolean {
        const save = SaveSystem.loadGame();
        if (!save) return false;
        this.startSim(new Simulation({ mapId: save.mapId, difficulty: save.difficulty, save, seed: Date.now() & 0xffff }));
        return true;
    }

    restart(): void {
        if (!this.sim) return;
        const { map, difficultyId } = this.sim;
        this.newGame(map.id, difficultyId);
    }

    quitToMenu(): void {
        this.disposeSim();
        this.events.emit('simChanged', null);
        this.setScreen('menu');
    }

    private startSim(sim: Simulation): void {
        this.disposeSim();
        this.sim = sim;
        sim.autoStart = this.settings.autoWave;
        this.paused = false;
        this.speedIndex = 0;
        this.placementType = null;
        this.selectedTowerId = null;
        this.unsub.push(
            sim.events.on('waveCompleted', () => this.autosave()),
            sim.events.on('gameOver', () => {
                SaveSystem.recordProgress(sim.map.id, sim.difficultyId, sim.currentWave, false);
                SaveSystem.clearGame();
                this.cancelPlacement();
                this.setScreen('gameover');
            }),
            sim.events.on('victory', () => {
                SaveSystem.recordProgress(sim.map.id, sim.difficultyId, sim.completedWaves, true);
                SaveSystem.clearGame();
                this.cancelPlacement();
                this.setScreen('victory');
            }),
            sim.events.on('towerSold', (t) => { if (t.id === this.selectedTowerId) this.select(null); })
        );
        this.events.emit('simChanged', sim);
        this.events.emit('paused', false);
        this.events.emit('speed', this.speed);
        this.setScreen('playing');
    }

    private disposeSim(): void {
        this.unsub.forEach((u) => u());
        this.unsub = [];
        this.sim?.destroy();
        this.sim = null;
        this.placementType = null;
        this.selectedTowerId = null;
    }

    private autosave(): void {
        if (!this.sim || this.sim.status !== 'playing') return;
        SaveSystem.saveGame(this.sim.serialize());
        SaveSystem.recordProgress(this.sim.map.id, this.sim.difficultyId, this.sim.completedWaves, false);
    }

    setScreen(s: Screen): void {
        this.screen = s;
        this.events.emit('screen', s);
    }

    /** Called every frame by the game scene with real elapsed seconds. */
    update(realDt: number): void {
        if (!this.sim || this.paused || this.screen !== 'playing') return;
        this.sim.advance(realDt * this.speed);
    }

    // ------------------------------------------------------------ controls

    setPaused(p: boolean): void {
        if (!this.sim || this.screen !== 'playing') p = false;
        if (this.paused === p) return;
        this.paused = p;
        this.events.emit('paused', p);
    }

    togglePause(): void { this.setPaused(!this.paused); }

    cycleSpeed(): void {
        this.speedIndex = (this.speedIndex + 1) % SIMULATION.speeds.length;
        this.events.emit('speed', this.speed);
    }

    startWave(): void {
        if (!this.sim) return;
        if (this.sim.startNextWave()) this.setPaused(false);
    }

    setAutoWave(v: boolean): void {
        this.updateSettings({ autoWave: v });
        if (this.sim) {
            this.sim.autoStart = v;
            if (!v) this.sim.countdown = null;
        }
    }

    updateSettings(patch: Partial<Settings>): void {
        this.settings = { ...this.settings, ...patch };
        SaveSystem.saveSettings(this.settings);
        this.events.emit('settings', this.settings);
    }

    toast(msg: string, kind: 'info' | 'error' | 'good' = 'info'): void {
        this.events.emit('toast', msg, kind);
    }

    // ------------------------------------------------------------ placement and selection

    beginPlacement(type: TowerTypeId): void {
        if (!this.sim || this.sim.status !== 'playing') return;
        if (this.placementType === type) { this.cancelPlacement(); return; }
        if (!this.sim.isTowerUnlocked(type)) { this.toast(FAILURE_MESSAGES.locked, 'error'); return; }
        this.select(null);
        this.placementType = type;
        this.events.emit('placementMode', type);
    }

    cancelPlacement(): void {
        if (this.placementType === null) return;
        this.placementType = null;
        this.events.emit('placementMode', null);
    }

    /** Attempts to place the current placement tower at a cell. */
    placeAt(c: number, r: number, keepPlacing = false): boolean {
        if (!this.sim || !this.placementType) return false;
        const res = this.sim.placeTower(this.placementType, c, r);
        if (!res.ok) {
            this.toast(FAILURE_MESSAGES[res.reason], 'error');
            return false;
        }
        if (!keepPlacing || !this.sim.economy.canAfford(res.value.def.cost)) this.cancelPlacement();
        return true;
    }

    select(id: number | null): void {
        if (this.selectedTowerId === id) return;
        this.selectedTowerId = id;
        this.events.emit('selection', id);
    }

    upgradeSelected(): void {
        if (!this.sim || this.selectedTowerId === null) return;
        const res = this.sim.upgradeTower(this.selectedTowerId);
        if (!res.ok) this.toast(FAILURE_MESSAGES[res.reason], 'error');
    }

    sellSelected(): void {
        if (!this.sim || this.selectedTowerId === null) return;
        const res = this.sim.sellTower(this.selectedTowerId);
        if (res.ok) this.toast(`Sold for ${res.value} gold`, 'good');
        else this.toast(FAILURE_MESSAGES[res.reason], 'error');
    }

    destroy(): void {
        this.disposeSim();
        this.events.clear();
    }
}
