import Phaser from 'phaser';

/** Generates the tiny procedural textures used for particles and shadows. */
export class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }

    create(): void {
        const g = this.add.graphics();

        g.fillStyle(0xffffff, 1).fillCircle(8, 8, 8);
        g.generateTexture('px_dot', 16, 16);
        g.clear();

        // Soft puff: layered translucent circles.
        for (let i = 6; i >= 1; i--) g.fillStyle(0xffffff, 0.12).fillCircle(16, 16, i * 2.6);
        g.generateTexture('px_soft', 32, 32);
        g.clear();

        g.fillStyle(0xffffff, 1);
        g.fillPoints([
            new Phaser.Math.Vector2(8, 0), new Phaser.Math.Vector2(10, 6), new Phaser.Math.Vector2(16, 8),
            new Phaser.Math.Vector2(10, 10), new Phaser.Math.Vector2(8, 16), new Phaser.Math.Vector2(6, 10),
            new Phaser.Math.Vector2(0, 8), new Phaser.Math.Vector2(6, 6)
        ], true);
        g.generateTexture('px_star', 16, 16);
        g.clear();

        g.fillStyle(0x000000, 0.22).fillEllipse(32, 10, 60, 18);
        g.generateTexture('shadow', 64, 20);
        g.destroy();

        this.scene.start('Preload');
    }
}
