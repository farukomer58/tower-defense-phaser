import { enemyIcon, towerIcon } from '../config/assetManifest';
import type { Enemy } from '../core/Enemy';
import type { Simulation, UnlockInfo } from '../core/Simulation';
import type { GameSession } from '../session/GameSession';
import { h, icon, setText, toggleClass } from './dom';

/** Toasts, level banners, unlock cards and the boss health bar, overlaid on the stage. */
export class Notifications {
    readonly el: HTMLElement;
    private toasts = h('div', { class: 'toasts', 'aria-live': 'polite' });
    private banner = h('div', { class: 'banner hidden' });
    private unlocks = h('div', { class: 'unlocks' });
    private bossBar = h('div', { class: 'boss-bar hidden' });
    private bossName = h('span', { class: 'boss-name' });
    private bossFill = h('div', { class: 'boss-fill' });
    private bossShield = h('span', { class: 'boss-shield hidden' }, '🛡');
    private boss: Enemy | null = null;
    private bannerTimer = 0;
    private unsub: (() => void)[] = [];

    constructor(session: GameSession) {
        this.bossBar.append(h('div', { class: 'boss-head' }, this.bossName, this.bossShield), h('div', { class: 'boss-track' }, this.bossFill));
        this.el = h('div', { class: 'notifications' }, this.bossBar, this.banner, this.unlocks, this.toasts);
        session.events.on('toast', (msg, kind) => this.toast(msg, kind));
        session.events.on('simChanged', (sim) => this.bind(sim));
    }

    private bind(sim: Simulation | null): void {
        this.unsub.forEach((u) => u());
        this.unsub = [];
        this.boss = null;
        toggleClass(this.bossBar, 'hidden', true);
        this.unlocks.replaceChildren();
        if (!sim) return;
        this.unsub.push(
            sim.events.on('waveStarted', (w, def) => {
                if (def.isBoss) this.showBanner(`Level ${w}`, 'A great foe approaches!', 'boss');
                else this.showBanner(`Level ${w}`, w % 10 === 1 && w > 1 ? 'A new chapter begins' : 'Defend the walls!');
            }),
            sim.events.on('waveCompleted', (w, bonus) => this.showBanner(`Level ${w} cleared`, `+${bonus} gold bonus`, 'good')),
            sim.events.on('bossSpawned', (e) => { this.boss = e; setText(this.bossName, e.def.name); }),
            sim.events.on('unlocked', (list) => list.forEach((u) => this.unlockCard(u))),
            sim.events.on('healthChanged', (hp, delta) => {
                if (delta < 0 && hp > 0 && hp <= sim.maxHealth * 0.3) this.toast('The walls are crumbling! Repair them in the Treasury.', 'error');
            })
        );
    }

    toast(msg: string, kind: 'info' | 'error' | 'good' = 'info'): void {
        const last = this.toasts.lastElementChild as HTMLElement | null;
        if (last && last.textContent === msg) {
            last.classList.remove('bump'); void last.offsetWidth; last.classList.add('bump');
            return;
        }
        const t = h('div', { class: `toast ${kind}` }, msg);
        this.toasts.append(t);
        while (this.toasts.children.length > 3) this.toasts.firstElementChild?.remove();
        setTimeout(() => t.classList.add('out'), 1800);
        setTimeout(() => t.remove(), 2200);
    }

    showBanner(title: string, sub: string, kind = ''): void {
        this.banner.className = `banner ${kind}`;
        this.banner.replaceChildren(h('div', { class: 'banner-title' }, title), h('div', { class: 'banner-sub' }, sub));
        clearTimeout(this.bannerTimer);
        this.bannerTimer = window.setTimeout(() => this.banner.classList.add('hidden'), 2200);
    }

    private unlockCard(u: UnlockInfo): void {
        const img = u.kind === 'tower' ? towerIcon(u.id) : enemyIcon(u.id);
        const card = h('div', { class: `unlock-card ${u.kind}`, onclick: () => card.remove() },
            icon(img, 'unlock-img'),
            h('div', {},
                h('div', { class: 'unlock-kind' }, u.kind === 'tower' ? 'New tower unlocked!' : 'New enemy!'),
                h('div', { class: 'unlock-name' }, u.name),
                h('div', { class: 'unlock-desc' }, u.description)));
        this.unlocks.append(card);
        setTimeout(() => card.classList.add('out'), 6500);
        setTimeout(() => card.remove(), 7000);
    }

    update(): void {
        const b = this.boss;
        const show = !!b && b.alive;
        toggleClass(this.bossBar, 'hidden', !show);
        if (!show) { this.boss = null; return; }
        this.bossFill.style.width = `${Math.max(0, (b!.hp / b!.maxHp) * 100)}%`;
        toggleClass(this.bossShield, 'hidden', !b!.isShielded);
    }
}
