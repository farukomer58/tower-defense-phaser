import { UI_ICONS } from '../config/assetManifest';
import { TOTAL_WAVES } from '../config/gameConfig';
import type { GameSession } from '../session/GameSession';
import { fmt, h, icon, setText, toggleClass } from './dom';

/** Top bar: castle health, gold, level, enemies left, breaches and game controls. */
export class HUD {
    readonly el: HTMLElement;
    private health = h('span', { class: 'stat-value' });
    private healthBar = h('span', { class: 'mini-bar-fill' });
    private coins = h('span', { class: 'stat-value' });
    private wave = h('span', { class: 'stat-value' });
    private enemies = h('span', { class: 'stat-value' });
    private breached = h('span', { class: 'stat-value' });
    private healthStat: HTMLElement;
    private coinStat: HTMLElement;
    private pauseBtn: HTMLButtonElement;
    private speedBtn: HTMLButtonElement;
    private soundBtn: HTMLButtonElement;
    private lastHealth = -1;
    private lastCoins = -1;

    constructor(private session: GameSession, actions: { openTreasury: () => void; openMenu: () => void }) {
        this.healthStat = h('div', { class: 'stat stat-health', title: 'Castle health' }, icon(UI_ICONS.heart), this.health,
            h('span', { class: 'mini-bar' }, this.healthBar));
        this.coinStat = h('div', { class: 'stat stat-coins', title: 'Gold' }, icon(UI_ICONS.coin), this.coins);
        this.pauseBtn = h('button', { class: 'hud-btn', title: 'Pause (P)', 'aria-label': 'Pause', onclick: () => session.togglePause() }, '❚❚');
        this.speedBtn = h('button', { class: 'hud-btn speed', title: 'Game speed (F)', 'aria-label': 'Game speed', onclick: () => session.cycleSpeed() }, '1×');
        this.soundBtn = h('button', {
            class: 'hud-btn', title: 'Sound', 'aria-label': 'Toggle sound',
            onclick: () => session.updateSettings({ sound: !session.settings.sound })
        }, '🔊');
        this.el = h('header', { id: 'hud' },
            h('div', { class: 'hud-stats' },
                this.healthStat,
                this.coinStat,
                h('div', { class: 'stat stat-wave', title: 'Level' }, icon(UI_ICONS.flag), h('span', { class: 'stat-label' }, 'Level'), this.wave),
                h('div', { class: 'stat stat-enemies', title: 'Enemies remaining in this level' }, icon(UI_ICONS.swords), this.enemies),
                h('div', { class: 'stat stat-breach', title: 'Enemies that breached your castle' }, icon(UI_ICONS.gate), this.breached)
            ),
            h('div', { class: 'hud-controls' },
                h('button', { class: 'hud-btn treasury', title: 'Treasury (T)', 'aria-label': 'Treasury', onclick: actions.openTreasury }, icon(UI_ICONS.coin, 'icon-sm'), h('span', { class: 'btn-label' }, 'Treasury')),
                this.pauseBtn, this.speedBtn, this.soundBtn,
                h('button', { class: 'hud-btn', title: 'Menu (Esc)', 'aria-label': 'Menu', onclick: actions.openMenu }, '☰')
            )
        );
        session.events.on('paused', (p) => { setText(this.pauseBtn, p ? '▶' : '❚❚'); toggleClass(this.pauseBtn, 'active', p); });
        session.events.on('speed', (s) => { setText(this.speedBtn, `${s}×`); toggleClass(this.speedBtn, 'active', s > 1); });
        session.events.on('settings', (s) => setText(this.soundBtn, s.sound ? '🔊' : '🔇'));
        setText(this.soundBtn, session.settings.sound ? '🔊' : '🔇');
    }

    update(): void {
        const sim = this.session.sim;
        if (!sim) return;
        if (sim.health !== this.lastHealth) {
            if (this.lastHealth > sim.health) this.flash(this.healthStat, 'hit');
            else if (this.lastHealth >= 0) this.flash(this.healthStat, 'gain');
            this.lastHealth = sim.health;
            setText(this.health, sim.health);
            this.healthBar.style.width = `${(sim.health / sim.maxHealth) * 100}%`;
            toggleClass(this.healthStat, 'danger', sim.health <= sim.maxHealth * 0.3);
        }
        const coins = sim.economy.coins;
        if (coins !== this.lastCoins) {
            if (coins > this.lastCoins && this.lastCoins >= 0) this.flash(this.coinStat, 'gain');
            this.lastCoins = coins;
            setText(this.coins, fmt(coins));
        }
        setText(this.wave, `${Math.max(1, sim.currentWave)}/${TOTAL_WAVES}`);
        setText(this.enemies, sim.enemiesRemaining);
        setText(this.breached, sim.breached);
    }

    reset(): void { this.lastHealth = -1; this.lastCoins = -1; }

    private flash(el: HTMLElement, cls: string): void {
        el.classList.remove(cls);
        void el.offsetWidth; // restart the animation
        el.classList.add(cls);
    }
}
