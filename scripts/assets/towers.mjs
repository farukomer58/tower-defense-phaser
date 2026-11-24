// Tower art: 128x160 canvases; the tower's foot sits at about (64, 146).
import { P, INK, svg, o, f, finial, flag, archWindow, groundShadow, linear, radial } from './common.mjs';

const W = 128, H = 160;

function plinth(color = P.stone, shade = P.stoneDark) {
    return `${groundShadow(64, 148, 50, 10)}
<path d="M 22 132 L 106 132 L 112 148 L 16 148 Z" ${o(color)}/>
<path d="M 64 132 L 106 132 L 112 148 L 64 148 Z" ${f(shade)} opacity="0.55"/>`;
}

function stoneLines(x1, x2, ys) {
    return ys.map((y) => `<line x1="${x1 + 2}" y1="${y}" x2="${x2 - 2}" y2="${y}" stroke="${INK}" stroke-width="1.2" opacity="0.25"/>`).join('');
}

function stars(tier) {
    // Small gold chevrons on the plinth that show the visual tier.
    let s = '';
    for (let i = 0; i < tier; i++) {
        const x = 64 + (i - (tier - 1) / 2) * 14;
        s += `<path d="M ${x - 5} 139 L ${x} 135 L ${x + 5} 139 L ${x + 5} 143 L ${x} 139 L ${x - 5} 143 Z" ${o(P.gold)} stroke-width="1.4"/>`;
    }
    return s;
}

// ---------------------------------------------------------------- Archer (Galata-style round tower)
function archer(tier) {
    const roof = [P.slate, P.red, P.turquoise][tier - 1];
    const roofDark = [P.slateDark, P.redDark, P.turquoiseDark][tier - 1];
    const top = tier === 3 ? 4 : 12;
    const defs = linear('cyl', P.cream, P.cream) + `<linearGradient id="cylS" x1="0" x2="1"><stop offset="0" stop-color="${P.cream}"/><stop offset="0.6" stop-color="${P.cream}"/><stop offset="1" stop-color="${P.creamShade}"/></linearGradient>`;
    return svg(W, H, `${plinth()}
<rect x="38" y="62" width="52" height="72" rx="4" ${o('url(#cylS)')}/>
${stoneLines(38, 90, [78, 94, 110, 124])}
${archWindow(57, 82, 14, 20)}
${archWindow(44, 104, 9, 14)}${archWindow(75, 104, 9, 14)}
<rect x="30" y="54" width="68" height="10" rx="3" ${o(tier === 3 ? P.gold : P.wood)}/>
${[34, 46, 58, 70, 82, 92].map((x) => `<rect x="${x}" y="46" width="5" height="9" ${o(P.woodDark)} stroke-width="1.5"/>`).join('')}
<rect x="32" y="44" width="64" height="4" rx="2" ${o(P.woodDark)} stroke-width="2"/>
<path d="M 30 46 L 64 ${top} L 98 46 Z" ${o(roof)}/>
<path d="M 64 ${top} L 98 46 L 70 46 Z" ${f(roofDark)} opacity="0.6"/>
${tier >= 2 ? `<path d="M 30 46 L 98 46" stroke="${P.gold}" stroke-width="3"/>` : ''}
${finial(64, top, tier === 3 ? P.gold : '#d8d8d8', tier === 3 ? 1.2 : 1)}
${tier >= 2 ? flag(94, 46, P.red, 28) : ''}
${tier === 3 ? flag(34, 46, P.turquoise, 24, 18) : ''}
<path d="M 48 54 l 4 -8 l 4 8" ${o('#5a3b22')} stroke-width="1.5"/>
${stars(tier)}`, defs);
}

// ---------------------------------------------------------------- Cannon (Rumeli-style bastion); barrel is separate
function cannon(tier) {
    const wall = tier === 3 ? '#d9c79e' : P.stone;
    const merlon = (x) => `<path d="M ${x} 72 L ${x} 62 L ${x + 12} 62 L ${x + 12} 72 Z" ${o(wall)} stroke-width="2.5"/>`;
    return svg(W, H, `${plinth()}
<path d="M 18 76 L 110 76 L 106 134 L 22 134 Z" ${o(wall)}/>
<path d="M 64 76 L 110 76 L 106 134 L 64 134 Z" ${f(P.stoneDark)} opacity="0.45"/>
${stoneLines(20, 108, [90, 104, 118])}
${[20, 38, 58, 78, 96].map(merlon).join('')}
<rect x="16" y="72" width="96" height="8" rx="2" ${o(tier >= 2 ? P.redDark : P.stoneDark)} stroke-width="2.5"/>
${archWindow(52, 104, 24, 30, '#3a2a20')}
<circle cx="34" cy="98" r="5" ${o('#3a2a20')} stroke-width="2"/><circle cx="94" cy="98" r="5" ${o('#3a2a20')} stroke-width="2"/>
${tier >= 2 ? flag(24, 64, P.red, 30) : ''}
${tier === 3 ? `${flag(104, 64, P.red, 30)}<rect x="16" y="72" width="96" height="3" fill="${P.gold}"/>` : ''}
<ellipse cx="64" cy="70" rx="22" ry="7" ${o('#6b5a45')} stroke-width="2.5"/>
${stars(tier)}`);
}

function cannonBarrel() {
    // Pointing right; pivot at the left (x=14, y=16).
    return svg(72, 32, `
<rect x="8" y="9" width="54" height="14" rx="5" ${o(P.bronze)}/>
<rect x="56" y="6" width="12" height="20" rx="3" ${o(P.bronzeDark)}/>
<rect x="22" y="9" width="4" height="14" fill="${P.goldDark}"/>
<rect x="40" y="9" width="4" height="14" fill="${P.goldDark}"/>
<path d="M 10 12 L 60 12" stroke="#f0c27a" stroke-width="3" opacity="0.7" stroke-linecap="round"/>
<circle cx="14" cy="16" r="9" ${o(P.woodDark)}/>
<circle cx="14" cy="16" r="3" fill="${P.gold}"/>`);
}

// ---------------------------------------------------------------- Dervish sanctum (domed türbe)
function dervish(tier) {
    const dome = [P.turquoise, P.cobalt, P.gold][tier - 1];
    const domeDark = [P.turquoiseDark, P.cobaltDark, P.goldDark][tier - 1];
    const defs = radial('glow', '#e6d2ff', '#9b6cff', 1, 0) + radial('orb', '#ffffff', '#a87bff', 1, 1);
    return svg(W, H, `${plinth(P.marbleShade, '#b8ae9c')}
<path d="M 30 82 L 98 82 L 98 134 L 30 134 Z" ${o(P.marble)}/>
<path d="M 64 82 L 98 82 L 98 134 L 64 134 Z" ${f(P.marbleShade)} opacity="0.7"/>
<line x1="47" y1="82" x2="47" y2="134" stroke="${INK}" stroke-width="1.5" opacity="0.4"/>
<line x1="81" y1="82" x2="81" y2="134" stroke="${INK}" stroke-width="1.5" opacity="0.4"/>
${archWindow(35, 98, 9, 24, P.turquoiseDark)}${archWindow(57, 96, 14, 30, '#3b2a3a')}${archWindow(85, 98, 9, 24, P.turquoiseDark)}
<rect x="26" y="76" width="76" height="8" rx="2" ${o(tier >= 2 ? P.gold : P.marbleShade)} stroke-width="2.5"/>
<rect x="38" y="66" width="52" height="12" ${o(P.marble)} stroke-width="2.5"/>
<path d="M 36 68 Q 36 30 64 26 Q 92 30 92 68 Z" ${o(dome)}/>
<path d="M 64 26 Q 92 30 92 68 L 72 68 Q 76 40 64 26 Z" ${f(domeDark)} opacity="0.55"/>
<path d="M 46 52 Q 50 38 60 33" stroke="#fff" stroke-width="3" opacity="0.45" fill="none" stroke-linecap="round"/>
${finial(64, 27, P.gold, 1)}
${tier >= 2 ? `<rect x="20" y="62" width="8" height="72" ${o(P.marble)} stroke-width="2"/><path d="M 18 62 L 24 46 L 30 62 Z" ${o(dome)} stroke-width="2"/>` : ''}
${tier === 3 ? `<rect x="100" y="62" width="8" height="72" ${o(P.marble)} stroke-width="2"/><path d="M 98 62 L 104 46 L 110 62 Z" ${o(dome)} stroke-width="2"/>` : ''}
<circle cx="64" cy="${tier === 3 ? 6 : 10}" r="${8 + tier * 2}" fill="url(#glow)"/>
<circle cx="64" cy="${tier === 3 ? 6 : 10}" r="${3 + tier}" fill="url(#orb)"/>
${stars(tier)}`, defs);
}

// ---------------------------------------------------------------- Frost fountain (çeşme kiosk)
function frost(tier) {
    const crystal = (x, y, s) => `<path d="M ${x} ${y - 16 * s} L ${x + 6 * s} ${y} L ${x} ${y + 6 * s} L ${x - 6 * s} ${y} Z" ${o(P.ice)} stroke-width="2"/><path d="M ${x} ${y - 16 * s} L ${x + 6 * s} ${y} L ${x} ${y + 6 * s} Z" fill="${P.iceDark}" opacity="0.5"/>`;
    return svg(W, H, `${plinth(P.marbleShade, '#b8ae9c')}
<path d="M 26 124 L 102 124 L 98 138 L 30 138 Z" ${o('#9fd8ea')}/>
<ellipse cx="64" cy="125" rx="36" ry="5" fill="${P.iceDark}" opacity="0.8"/>
<rect x="34" y="70" width="60" height="56" ${o(P.marble)}/>
<rect x="64" y="70" width="30" height="56" ${f(P.marbleShade)} opacity="0.7"/>
${archWindow(46, 82, 36, 40, '#7cc8e0')}
<path d="M 54 98 Q 64 90 74 98 L 74 122 L 54 122 Z" fill="${P.iceDark}" opacity="0.6"/>
<rect x="60" y="96" width="8" height="6" rx="2" ${o(P.gold)} stroke-width="1.5"/>
<path d="M 64 102 L 64 122" stroke="${P.ice}" stroke-width="4" stroke-linecap="round"/>
<rect x="28" y="62" width="72" height="10" rx="3" ${o(tier >= 2 ? P.gold : P.marbleShade)} stroke-width="2.5"/>
<path d="M 30 62 Q 64 34 98 62 Z" ${o(tier === 3 ? P.cobalt : P.slate)}/>
${crystal(64, 40, 1 + tier * 0.25)}
${tier >= 2 ? crystal(44, 52, 0.8) + crystal(84, 52, 0.8) : ''}
${tier === 3 ? crystal(30, 70, 0.6) + crystal(98, 70, 0.6) : ''}
${stars(tier)}`);
}

// ---------------------------------------------------------------- Janissary post (watchtower with musketeer)
function janissary(tier) {
    const roof = tier === 3 ? P.gold : P.red;
    return svg(W, H, `${plinth()}
<rect x="40" y="92" width="48" height="42" ${o(P.stone)}/>
<rect x="64" y="92" width="24" height="42" ${f(P.stoneDark)} opacity="0.45"/>
${stoneLines(40, 88, [104, 118])}
${archWindow(56, 108, 16, 26, '#3a2a20')}
<path d="M 42 92 L 48 58 M 86 92 L 80 58 M 44 84 L 84 66 M 84 84 L 44 66" stroke="${P.woodDark}" stroke-width="5" stroke-linecap="round"/>
<rect x="30" y="52" width="68" height="10" rx="2" ${o(P.wood)}/>
<rect x="32" y="40" width="4" height="14" fill="${P.woodDark}"/><rect x="92" y="40" width="4" height="14" fill="${P.woodDark}"/>
<!-- Janissary with tall white börk hat -->
<rect x="56" y="34" width="16" height="20" rx="4" ${o(tier >= 2 ? '#1f5fa8' : P.red)} stroke-width="2.5"/>
<circle cx="64" cy="30" r="7" ${o('#e9c39b')} stroke-width="2.5"/>
<path d="M 57 27 L 59 8 Q 66 4 71 10 L 76 30 Q 68 22 57 27 Z" ${o('#f7f4ea')} stroke-width="2.5"/>
<rect x="58" y="24" width="12" height="4" ${o(P.gold)} stroke-width="1.5"/>
<line x1="66" y1="40" x2="100" y2="30" stroke="${P.woodDark}" stroke-width="5" stroke-linecap="round"/>
<line x1="80" y1="36" x2="104" y2="29" stroke="#555" stroke-width="3" stroke-linecap="round"/>
<path d="M 26 54 L 64 ${tier === 3 ? 40 : 44} L 102 54" fill="none" stroke="${roof}" stroke-width="6" stroke-linecap="round"/>
${tier >= 2 ? flag(30, 52, P.red, 26) : ''}
${tier === 3 ? flag(98, 52, '#1f5fa8', 26) : ''}
${stars(tier)}`);
}

// ---------------------------------------------------------------- Naphtha kiln
function naphtha(tier) {
    const defs = radial('heat', P.fireCore, P.fire, 1, 0.2);
    const flame = (x, y, s) => `<path d="M ${x} ${y} Q ${x - 10 * s} ${y - 14 * s} ${x} ${y - 30 * s} Q ${x + 4 * s} ${y - 18 * s} ${x + 9 * s} ${y - 22 * s} Q ${x + 12 * s} ${y - 8 * s} ${x} ${y} Z" ${o(P.fire)} stroke-width="2"/><path d="M ${x} ${y - 2} Q ${x - 4 * s} ${y - 10 * s} ${x + 1} ${y - 18 * s} Q ${x + 6 * s} ${y - 8 * s} ${x} ${y - 2} Z" fill="${P.fireCore}"/>`;
    const bricks = [];
    for (let row = 0; row < 4; row++) for (let i = 0; i < 5; i++) {
        bricks.push(`<rect x="${30 + i * 14 + (row % 2) * 7}" y="${100 + row * 9}" width="12" height="7" fill="${P.brickDark}" opacity="0.35"/>`);
    }
    return svg(W, H, `${plinth()}
<path d="M 24 134 L 24 96 Q 24 58 64 54 Q 104 58 104 96 L 104 134 Z" ${o(P.brick)}/>
<path d="M 64 54 Q 104 58 104 96 L 104 134 L 70 134 L 70 54 Z" ${f(P.brickDark)} opacity="0.4"/>
${bricks.join('')}
<path d="M 46 134 L 46 108 Q 64 92 82 108 L 82 134 Z" ${o('#3a1a10')}/>
<path d="M 50 134 L 50 112 Q 64 100 78 112 L 78 134 Z" fill="url(#heat)"/>
${tier >= 2 ? `<rect x="22" y="88" width="84" height="6" ${o(P.bronze)} stroke-width="2"/>` : ''}
<rect x="76" y="30" width="16" height="32" ${o(P.brickDark)}/>
<rect x="73" y="26" width="22" height="7" ${o(tier === 3 ? P.gold : P.stoneDark)} stroke-width="2"/>
${flame(84, 26, 0.8 + tier * 0.15)}
${tier >= 2 ? flame(40, 66, 0.6) : ''}
${tier === 3 ? flame(56, 58, 0.7) : ''}
<ellipse cx="38" cy="134" rx="12" ry="6" ${o('#333')} stroke-width="2"/>
${stars(tier)}`, defs);
}

// ---------------------------------------------------------------- Mehter pavilion (tent with war drum)
function mehter(tier) {
    const stripes = [];
    for (let i = 0; i < 6; i++) {
        const x0 = 22 + i * 14;
        stripes.push(`<path d="M 64 30 L ${x0} 112 L ${x0 + 14} 112 Z" fill="${i % 2 ? '#f7efd8' : P.red}"/>`);
    }
    return svg(W, H, `${groundShadow(64, 148, 52, 10)}
<path d="M 64 30 L 18 112 L 110 112 Z" ${o(P.red)}/>
${stripes.join('')}
<path d="M 64 30 L 18 112 L 110 112 Z" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
<path d="M 18 112 Q 30 120 42 112 Q 54 120 64 112 Q 76 120 88 112 Q 100 120 110 112" ${o(tier >= 2 ? P.gold : '#e8d9b5')} stroke-width="2.5"/>
<path d="M 52 112 L 64 84 L 76 112 Z" fill="#4a1d18" stroke="${INK}" stroke-width="2"/>
<!-- War drum (kös) -->
<ellipse cx="64" cy="132" rx="26" ry="9" ${o(P.bronze)}/>
<path d="M 38 132 Q 40 148 64 150 Q 88 148 90 132" ${o(P.bronzeDark)}/>
<ellipse cx="64" cy="130" rx="23" ry="7" ${o('#f2e6c8')} stroke-width="2"/>
<line x1="44" y1="114" x2="56" y2="128" stroke="${P.woodDark}" stroke-width="4" stroke-linecap="round"/>
<line x1="84" y1="114" x2="72" y2="128" stroke="${P.woodDark}" stroke-width="4" stroke-linecap="round"/>
${finial(64, 30, P.gold, tier === 3 ? 1.3 : 1)}
<!-- Horse-tail standards (tuğ) -->
<line x1="14" y1="146" x2="14" y2="${tier >= 2 ? 50 : 70}" stroke="${INK}" stroke-width="3"/>
<path d="M 14 ${tier >= 2 ? 54 : 74} q -7 12 -2 26 q 3 -8 4 0 q 4 -14 -2 -26 Z" ${o('#f2e6c8')} stroke-width="2"/>
<circle cx="14" cy="${tier >= 2 ? 50 : 70}" r="4" ${o(P.gold)} stroke-width="2"/>
${tier === 3 ? `<line x1="114" y1="146" x2="114" y2="50" stroke="${INK}" stroke-width="3"/><path d="M 114 54 q -7 12 -2 26 q 3 -8 4 0 q 4 -14 -2 -26 Z" ${o('#f2e6c8')} stroke-width="2"/><circle cx="114" cy="50" r="4" ${o(P.gold)} stroke-width="2"/>` : ''}
${stars(tier)}`);
}

const BUILDERS = { archer, cannon, dervish, frost, janissary, naphtha, mehter };

export function towerAssets() {
    const out = {};
    for (const [id, fn] of Object.entries(BUILDERS)) {
        for (const tier of [1, 2, 3]) out[`towers/${id}_${tier}.svg`] = fn(tier);
    }
    out['towers/cannon_barrel.svg'] = cannonBarrel();
    return out;
}
