/**
 * Every image the game loads. To use your own art, replace the file in
 * public/assets (keep the name), or change the path here (PNG/JPG/WebP also work).
 * `width`/`height` are the rasterisation size for SVGs; images are scaled to
 * their display size in game, so any resolution works.
 */
import { BOSS_ORDER, REGULAR_ENEMY_ORDER } from './enemyConfig';
import { TOWER_ORDER } from './towerConfig';

export interface AssetEntry { key: string; path: string; width?: number; height?: number }

const towers: AssetEntry[] = TOWER_ORDER.flatMap((id) => [1, 2, 3].map((tier) => ({
    key: `tower_${id}_${tier}`, path: `assets/towers/${id}_${tier}.svg`, width: 128, height: 160
})));

const enemies: AssetEntry[] = [...REGULAR_ENEMY_ORDER, 'slimeling'].map((id) => ({
    key: `enemy_${id}`, path: `assets/enemies/${id}.svg`, width: 128, height: 128
}));

const bosses: AssetEntry[] = BOSS_ORDER.map((id) => ({ key: `enemy_${id}`, path: `assets/bosses/${id}.svg`, width: 256, height: 256 }));

const world: AssetEntry[] = [
    { key: 'ground_meadow', path: 'assets/world/ground_meadow.svg', width: 128, height: 128 },
    { key: 'ground_steppe', path: 'assets/world/ground_steppe.svg', width: 128, height: 128 },
    { key: 'ground_valley', path: 'assets/world/ground_valley.svg', width: 128, height: 128 },
    { key: 'castle', path: 'assets/world/castle.svg', width: 384, height: 432 },
    ...['cypress', 'palm', 'rock', 'fountain', 'tent', 'well', 'tulips', 'tulips_blue', 'grass', 'grass_dry', 'flowers', 'pebbles']
        .map((d) => ({ key: `deco_${d}`, path: `assets/world/deco_${d}.svg` })),
    { key: 'tower_cannon_barrel', path: 'assets/towers/cannon_barrel.svg', width: 108, height: 48 }
];

const projectiles: AssetEntry[] = ['arrow', 'cannonball', 'bomblet', 'orb', 'ice', 'bullet', 'firepot']
    .map((p) => ({ key: `proj_${p}`, path: `assets/projectiles/${p}.svg` }));

export const ASSETS: AssetEntry[] = [...towers, ...enemies, ...bosses, ...world, ...projectiles];

/** Paths for the DOM UI (tower cards, HUD icons). */
export const UI_ICONS = {
    coin: 'assets/ui/coin.svg',
    heart: 'assets/ui/heart.svg',
    swords: 'assets/ui/swords.svg',
    gate: 'assets/ui/gate.svg',
    flag: 'assets/ui/flag.svg',
    emblem: 'assets/ui/emblem.svg'
};

export const towerIcon = (id: string, tier = 1) => `assets/towers/${id}_${tier}.svg`;
export const enemyIcon = (id: string) => id.startsWith('boss') ? `assets/bosses/${id}.svg` : `assets/enemies/${id}.svg`;
