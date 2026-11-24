// Enemy art: side view, facing right. Regular enemies use a 96x96 canvas (feet near y=90);
// bosses use 160x160 and add crowns, capes and other regalia.
import { P, INK, svg, o, f, radial } from './common.mjs';

const eye = (x, y, r = 4, iris = '#1b1b1b') => `<circle cx="${x}" cy="${y}" r="${r}" ${o('#fff')} stroke-width="2"/><circle cx="${x + r * 0.35}" cy="${y}" r="${r * 0.5}" fill="${iris}"/>`;
const glowEye = (x, y, c, r = 3.5) => `<circle cx="${x}" cy="${y}" r="${r + 3}" fill="${c}" opacity="0.35"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const shadow = (cx = 48, cy = 90, rx = 26) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="5" fill="#000" opacity="0.2"/>`;

// Each creature returns { body, head: [x, y] } in 96x96 space.
const C = {
    goblin(c = { skin: '#7cb342', dark: '#4f7a2a', cloth: '#8d5a2b' }) {
        return {
            head: [50, 30], body: `${shadow()}
<rect x="38" y="68" width="8" height="20" rx="3" ${o(c.dark)}/><rect x="52" y="68" width="8" height="20" rx="3" ${o(c.dark)}/>
<ellipse cx="49" cy="60" rx="17" ry="16" ${o(c.cloth)}/>
<path d="M 36 56 L 62 56" stroke="${P.gold}" stroke-width="3"/>
<path d="M 30 30 L 14 20 L 34 40 Z" ${o(c.skin)}/><path d="M 66 28 L 84 16 L 66 40 Z" ${o(c.skin)}/>
<circle cx="50" cy="34" r="17" ${o(c.skin)}/>
${eye(58, 31, 5)}${eye(45, 31, 4)}
<path d="M 52 44 Q 58 48 64 42" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
<path d="M 56 44 l 2 4 l 2 -4" fill="#fff" stroke="${INK}" stroke-width="1"/>
<path d="M 32 26 Q 50 8 68 26 Q 50 20 32 26 Z" ${o('#6b4121')} stroke-width="2.5"/>
<rect x="64" y="56" width="7" height="8" rx="2" ${o(c.skin)} stroke-width="2"/>
<path d="M 70 60 L 90 50" stroke="#cfd8dc" stroke-width="5" stroke-linecap="round"/><path d="M 70 60 L 90 50" stroke="${INK}" stroke-width="1" />`
        };
    },
    orc(c = { skin: '#6d8b5a', dark: '#45603a', armor: '#7d7d86' }) {
        return {
            head: [52, 22], body: `${shadow(48, 90, 30)}
<rect x="34" y="66" width="11" height="22" rx="3" ${o('#5a4030')}/><rect x="54" y="66" width="11" height="22" rx="3" ${o('#5a4030')}/>
<path d="M 26 70 Q 22 40 48 36 Q 76 40 72 70 Z" ${o(c.skin)}/>
<path d="M 30 62 L 68 62 L 66 72 L 32 72 Z" ${o('#6b4121')} stroke-width="2.5"/>
<path d="M 22 44 Q 30 30 44 38 L 40 50 Z" ${o(c.armor)}/>
<circle cx="52" cy="28" r="17" ${o(c.skin)}/>
<path d="M 38 22 L 66 22 L 66 26 L 38 26 Z" fill="${c.dark}"/>
${glowEye(60, 26, '#ffcc33', 3)}${glowEye(48, 26, '#ffcc33', 2.6)}
<path d="M 52 38 Q 60 42 68 36" fill="none" stroke="${INK}" stroke-width="2.5"/>
<path d="M 55 37 l -1 -7 l 4 6 Z M 64 36 l 1 -7 l 3 6 Z" fill="#fff8e0" stroke="${INK}" stroke-width="1.5"/>
<line x1="72" y1="62" x2="84" y2="16" stroke="${P.woodDark}" stroke-width="5" stroke-linecap="round"/>
<path d="M 80 16 Q 96 18 94 36 Q 86 28 78 30 Z" ${o('#b0bec5')} stroke-width="2.5"/>
<circle cx="72" cy="58" r="6" ${o(c.skin)} stroke-width="2"/>`
        };
    },
    wolfRider() {
        const g = C.goblin();
        return {
            head: [44, 18], body: `${shadow(48, 90, 34)}
<path d="M 14 54 Q 2 46 6 38 Q 12 48 22 50 Z" ${o('#6f6f75')}/>
<rect x="22" y="66" width="8" height="22" rx="3" ${o('#5d5d63')}/><rect x="62" y="66" width="8" height="22" rx="3" ${o('#5d5d63')}/>
<ellipse cx="46" cy="60" rx="30" ry="15" ${o('#8a8a92')}/>
<path d="M 30 70 Q 46 76 64 70" fill="none" stroke="#c9c9cf" stroke-width="4" stroke-linecap="round"/>
<path d="M 66 52 Q 80 42 90 54 L 94 60 Q 84 66 72 64 Z" ${o('#8a8a92')}/>
<path d="M 70 46 L 72 34 L 78 44 Z" ${o('#6f6f75')} stroke-width="2"/>
${glowEye(80, 51, '#ffd54f', 2.4)}
<path d="M 88 60 l -4 3 l -3 -3" fill="#fff" stroke="${INK}" stroke-width="1"/>
<rect x="36" y="44" width="20" height="10" rx="3" ${o('#8e2a20')} stroke-width="2"/>
<g transform="translate(-6 -16) scale(0.62) translate(24 0)">${g.body.replace(shadow(), '')}</g>`
        };
    },
    golem(c = { stone: '#9ea3a8', dark: '#6e7378', rune: '#5ef2ff', moss: '#6a9a4a' }) {
        return {
            head: [50, 18], body: `${shadow(48, 90, 32)}
<rect x="28" y="66" width="16" height="22" rx="3" ${o(c.dark)}/><rect x="54" y="66" width="16" height="22" rx="3" ${o(c.dark)}/>
<path d="M 22 40 L 74 36 L 78 70 L 20 72 Z" ${o(c.stone)}/>
<path d="M 50 38 L 74 36 L 78 70 L 52 71 Z" ${f(c.dark)} opacity="0.4"/>
<path d="M 30 50 l 8 6 l -4 8 M 60 46 l -6 10 l 8 4" stroke="${c.rune}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<rect x="8" y="40" width="16" height="30" rx="5" ${o(c.stone)}/><rect x="74" y="40" width="16" height="30" rx="5" ${o(c.stone)}/>
<rect x="34" y="12" width="32" height="26" rx="5" ${o(c.stone)}/>
${glowEye(57, 24, c.rune, 3)}${glowEye(45, 24, c.rune, 2.6)}
<path d="M 24 40 Q 30 34 38 40" ${o(c.moss)} stroke-width="2"/><path d="M 60 12 Q 66 6 66 14" ${o(c.moss)} stroke-width="2"/>`
        };
    },
    scorpion(c = { shell: '#d4a056', dark: '#9c6a2c' }) {
        return {
            head: [70, 54], body: `${shadow(48, 88, 36)}
${[26, 38, 50, 62].map((x) => `<path d="M ${x} 70 L ${x - 6} 86 M ${x + 2} 70 L ${x + 8} 86" stroke="${c.dark}" stroke-width="4" stroke-linecap="round"/>`).join('')}
<ellipse cx="46" cy="66" rx="28" ry="12" ${o(c.shell)}/>
${[30, 42, 54].map((x) => `<path d="M ${x} 56 Q ${x + 3} 66 ${x} 76" fill="none" stroke="${c.dark}" stroke-width="2"/>`).join('')}
<path d="M 20 64 Q 6 50 12 32 Q 18 16 34 18" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
<path d="M 20 64 Q 6 50 12 32 Q 18 16 34 18" fill="none" stroke="${c.shell}" stroke-width="7" stroke-linecap="round"/>
<path d="M 32 12 L 46 18 L 34 26 Z" ${o('#5a2f10')} stroke-width="2"/>
<path d="M 70 62 Q 84 58 84 48" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M 70 62 Q 84 58 84 48" fill="none" stroke="${c.shell}" stroke-width="4"/>
<path d="M 80 48 Q 82 34 94 40 L 86 46 L 94 50 Q 84 58 80 48 Z" ${o(c.shell)} stroke-width="2"/>
<path d="M 72 72 Q 86 74 90 66 L 82 66" ${o(c.shell)} stroke-width="2"/>
${glowEye(70, 58, '#222', 2)}${glowEye(64, 57, '#222', 1.8)}`
        };
    },
    ifrit(c = { outer: '#ff7a1a', mid: '#ffb02e', core: '#fff3a0' }) {
        return {
            head: [50, 30], body: `<ellipse cx="48" cy="92" rx="18" ry="3" fill="#000" opacity="0.12"/>
<path d="M 48 92 Q 20 70 30 44 Q 30 60 40 58 Q 30 30 50 8 Q 52 30 62 30 Q 60 16 72 10 Q 64 36 72 52 Q 80 44 78 32 Q 90 62 62 84 Q 56 90 48 92 Z" ${o(c.outer)}/>
<path d="M 48 86 Q 30 70 38 52 Q 44 62 48 56 Q 44 38 56 26 Q 58 44 64 48 Q 72 62 60 78 Z" fill="${c.mid}"/>
<path d="M 50 78 Q 40 66 48 56 Q 54 64 58 60 Q 62 70 50 78 Z" fill="${c.core}"/>
${glowEye(56, 42, '#fff', 3)}${glowEye(46, 42, '#fff', 2.6)}
<path d="M 46 52 Q 52 56 58 52" fill="none" stroke="${INK}" stroke-width="2"/>
<path d="M 30 56 Q 18 52 16 40" fill="none" stroke="${c.outer}" stroke-width="6" stroke-linecap="round"/>
<path d="M 70 58 Q 84 56 88 44" fill="none" stroke="${c.outer}" stroke-width="6" stroke-linecap="round"/>`
        };
    },
    troll(c = { skin: '#7a8fa6', dark: '#56667a', cloth: '#6b4121' }) {
        return {
            head: [60, 24], body: `${shadow(48, 90, 32)}
<rect x="30" y="68" width="14" height="20" rx="4" ${o(c.dark)}/><rect x="54" y="68" width="14" height="20" rx="4" ${o(c.dark)}/>
<path d="M 20 76 Q 14 36 50 32 Q 82 36 78 76 Z" ${o(c.skin)}/>
<path d="M 22 66 L 76 66 L 74 78 L 24 78 Z" ${o(c.cloth)} stroke-width="2.5"/>
<path d="M 34 44 Q 42 52 52 46" fill="none" stroke="${c.dark}" stroke-width="2"/>
<circle cx="60" cy="30" r="15" ${o(c.skin)}/>
<path d="M 68 30 Q 80 32 74 40 Q 68 38 66 34" ${o(c.skin)} stroke-width="2.5"/>
${eye(62, 24, 3.6, '#7a1d1d')}
<path d="M 58 40 L 70 40" stroke="${INK}" stroke-width="2.5"/><path d="M 60 40 l 1 -4 l 2 4 M 66 40 l 1 -4 l 2 4" fill="#fff" stroke="${INK}" stroke-width="1"/>
<path d="M 48 18 Q 52 8 60 14 Q 66 6 70 16" fill="none" stroke="${c.dark}" stroke-width="3" stroke-linecap="round"/>
<path d="M 76 56 L 92 20" stroke="${P.woodDark}" stroke-width="9" stroke-linecap="round"/>
<circle cx="90" cy="22" r="8" ${o(P.wood)}/>
<circle cx="76" cy="58" r="7" ${o(c.skin)} stroke-width="2"/>`
        };
    },
    shaman(c = { skin: '#8bc34a', robe: '#5b3a7a', mask: '#efe6d2', orb: '#7dff8a' }) {
        return {
            head: [50, 26], body: `${shadow()}
<path d="M 30 88 Q 30 50 50 46 Q 70 50 70 88 Z" ${o(c.robe)}/>
<path d="M 50 50 L 50 88" stroke="${P.gold}" stroke-width="2.5"/>
<path d="M 32 30 L 16 22 L 34 40 Z" ${o(c.skin)}/><path d="M 66 30 L 84 20 L 66 40 Z" ${o(c.skin)}/>
<circle cx="50" cy="34" r="15" ${o(c.skin)}/>
<path d="M 38 26 Q 50 18 64 26 L 62 44 Q 50 50 40 44 Z" ${o(c.mask)} stroke-width="2.5"/>
${glowEye(56, 34, c.orb, 2.6)}${glowEye(46, 34, c.orb, 2.2)}
<path d="M 44 18 L 40 4 M 52 16 L 54 0 M 60 18 L 66 6" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/>
<line x1="74" y1="88" x2="78" y2="22" stroke="${P.woodDark}" stroke-width="4" stroke-linecap="round"/>
<circle cx="78" cy="18" r="10" fill="${c.orb}" opacity="0.35"/><circle cx="78" cy="18" r="6" ${o(c.orb)} stroke-width="2"/>`
        };
    },
    wraith(c = { cloak: '#5f7f86', dark: '#34474d', glow: '#9ff6ff' }) {
        return {
            head: [50, 26], body: `<ellipse cx="48" cy="92" rx="18" ry="3" fill="#000" opacity="0.12"/>
<g opacity="0.88">
<path d="M 26 88 L 30 40 Q 34 12 52 12 Q 70 12 72 40 L 76 88 L 66 80 L 58 90 L 50 80 L 42 90 L 34 80 Z" ${o(c.cloak)}/>
<path d="M 36 40 Q 38 22 52 22 Q 66 22 66 40 Q 60 50 52 50 Q 42 50 36 40 Z" fill="${c.dark}"/>
${glowEye(58, 36, c.glow, 3)}${glowEye(46, 36, c.glow, 2.6)}
<path d="M 30 56 Q 16 60 12 72" fill="none" stroke="${c.cloak}" stroke-width="7" stroke-linecap="round"/>
<path d="M 70 56 Q 84 58 90 48" fill="none" stroke="${c.cloak}" stroke-width="7" stroke-linecap="round"/>
<path d="M 40 60 Q 50 64 60 60" fill="none" stroke="${c.glow}" stroke-width="2" opacity="0.7"/>
</g>`
        };
    },
    slime(c = { body: '#e0b84a', dark: '#b08a2a' }) {
        return {
            head: [50, 30], body: `${shadow(48, 89, 30)}
<path d="M 16 86 Q 10 56 30 40 Q 48 22 66 38 Q 88 54 82 86 Z" ${o(c.body)} opacity="0.95"/>
<path d="M 24 80 Q 22 60 34 48" fill="none" stroke="#fff6c8" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
<circle cx="64" cy="70" r="4" fill="${c.dark}" opacity="0.6"/><circle cx="40" cy="74" r="3" fill="${c.dark}" opacity="0.6"/><circle cx="52" cy="80" r="2.5" fill="${c.dark}" opacity="0.6"/>
${eye(60, 52, 6)}${eye(44, 52, 5)}
<path d="M 46 64 Q 54 70 62 64" fill="none" stroke="${INK}" stroke-width="2.5"/>`
        };
    },
    griffin(c = { fur: '#c9a26b', feather: '#f2ead8', wing: '#8a5a2b' }) {
        return {
            head: [74, 28], body: `${shadow(48, 92, 26)}
<path d="M 30 44 Q 10 10 40 4 Q 36 20 52 36 Z" ${o(c.wing)}/>
<path d="M 34 38 Q 24 18 40 10" fill="none" stroke="${c.feather}" stroke-width="3"/>
<path d="M 18 60 Q 4 62 6 74" fill="none" stroke="${c.fur}" stroke-width="5" stroke-linecap="round"/>
<ellipse cx="44" cy="58" rx="28" ry="14" ${o(c.fur)}/>
<rect x="28" y="66" width="7" height="16" rx="3" ${o(c.fur)} stroke-width="2"/><rect x="56" y="66" width="7" height="16" rx="3" ${o(c.feather)} stroke-width="2"/>
<path d="M 60 50 Q 66 24 80 24 Q 92 26 90 40 L 74 56 Z" ${o(c.feather)}/>
<path d="M 86 30 L 98 38 L 86 42 Z" ${o(P.gold)} stroke-width="2"/>
${glowEye(80, 31, '#222', 2.4)}
<path d="M 50 46 Q 60 10 86 2 Q 76 24 70 46 Z" ${o(c.wing)}/>
<path d="M 60 40 Q 68 20 82 8" fill="none" stroke="${c.feather}" stroke-width="3"/>`
        };
    },
    mammoth(c = { fur: '#8a5a3a', dark: '#5e3b24', armor: P.redDark }) {
        return {
            head: [72, 30], body: `${shadow(48, 90, 40)}
<rect x="18" y="62" width="14" height="26" rx="4" ${o(c.dark)}/><rect x="36" y="64" width="14" height="24" rx="4" ${o(c.dark)}/>
<rect x="56" y="64" width="14" height="24" rx="4" ${o(c.dark)}/>
<path d="M 8 66 Q 4 26 44 22 Q 76 22 80 50 L 78 70 L 10 72 Z" ${o(c.fur)}/>
<path d="M 20 34 L 64 30 L 66 56 L 18 58 Z" ${o(c.armor)} stroke-width="2.5"/>
<path d="M 22 40 L 62 37 M 22 50 L 64 48" stroke="${P.gold}" stroke-width="2.5"/>
<circle cx="74" cy="40" r="16" ${o(c.fur)}/>
<path d="M 84 44 Q 96 56 88 78 Q 84 70 82 60 Q 78 52 80 46" ${o(c.fur)} stroke-width="2.5"/>
<path d="M 78 52 Q 96 56 94 40" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M 78 52 Q 96 56 94 40" fill="none" stroke="#fffbea" stroke-width="5" stroke-linecap="round"/>
${glowEye(78, 36, '#222', 2.2)}
<path d="M 60 24 Q 64 14 72 22" ${o(c.dark)} stroke-width="2"/>`
        };
    },
    djinn(c = { skin: '#6a4caf', dark: '#3d2a6e', smoke: '#8f7acc', gold: P.gold }) {
        return {
            head: [52, 22], body: `<ellipse cx="48" cy="92" rx="16" ry="3" fill="#000" opacity="0.12"/>
<path d="M 40 60 Q 30 76 44 84 Q 58 90 50 94 Q 70 90 60 76 Q 54 68 60 60 Z" ${o(c.smoke)} opacity="0.9"/>
<path d="M 30 62 Q 28 36 52 34 Q 76 36 72 62 Z" ${o(c.skin)}/>
<path d="M 30 60 L 72 60" stroke="${c.gold}" stroke-width="4"/>
<path d="M 30 42 Q 14 46 14 60" fill="none" stroke="${c.skin}" stroke-width="8" stroke-linecap="round"/>
<path d="M 72 42 Q 88 40 90 26" fill="none" stroke="${c.skin}" stroke-width="8" stroke-linecap="round"/>
<rect x="84" y="28" width="9" height="5" rx="2" ${o(c.gold)} stroke-width="1.5"/><rect x="11" y="54" width="9" height="5" rx="2" ${o(c.gold)} stroke-width="1.5"/>
<circle cx="52" cy="24" r="14" ${o(c.skin)}/>
${glowEye(58, 22, '#ffe066', 3)}${glowEye(47, 22, '#ffe066', 2.4)}
<path d="M 38 12 Q 52 0 66 12 L 62 14 Q 52 8 42 14 Z" ${o(c.dark)} stroke-width="2"/>
<path d="M 52 2 Q 50 -4 56 -6" fill="none" stroke="${c.dark}" stroke-width="3"/>
<path d="M 46 34 Q 52 40 60 32" fill="none" stroke="${INK}" stroke-width="2"/>`
        };
    }
};

function crown(x, y, s = 1, color = P.gold) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
<path d="M -14 0 L -16 -16 L -7 -8 L 0 -20 L 7 -8 L 16 -16 L 14 0 Z" ${o(color)} stroke-width="2.5"/>
<circle cx="0" cy="-6" r="3" fill="${P.red}"/><circle cx="-9" cy="-4" r="2" fill="${P.turquoise}"/><circle cx="9" cy="-4" r="2" fill="${P.turquoise}"/>
</g>`;
}

function bossSvg(creature, extraBehind = '', extraFront = '', crownScale = 1, aura = '#ffd54f') {
    const [hx, hy] = creature.head;
    const s = 160 / 96;
    const defs = radial('aura', aura, aura, 0.45, 0);
    return svg(160, 160, `<ellipse cx="80" cy="150" rx="62" ry="10" fill="url(#aura)"/>
${extraBehind}
<g transform="scale(${s})">${creature.body}</g>
${crownScale > 0 ? crown(hx * s, (hy - 14) * s, crownScale) : ''}
${extraFront}`, defs);
}

function hydra() {
    const neck = (x1, y1, x2, y2, hx, hy) => `<path d="M ${x1} ${y1} Q ${x2} ${y2} ${hx} ${hy}" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/><path d="M ${x1} ${y1} Q ${x2} ${y2} ${hx} ${hy}" fill="none" stroke="#9bbf5a" stroke-width="10" stroke-linecap="round"/>
<ellipse cx="${hx + 6}" cy="${hy}" rx="14" ry="10" ${o('#9bbf5a')}/>${glowEye(hx + 8, hy - 3, '#ff5252', 2.6)}<path d="M ${hx + 12} ${hy + 4} L ${hx + 20} ${hy + 6}" stroke="${INK}" stroke-width="2"/>`;
    return svg(160, 160, `<ellipse cx="80" cy="150" rx="62" ry="10" fill="#ffd54f" opacity="0.25"/>
<ellipse cx="74" cy="146" rx="52" ry="8" fill="#000" opacity="0.2"/>
<path d="M 20 120 Q 0 110 10 96" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/><path d="M 20 120 Q 0 110 10 96" fill="none" stroke="#7d9e46" stroke-width="8" stroke-linecap="round"/>
<ellipse cx="70" cy="118" rx="54" ry="28" ${o('#7d9e46')}/>
<path d="M 30 126 Q 70 140 110 124" fill="none" stroke="#d8e6a0" stroke-width="6" stroke-linecap="round"/>
${[36, 60, 84, 104].map((x) => `<rect x="${x}" y="134" width="12" height="14" rx="4" ${o('#5e7a32')}/>`).join('')}
${neck(60, 100, 40, 60, 54, 34)}${neck(84, 98, 100, 60, 112, 40)}${neck(100, 106, 140, 92, 134, 70)}
${crown(66, 22, 0.9)}`);
}

function roc() {
    return svg(160, 160, `<ellipse cx="80" cy="152" rx="40" ry="6" fill="#000" opacity="0.15"/>
<path d="M 70 70 Q 10 20 4 60 Q 24 56 30 70 Q 16 76 20 92 Q 44 80 70 90 Z" ${o('#8e3b22')}/>
<path d="M 20 60 Q 40 54 60 72 M 26 80 Q 44 74 64 84" fill="none" stroke="#e0a060" stroke-width="3"/>
<path d="M 30 104 Q 10 110 8 126 Q 26 118 40 116 Z" ${o('#6e2a16')}/>
<ellipse cx="74" cy="100" rx="44" ry="24" ${o('#a84a2a')}/>
<path d="M 52 96 Q 74 110 104 98" fill="none" stroke="#e8b070" stroke-width="5" stroke-linecap="round"/>
<path d="M 60 120 L 56 140 M 56 140 l -6 4 M 56 140 l 4 6 M 84 120 L 88 140 M 88 140 l 6 4 M 88 140 l -4 6" stroke="${P.gold}" stroke-width="4" stroke-linecap="round"/>
<path d="M 104 90 Q 112 60 132 58 Q 150 60 148 78 L 120 104 Z" ${o('#a84a2a')}/>
<path d="M 144 66 L 160 76 L 142 84 Z" ${o(P.gold)} stroke-width="2.5"/>
${glowEye(136, 68, '#ffeb3b', 3)}
<path d="M 86 80 Q 110 10 156 6 Q 134 36 120 82 Z" ${o('#8e3b22')}/>
<path d="M 100 70 Q 116 34 146 16" fill="none" stroke="#e0a060" stroke-width="3"/>
${crown(132, 50, 0.8)}`);
}

export function enemyAssets() {
    const out = {};
    for (const id of ['goblin', 'orc', 'wolfRider', 'golem', 'scorpion', 'ifrit', 'troll', 'shaman', 'wraith', 'slime', 'griffin', 'mammoth', 'djinn']) {
        out[`enemies/${id}.svg`] = svg(96, 96, C[id]().body);
    }
    out['enemies/slimeling.svg'] = svg(96, 96, C.slime({ body: '#ecc95c', dark: '#b08a2a' }).body);

    const cape = (color) => `<path d="M 50 70 Q 20 110 30 146 L 90 146 Q 80 110 70 70 Z" ${o(color)}/>`;
    out['bosses/bossGoblinWarlord.svg'] = bossSvg(C.goblin({ skin: '#6aa834', dark: '#3f6a1e', cloth: '#7a1f1f' }), cape(P.red));
    out['bosses/bossOrcWarchief.svg'] = bossSvg(C.orc({ skin: '#5b7a48', dark: '#384f2c', armor: '#a0a0aa' }), '',
        `<path d="M 18 70 Q 18 50 40 46 Q 62 50 62 70 L 62 104 Q 40 124 18 104 Z" ${o('#8d6e4a')}/><circle cx="40" cy="84" r="9" ${o(P.gold)}/>`, 0);
    out['bosses/bossScorpionKing.svg'] = bossSvg(C.scorpion({ shell: '#e8b84a', dark: '#a87a20' }), '', '', 0.9);
    out['bosses/bossColossus.svg'] = bossSvg(C.golem({ stone: '#8d8f96', dark: '#5c5e66', rune: '#ff9f43', moss: '#5a8a3a' }), '',
        `<path d="M 74 14 L 82 -2 L 90 14 L 82 22 Z" transform="translate(0 12)" ${o('#ff9f43')} stroke-width="2"/>`, 0, '#ff9f43');
    out['bosses/bossIfritKing.svg'] = bossSvg(C.ifrit({ outer: '#3d7bff', mid: '#7fb0ff', core: '#ffffff' }), '', '', 1, '#7fb0ff');
    out['bosses/bossTrollBehemoth.svg'] = bossSvg(C.troll({ skin: '#64788e', dark: '#435264', cloth: '#3a2a1a' }), '',
        `${[50, 62, 74, 86, 98].map((x, i) => `<path d="M ${x} ${84 + (i % 2) * 4} l 4 -12 l 4 12 Z" ${o('#fff8e0')} stroke-width="2"/>`).join('')}`, 0.9);
    out['bosses/bossGrandShaman.svg'] = bossSvg(C.shaman({ skin: '#7fb53c', robe: '#2e1a4a', mask: '#fff', orb: '#b388ff' }), '', '', 1, '#b388ff');
    out['bosses/bossHydra.svg'] = hydra();
    out['bosses/bossRoc.svg'] = roc();
    out['bosses/bossShadowDjinn.svg'] = bossSvg(C.djinn({ skin: '#2e1f4f', dark: '#120a24', smoke: '#5b3f99', gold: '#ffd54f' }), '',
        `<path d="M 140 30 Q 156 60 136 96 L 132 92 Q 148 62 134 34 Z" ${o('#e0e0e0')} stroke-width="2"/>`, 1.2, '#b388ff');
    return out;
}
