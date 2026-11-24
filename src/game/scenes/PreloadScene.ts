import Phaser from 'phaser';
import { ASSETS } from '../config/assetManifest';
import type { GameSession } from '../session/GameSession';

/** Loads every asset in the manifest and reports progress to the DOM loader. */
export class PreloadScene extends Phaser.Scene {
    constructor() { super('Preload'); }

    preload(): void {
        const bar = document.getElementById('loading-bar');
        this.load.on('progress', (p: number) => { if (bar) bar.style.width = `${Math.round(p * 100)}%`; });
        this.load.on('loaderror', (file: Phaser.Loader.File) => console.warn(`Asset failed to load: ${file.key} (${file.src})`));
        for (const a of ASSETS) {
            if (a.path.toLowerCase().endsWith('.svg')) {
                this.load.svg(a.key, a.path, a.width && a.height ? { width: a.width, height: a.height } : undefined);
            } else {
                this.load.image(a.key, a.path);
            }
        }
    }

    create(): void {
        document.getElementById('loading')?.classList.add('hidden');
        const session = this.registry.get('session') as GameSession;
        this.scene.start('Game');
        session.setScreen('menu');
    }
}
