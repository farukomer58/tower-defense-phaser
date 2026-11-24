import { enemyIcon, towerIcon, UI_ICONS } from '../config/assetManifest';
import { BOSS_ORDER, ENEMIES, REGULAR_ENEMY_ORDER } from '../config/enemyConfig';
import { DIFFICULTIES, RESEARCH, TOTAL_WAVES, WALL_REPAIR, type DifficultyId, type ResearchId } from '../config/gameConfig';
import { MAPS } from '../config/mapConfig';
import { TOWERS, TOWER_ORDER } from '../config/towerConfig';
import { sound } from '../audio/SoundSystem';
import { FAILURE_MESSAGES, type GameSession } from '../session/GameSession';
import { SaveSystem, type ViewMode } from '../session/SaveSystem';
import { fmt, h, icon, setText } from './dom';

export type ScreenId = 'menu' | 'newgame' | 'help' | 'settings' | 'pause' | 'gameover' | 'victory' | 'treasury' | 'bestiary' | null;

/** Full-screen and modal overlays: menus, pause, results, treasury, help. */
export class Screens {
    readonly el: HTMLElement;
    current: ScreenId = null;
    private back: ScreenId = null;
    private chosenMap = MAPS[0].id;
    private chosenDifficulty: DifficultyId = 'normal';
    private treasuryRefresh: (() => void) | null = null;

    constructor(private session: GameSession) {
        this.el = h('div', { id: 'screens', class: 'hidden' });
        session.events.on('screen', (s) => {
            if (s === 'menu') this.show('menu');
            else if (s === 'gameover') this.show('gameover');
            else if (s === 'victory') this.show('victory');
            else if (s === 'playing') this.show(null);
        });
    }

    get blocksGame(): boolean {
        return this.current !== null && this.current !== 'treasury';
    }

    show(id: ScreenId, back: ScreenId = null): void {
        this.current = id;
        this.back = back;
        this.treasuryRefresh = null;
        if (id === null) {
            this.el.classList.add('hidden');
            this.el.replaceChildren();
            return;
        }
        const content = this.build(id);
        this.el.className = `screen-${id} ${id === 'menu' || id === 'newgame' ? 'fullscreen' : 'modal'}`;
        this.el.replaceChildren(h('div', { class: 'screen-backdrop', onclick: () => { if (id === 'treasury') this.close(); } }), content);
    }

    close(): void {
        if (this.current === 'pause') { this.session.setPaused(false); this.show(null); return; }
        if (this.back) { this.show(this.back); return; }
        if (this.current === 'treasury' || this.current === 'help' || this.current === 'settings' || this.current === 'bestiary') {
            this.show(this.session.screen === 'menu' ? 'menu' : null);
        }
    }

    update(): void { this.treasuryRefresh?.(); }

    private btn(label: string, onclick: () => void, cls = 'btn'): HTMLButtonElement {
        return h('button', { class: cls, onclick: () => { sound.unlock(); sound.play('click'); onclick(); } }, label);
    }

    private card(title: string, ...children: (Node | string | null)[]): HTMLElement {
        return h('div', { class: 'screen-card' }, h('h2', { class: 'screen-title' }, title), ...children);
    }

    private build(id: Exclude<ScreenId, null>): HTMLElement {
        switch (id) {
            case 'menu': return this.menu();
            case 'newgame': return this.newGame();
            case 'help': return this.help();
            case 'settings': return this.settings();
            case 'pause': return this.pause();
            case 'gameover': return this.result(false);
            case 'victory': return this.result(true);
            case 'treasury': return this.treasury();
            case 'bestiary': return this.bestiary();
        }
    }

    private menu(): HTMLElement {
        const save = SaveSystem.loadGame();
        const mapName = save ? MAPS.find((m) => m.id === save.mapId)?.name ?? '' : '';
        return h('div', { class: 'menu-root' },
            h('div', { class: 'menu-hero' },
                icon(UI_ICONS.emblem, 'menu-emblem'),
                h('h1', { class: 'game-title' }, 'Kingdom Guardians'),
                h('p', { class: 'game-subtitle' }, 'Defend the Sultan\'s fortress through 100 levels')),
            h('div', { class: 'menu-buttons' },
                save ? h('button', { class: 'btn btn-gold btn-big', onclick: () => { sound.unlock(); this.session.continueGame(); } },
                    'Continue', h('small', {}, `Level ${save.completedWaves + 1} · ${mapName} · ${DIFFICULTIES[save.difficulty].name}`)) : null,
                this.btn('New Campaign', () => this.show('newgame'), `btn ${save ? '' : 'btn-gold'} btn-big`),
                h('div', { class: 'menu-row' },
                    this.btn('How to Play', () => this.show('help', 'menu')),
                    this.btn('Bestiary', () => this.show('bestiary', 'menu')),
                    this.btn('Settings', () => this.show('settings', 'menu')))),
            h('p', { class: 'menu-foot' }, 'Original art generated for this game. Replace any file in /assets to reskin it.'));
    }

    private newGame(): HTMLElement {
        const records = SaveSystem.loadRecords();
        const maps = h('div', { class: 'map-choices' });
        const diffs = h('div', { class: 'diff-choices' });
        const renderMaps = () => maps.replaceChildren(...MAPS.map((m) => {
            const rec = records[`${m.id}:${this.chosenDifficulty}`];
            return h('button', {
                class: `map-card ${m.id} ${m.id === this.chosenMap ? 'selected' : ''}`,
                style: { backgroundImage: `url(assets/world/${m.theme.groundTexture}.svg)` }, onclick: () => { this.chosenMap = m.id; renderMaps(); } },
                h('span', { class: 'map-name' }, m.name),
                h('span', { class: 'map-sub' }, m.subtitle),
                h('span', { class: 'map-hint' }, m.difficultyHint),
                h('span', { class: 'map-record' }, rec ? (rec.won ? '★ Conquered' : `Best: level ${rec.bestWave}`) : 'Not played'));
        }));
        const renderDiffs = () => diffs.replaceChildren(...(Object.keys(DIFFICULTIES) as DifficultyId[]).map((d) =>
            h('button', { class: `diff-btn ${d === this.chosenDifficulty ? 'selected' : ''}`, onclick: () => { this.chosenDifficulty = d; renderDiffs(); renderMaps(); } },
                h('strong', {}, DIFFICULTIES[d].name), h('small', {}, DIFFICULTIES[d].description))));
        renderMaps();
        renderDiffs();
        return h('div', { class: 'newgame-root' },
            h('h2', { class: 'screen-title' }, 'Choose your battlefield'),
            maps,
            h('h3', { class: 'section-title' }, 'Difficulty'),
            diffs,
            h('div', { class: 'screen-actions' },
                this.btn('Back', () => this.show('menu')),
                this.btn('Begin the defence', () => {
                    if (this.session.hasSave && !confirm('Starting a new campaign will replace your saved game. Continue?')) return;
                    this.session.newGame(this.chosenMap, this.chosenDifficulty);
                }, 'btn btn-gold')));
    }

    private help(): HTMLElement {
        return this.card('How to Play',
            h('div', { class: 'help-body' },
                h('ul', {},
                    h('li', {}, 'Enemies march along the road toward your castle. Every one that gets through damages the walls.'),
                    h('li', {}, 'Pick a tower card, then tap a green tile beside the road to build it. Tap a built tower to upgrade it (up to level 5), sell it, or change its targeting.'),
                    h('li', {}, 'Kill enemies and clear levels to earn gold. Press Start when you are ready: the next level never starts by itself unless you turn on auto-start.'),
                    h('li', {}, 'Every 10th level is a boss level, and a new enemy or tower appears every 10 levels.'),
                    h('li', {}, 'Use the Treasury to buy kingdom-wide upgrades and repair your walls.'),
                    h('li', {}, 'Armoured foes resist arrows and cannonballs: use Dervish magic or Janissary shots. Bombards cannot hit flying enemies. Fire stops trolls regenerating.')),
                h('h3', { class: 'section-title' }, 'Towers'),
                h('div', { class: 'help-towers' }, ...TOWER_ORDER.map((t) => h('div', { class: 'help-tower' }, icon(towerIcon(t), 'help-icon'),
                    h('div', {}, h('strong', {}, `${TOWERS[t].name} · ${TOWERS[t].cost}g`), h('small', {}, `${TOWERS[t].description}${TOWERS[t].unlockWave > 1 ? ` Unlocks at level ${TOWERS[t].unlockWave}.` : ''}`))))),
                h('h3', { class: 'section-title desktop-only' }, 'Keyboard'),
                h('p', { class: 'desktop-only keys' }, '1-7 build · Space start level · P pause · F speed · U upgrade · S sell · T treasury · Esc cancel/menu')),
            h('div', { class: 'screen-actions' }, this.btn('Close', () => this.close(), 'btn btn-gold')));
    }

    private bestiary(): HTMLElement {
        const entry = (id: keyof typeof ENEMIES) => {
            const e = ENEMIES[id];
            const traits = [e.armor ? `Armour ${Math.round(e.armor * 100)}%` : '', e.magicResist ? `Magic resist ${Math.round(e.magicResist * 100)}%` : '',
                e.flying ? 'Flying' : '', e.regen ? 'Regenerates' : '', e.healAura ? 'Heals allies' : '', e.splitInto ? 'Splits' : '',
                e.summon ? 'Summons' : '', e.shield ? 'Shields' : '', e.blink ? 'Blinks' : ''].filter(Boolean).join(' · ');
            return h('div', { class: `bestiary-entry ${e.isBoss ? 'boss' : ''}` }, icon(enemyIcon(id), 'help-icon'),
                h('div', {}, h('strong', {}, `${e.name}`), h('small', { class: 'from' }, ` from level ${e.unlockWave}`),
                    h('small', {}, e.description), traits ? h('small', { class: 'traits' }, traits) : null));
        };
        return this.card('Bestiary',
            h('div', { class: 'help-body bestiary' },
                h('h3', { class: 'section-title' }, 'Invaders'), ...REGULAR_ENEMY_ORDER.map(entry),
                h('h3', { class: 'section-title' }, 'Bosses'), ...BOSS_ORDER.map(entry)),
            h('div', { class: 'screen-actions' }, this.btn('Close', () => this.close(), 'btn btn-gold')));
    }

    private settings(): HTMLElement {
        const s = this.session.settings;
        const views: [ViewMode, string][] = [['auto', 'Automatic'], ['desktop', 'Desktop'], ['mobile', 'Phone']];
        const viewRow = h('div', { class: 'seg' }, ...views.map(([v, label]) =>
            h('button', { class: `seg-btn ${s.viewMode === v ? 'selected' : ''}`, onclick: () => { this.session.updateSettings({ viewMode: v }); this.show('settings', this.back); } }, label)));
        const toggle = (label: string, key: 'sound' | 'autoWave' | 'showDamage') => {
            const input = h('input', { type: 'checkbox' });
            input.checked = s[key];
            input.addEventListener('change', () => {
                if (key === 'autoWave') this.session.setAutoWave(input.checked);
                else this.session.updateSettings({ [key]: input.checked });
            });
            return h('label', { class: 'toggle-row' }, h('span', {}, label), input);
        };
        return this.card('Settings',
            h('div', { class: 'settings-body' },
                h('div', { class: 'setting' }, h('span', { class: 'mini-label' }, 'View'), viewRow,
                    h('small', {}, 'Automatic picks the phone layout on small screens. The map turns to portrait when the screen is taller than it is wide.')),
                toggle('Sound effects', 'sound'),
                toggle('Auto-start next level', 'autoWave'),
                toggle('Show critical-hit numbers', 'showDamage')),
            h('div', { class: 'screen-actions' }, this.btn('Done', () => this.close(), 'btn btn-gold')));
    }

    private pause(): HTMLElement {
        const sim = this.session.sim;
        return this.card('Paused',
            sim ? h('p', { class: 'pause-info' }, `${sim.map.name} · ${sim.difficulty.name} · Level ${Math.max(1, sim.currentWave)}/${TOTAL_WAVES}`) : null,
            h('div', { class: 'menu-buttons' },
                this.btn('Resume', () => this.close(), 'btn btn-gold btn-big'),
                h('div', { class: 'menu-row' },
                    this.btn('How to Play', () => this.show('help', 'pause')),
                    this.btn('Settings', () => this.show('settings', 'pause'))),
                this.btn('Restart campaign', () => { if (confirm('Restart from level 1? Your progress on this campaign will be lost.')) this.session.restart(); }, 'btn btn-red'),
                this.btn('Quit to menu', () => this.session.quitToMenu())),
            h('p', { class: 'hint' }, 'Progress is saved automatically after every cleared level.'));
    }

    private result(won: boolean): HTMLElement {
        const sim = this.session.sim;
        const stats = sim ? [
            ['Levels cleared', `${sim.completedWaves}/${TOTAL_WAVES}`], ['Enemies defeated', fmt(sim.stats.kills)],
            ['Bosses slain', String(sim.stats.bossesDefeated)], ['Breaches', String(sim.breached)],
            ['Towers built', String(sim.stats.towersBuilt)], ['Gold earned', fmt(sim.stats.coinsEarned)]
        ] : [];
        return this.card(won ? 'Victory!' : 'The castle has fallen',
            h('p', { class: 'result-sub' }, won ? 'All 100 levels have been held. The kingdom sings your name!' : 'The invaders broke through the walls. Regroup and try again.'),
            h('div', { class: 'result-stats' }, ...stats.map(([k, v]) => h('div', { class: 'result-stat' }, h('span', {}, k), h('strong', {}, v)))),
            h('div', { class: 'screen-actions' },
                this.btn('Main menu', () => this.session.quitToMenu()),
                this.btn(won ? 'Play again' : 'Try again', () => this.session.restart(), 'btn btn-gold')));
    }

    private treasury(): HTMLElement {
        const body = h('div', { class: 'treasury-body' });
        const coinsEl = h('strong');
        const rows: { refresh: () => void }[] = [];
        const sim = () => this.session.sim;
        for (const id of Object.keys(RESEARCH) as ResearchId[]) {
            const r = RESEARCH[id];
            const level = h('span', { class: 'tr-level' });
            const cost = h('span');
            const b = h('button', {
                class: 'btn btn-gold', onclick: () => {
                    const s = sim(); if (!s) return;
                    const res = s.buyResearch(id);
                    if (res.ok) { sound.play('upgrade'); this.session.toast(`${r.name} level ${res.value}!`, 'good'); }
                    else { sound.play('error'); this.session.toast(FAILURE_MESSAGES[res.reason], 'error'); }
                    refresh();
                }
            }, icon(UI_ICONS.coin, 'icon-xs'), cost);
            body.append(h('div', { class: 'tr-row' }, h('div', {}, h('strong', {}, r.name), level, h('small', {}, r.description)), b));
            rows.push({
                refresh: () => {
                    const s = sim(); if (!s) return;
                    const lv = s.research[id];
                    setText(level, ` ${lv}/${r.maxLevel} (now +${Math.round(lv * r.perLevel * 100)}%)`);
                    const c = s.researchCost(id);
                    setText(cost, c === null ? 'Max' : fmt(c));
                    b.disabled = c === null || !s.economy.canAfford(c);
                }
            });
        }
        const repairCost = h('span');
        const repairBtn = h('button', {
            class: 'btn btn-red', onclick: () => {
                const s = sim(); if (!s) return;
                const res = s.repairWalls();
                if (res.ok) { sound.play('place'); this.session.toast(`Walls repaired +${res.value}`, 'good'); }
                else { sound.play('error'); this.session.toast(res.reason === 'max_level' ? 'The walls are already whole' : FAILURE_MESSAGES[res.reason], 'error'); }
                refresh();
            }
        }, icon(UI_ICONS.coin, 'icon-xs'), repairCost);
        const hpInfo = h('span', { class: 'tr-level' });
        body.append(h('div', { class: 'tr-row' }, h('div', {}, h('strong', {}, 'Repair the Walls'), hpInfo,
            h('small', {}, `Restore ${WALL_REPAIR.amount} castle health. The cost rises each level.`)), repairBtn));
        rows.push({
            refresh: () => {
                const s = sim(); if (!s) return;
                setText(hpInfo, ` ${s.health}/${s.maxHealth} health`);
                const c = s.repairCost;
                setText(repairCost, c === null ? 'Full' : fmt(c));
                repairBtn.disabled = c === null || !s.economy.canAfford(c);
            }
        });
        const refresh = () => {
            const s = sim();
            if (s) setText(coinsEl, fmt(s.economy.coins));
            rows.forEach((r) => r.refresh());
        };
        refresh();
        this.treasuryRefresh = refresh;
        return this.card('Treasury',
            h('p', { class: 'treasury-coins' }, icon(UI_ICONS.coin, 'icon-sm'), ' ', coinsEl, ' gold in the vault'),
            body,
            h('div', { class: 'screen-actions' }, this.btn('Close', () => this.close(), 'btn btn-gold')));
    }
}
