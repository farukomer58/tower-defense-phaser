import { towerIcon, UI_ICONS } from '../config/assetManifest';
import { TOWERS, TOWER_ORDER, type TowerTypeId } from '../config/towerConfig';
import type { GameSession } from '../session/GameSession';
import { h, icon, toggleClass } from './dom';

/** Tower cards. Tap one to enter placement mode; tap it again to cancel. */
export class TowerMenu {
    readonly el: HTMLElement;
    private cards = new Map<TowerTypeId, { card: HTMLButtonElement; lock: HTMLElement }>();
    private cancelBtn: HTMLButtonElement;

    constructor(private session: GameSession) {
        const list = h('div', { class: 'tower-cards' });
        TOWER_ORDER.forEach((id, i) => {
            const def = TOWERS[id];
            const lock = h('span', { class: 'card-lock' }, `🔒 Level ${def.unlockWave}`);
            const card = h('button', {
                class: 'tower-card', title: `${def.name}: ${def.description} (${i + 1})`, 'aria-label': `${def.name}, ${def.cost} gold`,
                style: { '--accent': def.color }, onclick: () => session.beginPlacement(id)
            },
                h('span', { class: 'card-key' }, String(i + 1)),
                icon(towerIcon(id), 'card-icon'),
                h('span', { class: 'card-name' }, def.name),
                h('span', { class: 'card-cost' }, icon(UI_ICONS.coin, 'icon-xs'), String(def.cost)),
                h('span', { class: 'card-desc' }, def.shortDescription),
                lock
            );
            this.cards.set(id, { card, lock });
            list.append(card);
        });
        this.cancelBtn = h('button', { class: 'cancel-placement hidden', onclick: () => session.cancelPlacement() }, '✕ Cancel placement');
        this.el = h('section', { class: 'tower-menu panel' },
            h('h2', { class: 'panel-title' }, 'Build Towers'),
            list,
            h('p', { class: 'hint desktop-only' }, 'Click a tower, then click a green tile. Hold Shift to place several.'),
            this.cancelBtn
        );
        session.events.on('placementMode', (type) => {
            for (const [id, { card }] of this.cards) toggleClass(card, 'selected', id === type);
            toggleClass(this.cancelBtn, 'hidden', type === null);
        });
    }

    update(): void {
        const sim = this.session.sim;
        if (!sim) return;
        for (const [id, { card }] of this.cards) {
            const unlocked = sim.isTowerUnlocked(id);
            toggleClass(card, 'locked', !unlocked);
            toggleClass(card, 'unaffordable', unlocked && !sim.economy.canAfford(TOWERS[id].cost));
        }
    }
}
