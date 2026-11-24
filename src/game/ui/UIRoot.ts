import { TOWER_ORDER } from '../config/towerConfig';
import { sound } from '../audio/SoundSystem';
import type { GameSession } from '../session/GameSession';
import type { ViewMode } from '../session/SaveSystem';
import { h, toggleClass } from './dom';
import { HUD } from './HUD';
import { Notifications } from './Notifications';
import { Screens } from './Screens';
import { TowerInfoPanel } from './TowerInfoPanel';
import { TowerMenu } from './TowerMenu';
import { WavePanel } from './WavePanel';

/**
 * Builds the DOM interface around the Phaser canvas and keeps it in sync.
 * Desktop: HUD on top, map in the centre, sidebar on the right.
 * Phone: compact HUD, map, and a bottom tray. A setting can force either layout.
 */
export class UIRoot {
    private hud: HUD;
    private menu: TowerMenu;
    private info: TowerInfoPanel;
    private wave: WavePanel;
    private notes: Notifications;
    readonly screens: Screens;
    private app: HTMLElement;
    readonly gameContainer: HTMLElement;
    private raf = 0;
    private mq = window.matchMedia('(max-width: 820px), (max-height: 520px) and (pointer: coarse)');

    constructor(private session: GameSession, root: HTMLElement) {
        this.app = root;
        this.hud = new HUD(session, { openTreasury: () => this.toggleTreasury(), openMenu: () => this.openPause() });
        this.menu = new TowerMenu(session);
        this.info = new TowerInfoPanel(session);
        this.wave = new WavePanel(session);
        this.notes = new Notifications(session);
        this.screens = new Screens(session);
        this.gameContainer = h('div', { id: 'game-container' });

        const stage = h('div', { id: 'stage' }, this.gameContainer, this.notes.el);
        const sidebar = h('aside', { id: 'sidebar' }, this.wave.el, h('div', { class: 'sidebar-swap' }, this.menu.el, this.info.el));
        root.replaceChildren(
            this.hud.el,
            h('main', { id: 'main' }, stage, sidebar),
            this.screens.el,
            h('div', { id: 'loading' }, h('div', { class: 'loading-title' }, 'Kingdom Guardians'), h('div', { class: 'loading-track' }, h('div', { id: 'loading-bar' })))
        );

        session.events.on('settings', () => this.applyLayout());
        session.events.on('simChanged', () => this.hud.reset());
        session.events.on('selection', (id) => toggleClass(this.app, 'has-selection', id !== null));
        session.events.on('placementMode', (t) => toggleClass(this.app, 'placing', t !== null));
        session.events.on('screen', (s) => toggleClass(this.app, 'in-game', s === 'playing' || s === 'gameover' || s === 'victory'));
        session.events.on('paused', (p) => {
            toggleClass(this.app, 'paused', p);
            if (!p && this.screens.current === 'pause') this.screens.show(null);
        });
        this.mq.addEventListener('change', () => this.applyLayout());
        window.addEventListener('keydown', (e) => this.onKey(e));
        // Pause automatically when the tab is hidden.
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && session.screen === 'playing' && !session.paused) this.openPause();
        });
        // Block browser gestures (pinch zoom, pull to refresh) on the game area.
        stage.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        root.addEventListener('contextmenu', (e) => e.preventDefault());
        this.applyLayout();
        const loop = () => { this.update(); this.raf = requestAnimationFrame(loop); };
        this.raf = requestAnimationFrame(loop);
    }

    get layout(): Exclude<ViewMode, 'auto'> {
        const m = this.session.settings.viewMode;
        return m === 'auto' ? (this.mq.matches ? 'mobile' : 'desktop') : m;
    }

    private applyLayout(): void {
        const mobile = this.layout === 'mobile';
        toggleClass(this.app, 'layout-mobile', mobile);
        toggleClass(this.app, 'layout-desktop', !mobile);
        toggleClass(this.app, 'forced-mobile', mobile && !this.mq.matches);
    }

    private toggleTreasury(): void {
        if (!this.session.sim || this.session.screen !== 'playing') return;
        if (this.screens.current === 'treasury') this.screens.close();
        else this.screens.show('treasury');
    }

    private openPause(): void {
        if (this.session.screen !== 'playing') return;
        this.session.setPaused(true);
        this.screens.show('pause');
    }

    private onKey(e: KeyboardEvent): void {
        if (e.target instanceof HTMLInputElement || e.ctrlKey || e.metaKey || e.altKey) return;
        const s = this.session;
        const k = e.key.toLowerCase();
        if (k === 'escape') {
            if (this.screens.current && this.screens.current !== 'menu' && this.screens.current !== 'gameover' && this.screens.current !== 'victory') this.screens.close();
            else if (s.placementType) s.cancelPlacement();
            else if (s.selectedTowerId !== null) s.select(null);
            else this.openPause();
            e.preventDefault();
            return;
        }
        if (s.screen !== 'playing' || this.screens.blocksGame) return;
        sound.unlock();
        const idx = Number.parseInt(k, 10);
        if (idx >= 1 && idx <= TOWER_ORDER.length) { s.beginPlacement(TOWER_ORDER[idx - 1]); return; }
        switch (k) {
            case ' ': s.startWave(); e.preventDefault(); break;
            case 'p': this.session.paused ? s.setPaused(false) : this.openPause(); break;
            case 'f': s.cycleSpeed(); break;
            case 'u': s.upgradeSelected(); break;
            case 's': s.sellSelected(); break;
            case 't': this.toggleTreasury(); break;
        }
    }

    private update(): void {
        if (!this.session.sim) return;
        this.hud.update();
        this.menu.update();
        this.info.update();
        this.wave.update();
        this.notes.update();
        this.screens.update();
    }

    destroy(): void {
        cancelAnimationFrame(this.raf);
    }
}
