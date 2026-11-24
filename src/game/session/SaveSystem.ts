import type { SaveData } from '../core/Simulation';

const SAVE_KEY = 'kingdom-guardians.save.v1';
const SETTINGS_KEY = 'kingdom-guardians.settings.v1';
const RECORDS_KEY = 'kingdom-guardians.records.v1';

export type ViewMode = 'auto' | 'desktop' | 'mobile';

export interface Settings {
    viewMode: ViewMode;
    sound: boolean;
    autoWave: boolean;
    showDamage: boolean;
}

export const DEFAULT_SETTINGS: Settings = { viewMode: 'auto', sound: true, autoWave: false, showDamage: true };

/** Best wave reached, per map and difficulty ("mapId:difficulty"). */
export type Records = Record<string, { bestWave: number; won: boolean }>;

function read<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

function write(key: string, value: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage may be unavailable (private mode). The game still works without saving.
    }
}

export const SaveSystem = {
    loadGame(): SaveData | null {
        const s = read<SaveData>(SAVE_KEY);
        return s && s.version === 1 && Array.isArray(s.towers) ? s : null;
    },
    saveGame(data: SaveData): void { write(SAVE_KEY, data); },
    clearGame(): void {
        try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
    },
    loadSettings(): Settings { return { ...DEFAULT_SETTINGS, ...(read<Partial<Settings>>(SETTINGS_KEY) ?? {}) }; },
    saveSettings(s: Settings): void { write(SETTINGS_KEY, s); },
    loadRecords(): Records { return read<Records>(RECORDS_KEY) ?? {}; },
    recordProgress(mapId: string, difficulty: string, wave: number, won: boolean): void {
        const r = SaveSystem.loadRecords();
        const k = `${mapId}:${difficulty}`;
        const prev = r[k] ?? { bestWave: 0, won: false };
        r[k] = { bestWave: Math.max(prev.bestWave, wave), won: prev.won || won };
        write(RECORDS_KEY, r);
    }
};
