import { towerIcon, UI_ICONS } from '../config/assetManifest';
import { MAX_TOWER_LEVEL, towerTextureTier, type TowerLevelStats } from '../config/towerConfig';
import { TARGETING_MODES, type TargetingMode, type Tower } from '../core/Tower';
import type { GameSession } from '../session/GameSession';
import { fmt, h, icon, setText, toggleClass } from './dom';

const MODE_LABEL: Record<TargetingMode, string> = { first: 'First', last: 'Last', strongest: 'Strongest', closest: 'Closest' };

const pct = (v: number) => `${Math.round(v * 100)}%`;

function statRows(t: Tower, s: TowerLevelStats, next?: TowerLevelStats): [string, string, string | null][] {
    const rows: [string, string, string | null][] = [];
    const n = <T,>(f: (x: TowerLevelStats) => T, fmtv: (v: T) => string) => (next ? fmtv(f(next)) : null);
    if (t.isSupport) {
        rows.push(['Damage aura', `+${pct(s.auraDamage ?? 0)}`, n((x) => x.auraDamage ?? 0, (v) => `+${pct(v)}`)]);
        rows.push(['Speed aura', `+${pct(s.auraFireRate ?? 0)}`, n((x) => x.auraFireRate ?? 0, (v) => `+${pct(v)}`)]);
        rows.push(['Aura range', `${s.range}`, n((x) => x.range, String)]);
        if (s.auraRange || next?.auraRange) rows.push(['Range aura', `+${pct(s.auraRange ?? 0)}`, n((x) => x.auraRange ?? 0, (v) => `+${pct(v)}`)]);
        return rows;
    }
    const mult = (1 + t.buff.damage) * t.global.damage;
    rows.push(['Damage', fmt(s.damage * mult), n((x) => x.damage * mult, fmt)]);
    rows.push(['Range', `${Math.round(s.range * (1 + t.buff.range))}`, n((x) => Math.round(x.range * (1 + t.buff.range)), String)]);
    const rate = (1 + t.buff.fireRate) * t.global.fireRate;
    rows.push(['Attacks/sec', (s.fireRate * rate).toFixed(2), n((x) => x.fireRate * rate, (v) => v.toFixed(2))]);
    if (s.splashRadius) rows.push(['Blast radius', `${s.splashRadius}`, n((x) => x.splashRadius ?? 0, String)]);
    if (s.slowAmount) rows.push(['Slow', `${pct(s.slowAmount)} · ${s.slowDuration}s`, n((x) => x, (x) => `${pct(x.slowAmount ?? 0)} · ${x.slowDuration}s`)]);
    if (s.burnDps) rows.push(['Burn', `${fmt(s.burnDps * mult)}/s · ${s.burnDuration}s`, n((x) => x, (x) => `${fmt((x.burnDps ?? 0) * mult)}/s · ${x.burnDuration}s`)]);
    if (s.armorPierce) rows.push(['Armour pierce', pct(s.armorPierce), n((x) => x.armorPierce ?? 0, pct)]);
    return rows;
}

/** Details for the selected tower, with upgrade, sell and targeting controls. */
export class TowerInfoPanel {
    readonly el: HTMLElement;
    private img = icon('', 'info-icon');
    private name = h('h2', { class: 'info-name' });
    private title = h('div', { class: 'info-title' });
    private levelPips = h('div', { class: 'level-pips' });
    private stats = h('div', { class: 'info-stats' });
    private ability = h('div', { class: 'info-ability' });
    private record = h('div', { class: 'info-record' });
    private targeting = h('div', { class: 'targeting' });
    private upgradeBtn: HTMLButtonElement;
    private upgradeLabel = h('span');
    private upgradeCost = h('span', { class: 'btn-cost' });
    private sellBtn: HTMLButtonElement;
    private sellLabel = h('span');
    private modeBtns = new Map<TargetingMode, HTMLButtonElement>();
    private renderedKey = '';

    constructor(private session: GameSession) {
        this.upgradeBtn = h('button', { class: 'btn btn-gold upgrade-btn', title: 'Upgrade (U)', onclick: () => session.upgradeSelected() },
            this.upgradeLabel, h('span', { class: 'btn-cost-wrap' }, icon(UI_ICONS.coin, 'icon-xs'), this.upgradeCost));
        this.sellBtn = h('button', { class: 'btn btn-red sell-btn', title: 'Sell (S)', onclick: () => session.sellSelected() }, this.sellLabel);
        for (const m of TARGETING_MODES) {
            const b = h('button', {
                class: 'mode-btn', onclick: () => {
                    if (session.sim && session.selectedTowerId !== null) session.sim.setTargeting(session.selectedTowerId, m);
                }
            }, MODE_LABEL[m]);
            this.modeBtns.set(m, b);
            this.targeting.append(b);
        }
        this.el = h('section', { class: 'info-panel panel hidden' },
            h('button', { class: 'close-btn', 'aria-label': 'Close', onclick: () => session.select(null) }, '✕'),
            h('div', { class: 'info-head' }, this.img, h('div', {}, this.name, this.title, this.levelPips)),
            this.stats,
            this.ability,
            h('div', { class: 'targeting-wrap' }, h('span', { class: 'mini-label' }, 'Target'), this.targeting),
            this.record,
            h('div', { class: 'info-actions' }, this.upgradeBtn, this.sellBtn)
        );
        session.events.on('selection', (id) => {
            toggleClass(this.el, 'hidden', id === null);
            this.renderedKey = '';
            this.update();
        });
    }

    private selected(): Tower | undefined {
        const s = this.session;
        return s.sim && s.selectedTowerId !== null ? s.sim.towerById(s.selectedTowerId) : undefined;
    }

    update(): void {
        const t = this.selected();
        if (!t) {
            if (this.session.selectedTowerId !== null) this.session.select(null);
            return;
        }
        const sim = this.session.sim!;
        const key = `${t.id}:${t.level}:${t.buff.damage}:${t.buff.fireRate}:${t.global.damage}:${t.global.fireRate}`;
        if (key !== this.renderedKey) {
            this.renderedKey = key;
            const d = t.def;
            this.img.src = towerIcon(t.type, towerTextureTier(t.level));
            setText(this.name, d.name);
            setText(this.title, `${d.title} · ${d.damageType === 'physical' ? 'Physical' : d.damageType === 'magic' ? 'Magic' : 'Fire'}${d.canHitFlying || t.isSupport ? '' : ' · Ground only'}`);
            this.levelPips.replaceChildren(...Array.from({ length: MAX_TOWER_LEVEL }, (_, i) => h('span', { class: `pip ${i < t.level ? 'on' : ''}` })));
            const next = t.isMaxLevel ? undefined : t.statsAtLevel(t.level + 1);
            this.stats.replaceChildren(...statRows(t, t.stats, next).map(([label, cur, nxt]) =>
                h('div', { class: 'stat-row' }, h('span', { class: 'sr-label' }, label), h('span', { class: 'sr-value' }, cur),
                    nxt && nxt !== cur ? h('span', { class: 'sr-next' }, `→ ${nxt}`) : null)));
            const unlocked = t.level >= MAX_TOWER_LEVEL;
            this.ability.replaceChildren(h('strong', {}, `${unlocked ? '★' : '☆'} ${d.ability.name}: `), d.ability.description);
            toggleClass(this.ability, 'unlocked', unlocked);
            toggleClass(this.targeting.parentElement!, 'hidden', t.isSupport);
            const buffs: string[] = [];
            if (t.buff.damage > 0) buffs.push(`Mehter +${pct(t.buff.damage)}`);
            if (buffs.length) this.ability.append(h('div', { class: 'buff-note' }, `♫ ${buffs.join(', ')}`));
        }
        for (const [m, b] of this.modeBtns) toggleClass(b, 'active', t.targeting === m);
        setText(this.record, t.isSupport ? 'Empowering nearby towers' : `Kills ${t.kills} · Damage ${fmt(t.damageDealt)}`);
        const cost = t.upgradeCost;
        if (cost === null) {
            setText(this.upgradeLabel, 'Max level');
            setText(this.upgradeCost, '—');
            this.upgradeBtn.disabled = true;
        } else {
            setText(this.upgradeLabel, `Upgrade to Lv ${t.level + 1}`);
            setText(this.upgradeCost, fmt(cost));
            this.upgradeBtn.disabled = !sim.economy.canAfford(cost) || sim.status !== 'playing';
        }
        setText(this.sellLabel, `Sell +${fmt(t.sellValue)}`);
    }
}
