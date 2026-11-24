import Phaser from 'phaser';
import './styles/main.css';
import { BootScene } from './game/scenes/BootScene';
import { PreloadScene } from './game/scenes/PreloadScene';
import { GameScene } from './game/scenes/GameScene';
import { GameSession } from './game/session/GameSession';
import { UIRoot } from './game/ui/UIRoot';

function start(): void {
    const root = document.getElementById('app')!;
    const session = new GameSession();
    const ui = new UIRoot(session, root);

    const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: ui.gameContainer,
        backgroundColor: '#3d5a2a',
        scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
        render: { antialias: true, roundPixels: false },
        input: { activePointers: 2 },
        scene: [BootScene, PreloadScene, GameScene]
    });
    game.registry.set('session', session);

    // The canvas container changes size when the layout switches (desktop/phone),
    // which does not always fire a window resize, so watch it directly.
    new ResizeObserver(() => {
        game.scale.getParentBounds();
        game.scale.refresh();
    }).observe(ui.gameContainer);

    if (import.meta.env.DEV) Object.assign(window, { game, session });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
