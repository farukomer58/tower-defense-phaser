import { enemyIcon } from '../config/assetManifest';
import { ENEMIES } from '../config/enemyConfig';
import { TOTAL_WAVES } from '../config/gameConfig';
import { getWave, waveEnemyCount } from '../config/waveConfig';
import type { GameSession } from '../session/GameSession';
import { h, icon, setText, toggleClass } from './dom';

/** Start-wave button, auto-start toggle, countdown and wave progress. */
export class WavePanel {
    readonly el: HTMLElement;
    private startBtn: HTMLButtonElement;
    private startLabel = h('span', { class: 'start-label' });
    private startSub = h('span', { class: 'start-sub' });
    private progress = h('div', { class: 'wave-progress hidden' });
    private progressFill = h('div', { class: 'wave-progress-fill' });
    private progressText = h('span', { class: 'wave-progress-text' });
    private preview = h('div', { class: 'wave-preview' });
    private auto: HTMLInputElement;
    private previewFor = -1;

    constructor(private session: GameSession) {
        this.startBtn = h('button', { class: 'btn btn-start', title: 'Start next level (Space)', onclick: () => session.startWave() },
            h('span', { class: 'start-icon' }, '⚔'), h('span', { class: 'start-text' }, this.startLabel, this.startSub));
        this.auto = h('input', { type: 'checkbox', onchange: () => session.setAutoWave(this.auto.checked) });
        this.auto.checked = session.settings.autoWave;
        this.progress.append(this.progressFill, this.progressText);
        this.el = h('section', { class: 'wave-panel panel' },
            this.startBtn,
            this.progress,
            this.preview,
            h('label', { class: 'auto-toggle' }, this.auto, h('span', {}, 'Auto-start next level'))
        );
        session.events.on('settings', (s) => { this.auto.checked = s.autoWave; });
    }

    update(): void {
        const sim = this.session.sim;
        if (!sim) return;
        const active = sim.isWaveActive;
        const next = sim.currentWave + 1;
        toggleClass(this.startBtn, 'hidden', active || sim.status !== 'playing');
        toggleClass(this.progress, 'hidden', !active);
        if (!active && next <= TOTAL_WAVES) {
            const def = getWave(next);
            toggleClass(this.startBtn, 'boss', def.isBoss);
            setText(this.startLabel, def.isBoss ? `Boss Level ${next}` : `Start Level ${next}`);
            setText(this.startSub, sim.countdown !== null ? `Auto-start in ${Math.ceil(sim.countdown)}s` : `${waveEnemyCount(def)} enemies`);
            if (this.previewFor !== next) {
                this.previewFor = next;
                const types = [...new Set(def.groups.map((g) => g.type))];
                this.preview.replaceChildren(h('span', { class: 'mini-label' }, 'Next:'), ...types.map((t) =>
                    h('span', { class: `preview-enemy ${ENEMIES[t].isBoss ? 'boss' : ''}`, title: `${ENEMIES[t].name}: ${ENEMIES[t].description}` },
                        icon(enemyIcon(t), 'preview-icon'),
                        h('span', {}, `×${def.groups.filter((g) => g.type === t).reduce((n, g) => n + g.count, 0)}`))));
            }
            toggleClass(this.preview, 'hidden', false);
        } else {
            toggleClass(this.preview, 'hidden', true);
        }
        if (active) {
            const total = sim.waves.scheduledCount;
            const left = sim.enemiesRemaining;
            const done = Math.max(0, Math.min(1, 1 - left / Math.max(1, total)));
            this.progressFill.style.width = `${done * 100}%`;
            setText(this.progressText, `Level ${sim.currentWave}: ${left} enemies left`);
        }
    }
}
