#!/usr/bin/env node
/**
 * Generates the game's SVG art into public/assets.
 *
 *   npm run assets         writes only missing files (your own edits are kept)
 *   npm run assets:force   overwrites every generated file
 *
 * To use your own art, replace any file in public/assets (or point
 * src/game/config/assetManifest.ts at a PNG instead).
 */
import { mkdirSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { towerAssets } from './assets/towers.mjs';
import { enemyAssets } from './assets/enemies.mjs';
import { worldAssets } from './assets/world.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'assets');
const force = process.argv.includes('--force');

const all = { ...towerAssets(), ...enemyAssets(), ...worldAssets() };
let written = 0, skipped = 0;
for (const [rel, content] of Object.entries(all)) {
    const file = join(outDir, rel);
    if (!force && existsSync(file)) { skipped++; continue; }
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content, 'utf8');
    written++;
}
// The emblem doubles as the favicon.
const fav = join(root, 'public', 'favicon.svg');
if (force || !existsSync(fav)) copyFileSync(join(outDir, 'ui', 'emblem.svg'), fav);
console.log(`Assets: ${written} written, ${skipped} kept (use --force to overwrite).`);
