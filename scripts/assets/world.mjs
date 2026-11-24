// World art: ground tiles, the castle, decorations, projectiles and UI icons.
import { P, INK, svg, o, f, finial, flag, archWindow, groundShadow, radial, rng } from './common.mjs';

function groundTile(seed, base, blades, patches) {
    const r = rng(seed);
    let s = `<rect width="128" height="128" fill="${base}"/>`;
    for (let i = 0; i < 6; i++) {
        const x = 16 + r() * 96, y = 16 + r() * 96;
        s += `<ellipse cx="${x}" cy="${y}" rx="${10 + r() * 14}" ry="${6 + r() * 8}" fill="${patches[i % patches.length]}" opacity="0.35"/>`;
    }
    for (let i = 0; i < 26; i++) {
        const x = 6 + r() * 116, y = 8 + r() * 112;
        const c = blades[i % blades.length];
        s += `<path d="M ${x} ${y} l -2 -5 M ${x + 2} ${y} l 1 -6 M ${x + 4} ${y} l 3 -4" stroke="${c}" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>`;
    }
    return svg(128, 128, s);
}

function castle() {
    const merlons = (x0, x1, y, color) => {
        let s = '';
        for (let x = x0; x < x1 - 4; x += 16) s += `<rect x="${x}" y="${y - 10}" width="10" height="11" ${o(color)} stroke-width="2.5"/>`;
        return s;
    };
    const tower = (cx, top, roof) => `
<rect x="${cx - 26}" y="${top + 44}" width="52" height="${200 - top}" ${o(P.cream)}/>
<rect x="${cx}" y="${top + 44}" width="26" height="${200 - top}" ${f(P.creamShade)} opacity="0.6"/>
${[0, 1, 2, 3].map((k) => `<line x1="${cx - 24}" y1="${top + 70 + k * 30}" x2="${cx + 24}" y2="${top + 70 + k * 30}" stroke="${INK}" stroke-width="1.2" opacity="0.25"/>`).join('')}
${archWindow(cx - 7, top + 66, 14, 22)}
<rect x="${cx - 30}" y="${top + 38}" width="60" height="9" rx="2" ${o(P.wood)}/>
<path d="M ${cx - 32} ${top + 40} L ${cx} ${top} L ${cx + 32} ${top + 40} Z" ${o(roof)}/>
<path d="M ${cx} ${top} L ${cx + 32} ${top + 40} L ${cx + 6} ${top + 40} Z" ${f(P.slateDark)} opacity="0.6"/>
${finial(cx, top + 1, P.gold, 1.1)}`;
    return svg(256, 288, `${groundShadow(128, 268, 120, 16)}
<!-- curtain wall -->
<rect x="16" y="150" width="224" height="116" ${o(P.stone)}/>
<rect x="128" y="150" width="112" height="116" ${f(P.stoneDark)} opacity="0.35"/>
${merlons(18, 238, 150, P.stone)}
${[178, 206, 234].map((y) => `<line x1="18" y1="${y}" x2="238" y2="${y}" stroke="${INK}" stroke-width="1.2" opacity="0.2"/>`).join('')}
<!-- palace dome behind -->
<rect x="84" y="96" width="88" height="56" ${o(P.marble)}/>
${archWindow(96, 116, 12, 22, P.turquoiseDark)}${archWindow(122, 112, 12, 26, P.turquoiseDark)}${archWindow(148, 116, 12, 22, P.turquoiseDark)}
<path d="M 88 98 Q 90 46 128 42 Q 166 46 168 98 Z" ${o(P.slate)}/>
<path d="M 128 42 Q 166 46 168 98 L 140 98 Q 144 60 128 42 Z" ${f(P.slateDark)} opacity="0.5"/>
<path d="M 102 80 Q 106 60 120 52" stroke="#fff" stroke-width="4" opacity="0.35" fill="none" stroke-linecap="round"/>
${finial(128, 43, P.gold, 1.4)}
<!-- gate towers (twin conical towers, like an imperial gate) -->
${tower(64, 40, P.slate)}
${tower(192, 40, P.slate)}
<!-- gate -->
<rect x="96" y="168" width="64" height="98" ${o(P.cream)}/>
<path d="M 104 266 L 104 214 Q 104 186 128 180 Q 152 186 152 214 L 152 266 Z" ${o('#4a2f1e')}/>
<path d="M 128 184 L 128 266" stroke="${INK}" stroke-width="2" opacity="0.5"/>
${[112, 120, 136, 144].map((x) => `<circle cx="${x}" cy="236" r="2" fill="${P.gold}"/>`).join('')}
<path d="M 100 172 L 156 172" stroke="${P.gold}" stroke-width="4"/>
<rect x="110" y="160" width="36" height="10" rx="2" ${o(P.turquoise)} stroke-width="2"/>
${flag(64, 40, P.red, 34, 26).replace(`x1="64" y1="40"`, `x1="64" y1="24"`)}
${flag(100, 150, P.red, 30)}${flag(156, 150, P.red, 30)}
`);
}

const deco = {
    cypress: () => svg(64, 128, `${groundShadow(32, 120, 18, 5)}
<rect x="29" y="104" width="6" height="16" ${o(P.woodDark)} stroke-width="2"/>
<path d="M 32 6 Q 50 40 46 80 Q 44 104 32 108 Q 20 104 18 80 Q 14 40 32 6 Z" ${o('#2f6b3a')}/>
<path d="M 32 6 Q 50 40 46 80 Q 44 104 32 108 Z" fill="#1f4f2a" opacity="0.45"/>
<path d="M 26 40 Q 30 30 32 20 M 24 66 Q 28 56 30 46 M 26 90 Q 30 80 32 70" fill="none" stroke="#4f9a5a" stroke-width="2.5" stroke-linecap="round"/>`),
    palm: () => svg(72, 112, `${groundShadow(36, 106, 18, 5)}
<path d="M 34 106 Q 30 70 38 34" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
<path d="M 34 106 Q 30 70 38 34" fill="none" stroke="#a87a48" stroke-width="5" stroke-linecap="round"/>
${[[-30, 10], [-20, -8], [0, -16], [22, -6], [30, 12]].map(([dx, dy]) => `<path d="M 38 34 Q ${38 + dx * 0.6} ${34 + dy - 10} ${38 + dx} ${34 + dy + 8}" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M 38 34 Q ${38 + dx * 0.6} ${34 + dy - 10} ${38 + dx} ${34 + dy + 8}" fill="none" stroke="#4c9a3c" stroke-width="5" stroke-linecap="round"/>`).join('')}
<circle cx="36" cy="38" r="3" fill="#6b4121"/><circle cx="41" cy="38" r="3" fill="#6b4121"/>`),
    rock: () => svg(64, 56, `${groundShadow(32, 50, 26, 5)}
<path d="M 8 48 L 12 26 L 28 12 L 46 16 L 58 32 L 56 48 Z" ${o('#a7a39a')}/>
<path d="M 28 12 L 46 16 L 58 32 L 56 48 L 34 48 Z" fill="#7d7a72" opacity="0.5"/>
<path d="M 16 30 L 26 22" stroke="#d6d2c8" stroke-width="3" stroke-linecap="round"/>
<path d="M 40 44 Q 44 38 50 40" ${o('#6a9a4a')} stroke-width="1.5"/>`),
    fountain: () => svg(80, 72, `${groundShadow(40, 64, 34, 6)}
<ellipse cx="40" cy="54" rx="34" ry="12" ${o(P.marble)}/>
<ellipse cx="40" cy="52" rx="28" ry="8" fill="#5ec8e8"/>
<path d="M 18 52 Q 40 60 62 52" stroke="#bff0ff" stroke-width="2" fill="none"/>
<rect x="35" y="22" width="10" height="30" ${o(P.marble)} stroke-width="2.5"/>
<ellipse cx="40" cy="22" rx="14" ry="5" ${o(P.marble)} stroke-width="2.5"/>
<path d="M 40 16 Q 30 8 26 22 M 40 16 Q 50 8 54 22" fill="none" stroke="#7fd8f2" stroke-width="3" stroke-linecap="round"/>
<circle cx="40" cy="14" r="3" ${o(P.gold)} stroke-width="1.5"/>`),
    tent: () => svg(80, 72, `${groundShadow(40, 66, 34, 6)}
<path d="M 40 6 L 6 64 L 74 64 Z" ${o('#f2e6c8')}/>
<path d="M 40 6 L 74 64 L 50 64 Z" fill="#d8c8a0"/>
<path d="M 40 6 L 22 64 M 40 6 L 58 64" stroke="${P.red}" stroke-width="4"/>
<path d="M 32 64 L 40 40 L 48 64 Z" fill="#5a2f1e" stroke="${INK}" stroke-width="2"/>
<path d="M 40 6 L 40 0" stroke="${INK}" stroke-width="3"/><circle cx="40" cy="0" r="3" fill="${P.gold}"/>`),
    well: () => svg(64, 64, `${groundShadow(32, 58, 26, 5)}
<ellipse cx="32" cy="48" rx="22" ry="9" ${o(P.stone)}/>
<path d="M 10 48 L 10 38 Q 32 30 54 38 L 54 48" ${o(P.stone)}/>
<ellipse cx="32" cy="38" rx="22" ry="7" ${o(P.stoneDark)}/>
<ellipse cx="32" cy="38" rx="16" ry="4" fill="#284b5a"/>
<path d="M 12 38 L 12 12 M 52 38 L 52 12" stroke="${P.woodDark}" stroke-width="4"/>
<path d="M 6 14 L 32 2 L 58 14 Z" ${o(P.red)} stroke-width="2.5"/>`),
    tulips: (c1 = '#e53935', c2 = '#ff7043') => svg(32, 32, `
${[[8, 26, c1], [16, 24, c2], [24, 27, c1]].map(([x, y, c]) => `<path d="M ${x} ${y + 4} L ${x} ${y - 8}" stroke="#3f7d2e" stroke-width="2"/><path d="M ${x - 4} ${y - 14} L ${x - 4} ${y - 8} Q ${x} ${y - 4} ${x + 4} ${y - 8} L ${x + 4} ${y - 14} L ${x + 2} ${y - 11} L ${x} ${y - 15} L ${x - 2} ${y - 11} Z" fill="${c}" stroke="${INK}" stroke-width="1"/>`).join('')}`),
    grass: (c = '#3f8a3a') => svg(32, 32, `<path d="M 6 28 Q 8 16 4 8 M 12 28 Q 12 14 16 6 M 18 28 Q 20 18 26 12 M 24 28 Q 24 22 28 18" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>`),
    flowers: () => svg(32, 32, `${[[8, 20, '#fff'], [20, 14, '#ffeb3b'], [24, 24, '#fff'], [12, 8, '#f8bbd0']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${c}" stroke="${INK}" stroke-width="0.8"/><circle cx="${x}" cy="${y}" r="1.2" fill="#f9a825"/>`).join('')}`),
    pebbles: () => svg(32, 32, `<ellipse cx="9" cy="20" rx="5" ry="3.5" fill="#b8b0a0" stroke="${INK}" stroke-width="1"/><ellipse cx="21" cy="24" rx="4" ry="3" fill="#a09888" stroke="${INK}" stroke-width="1"/><ellipse cx="22" cy="12" rx="3" ry="2.2" fill="#c8c0b0" stroke="${INK}" stroke-width="1"/>`)
};

const proj = {
    arrow: () => svg(36, 10, `<line x1="2" y1="5" x2="28" y2="5" stroke="#6b4121" stroke-width="2.5"/><path d="M 26 1 L 35 5 L 26 9 Z" fill="#cfd8dc" stroke="${INK}" stroke-width="1"/><path d="M 2 1 L 8 5 L 2 9" fill="none" stroke="${P.red}" stroke-width="2"/>`),
    cannonball: () => svg(20, 20, `<circle cx="10" cy="10" r="8" fill="#37383d" stroke="${INK}" stroke-width="2"/><circle cx="7" cy="7" r="2.5" fill="#8a8c94"/>`),
    bomblet: () => svg(14, 14, `<circle cx="7" cy="7" r="5" fill="#4a3a2a" stroke="${INK}" stroke-width="1.5"/><circle cx="5" cy="5" r="1.5" fill="#ffb74d"/>`),
    orb: () => svg(28, 28, `<circle cx="14" cy="14" r="13" fill="url(#g)"/><circle cx="14" cy="14" r="6" fill="#efe3ff" stroke="#7b5cd6" stroke-width="2"/>`,
        radial('g', '#ffffff', '#a87bff', 1, 0)),
    ice: () => svg(28, 14, `<path d="M 2 7 L 10 2 L 27 7 L 10 12 Z" fill="${P.ice}" stroke="#3a8fb7" stroke-width="1.5"/><path d="M 10 2 L 27 7 L 12 7 Z" fill="#ffffff" opacity="0.6"/>`),
    bullet: () => svg(16, 6, `<rect x="0" y="1" width="16" height="4" rx="2" fill="#ffe082" stroke="${INK}" stroke-width="1"/>`),
    firepot: () => svg(22, 22, `<circle cx="11" cy="13" r="7" fill="#8d4a22" stroke="${INK}" stroke-width="2"/><rect x="8" y="3" width="6" height="5" fill="#6b3416" stroke="${INK}" stroke-width="1.5"/><path d="M 11 3 Q 7 -1 11 -3 Q 15 0 11 3 Z" fill="${P.fire}" transform="translate(0 2)"/>`)
};

const ui = {
    coin: () => svg(64, 64, `<circle cx="32" cy="32" r="26" ${o(P.gold)}/><circle cx="32" cy="32" r="19" fill="none" stroke="${P.goldDark}" stroke-width="3"/><path d="M 26 22 A 11 11 0 1 0 26 42 A 8.5 8.5 0 1 1 26 22 Z" fill="${P.goldDark}"/><circle cx="22" cy="20" r="4" fill="#fff6c8" opacity="0.8"/>`),
    heart: () => svg(64, 64, `<path d="M 32 56 C 6 38 4 20 16 12 C 24 7 30 12 32 18 C 34 12 40 7 48 12 C 60 20 58 38 32 56 Z" ${o(P.red)}/><path d="M 16 20 Q 18 14 24 14" stroke="#ffcdd2" stroke-width="4" fill="none" stroke-linecap="round"/>`),
    swords: () => svg(64, 64, `<path d="M 10 54 L 46 14 L 54 10 L 50 18 L 14 58 Z" ${o('#cfd8dc')} stroke-width="2.5"/><path d="M 54 54 L 18 14 L 10 10 L 14 18 L 50 58 Z" ${o('#cfd8dc')} stroke-width="2.5"/><rect x="8" y="46" width="14" height="5" transform="rotate(45 15 48)" ${o(P.gold)} stroke-width="2"/><rect x="42" y="46" width="14" height="5" transform="rotate(-45 49 48)" ${o(P.gold)} stroke-width="2"/>`),
    gate: () => svg(64, 64, `<rect x="8" y="18" width="48" height="40" ${o(P.stone)}/>${[8, 20, 32, 44].map((x) => `<rect x="${x}" y="10" width="8" height="10" ${o(P.stone)} stroke-width="2"/>`).join('')}<path d="M 22 58 L 22 40 Q 32 28 42 40 L 42 58 Z" ${o('#4a2f1e')} stroke-width="2.5"/><path d="M 40 14 L 52 50" stroke="${P.red}" stroke-width="5" stroke-linecap="round"/>`),
    flag: () => svg(64, 64, `<line x1="14" y1="58" x2="14" y2="6" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M 14 8 L 56 16 L 14 32 Z" ${o(P.red)}/><path d="M 26 15 A 6 6 0 1 0 26 25 A 4.6 4.6 0 1 1 26 15 Z" fill="#fff"/>`),
    emblem: () => svg(128, 128, `<path d="M 64 6 L 112 26 L 106 82 Q 92 110 64 122 Q 36 110 22 82 L 16 26 Z" ${o(P.red)} stroke-width="4"/><path d="M 64 16 L 102 32 L 98 78 Q 86 102 64 112 Q 42 102 30 78 L 26 32 Z" fill="none" stroke="${P.gold}" stroke-width="3"/><path d="M 56 40 A 22 22 0 1 0 56 84 A 17 17 0 1 1 56 40 Z" fill="${P.gold}" stroke="${INK}" stroke-width="2"/><path d="M 78 52 l 3 7 l 7 1 l -5 5 l 2 7 l -7 -4 l -6 4 l 1 -7 l -5 -5 l 7 -1 Z" fill="${P.gold}" stroke="${INK}" stroke-width="1.5"/>`)
};

export function worldAssets() {
    const out = {
        'world/ground_meadow.svg': groundTile(11, '#78b04a', ['#5a9236', '#8cc45a', '#4f8a2e'], ['#8cc45a', '#679f3d']),
        'world/ground_steppe.svg': groundTile(23, '#cdb465', ['#a8903e', '#e0c878', '#9c8438'], ['#e0c878', '#b89f50']),
        'world/ground_valley.svg': groundTile(37, '#b7c07a', ['#8c9a52', '#d0d090', '#7f8c46'], ['#d8c8a0', '#a4ae66']),
        'world/castle.svg': castle()
    };
    out['world/deco_cypress.svg'] = deco.cypress();
    out['world/deco_palm.svg'] = deco.palm();
    out['world/deco_rock.svg'] = deco.rock();
    out['world/deco_fountain.svg'] = deco.fountain();
    out['world/deco_tent.svg'] = deco.tent();
    out['world/deco_well.svg'] = deco.well();
    out['world/deco_tulips.svg'] = deco.tulips();
    out['world/deco_tulips_blue.svg'] = deco.tulips('#3f51b5', '#7e57c2');
    out['world/deco_grass.svg'] = deco.grass();
    out['world/deco_grass_dry.svg'] = deco.grass('#9c8438');
    out['world/deco_flowers.svg'] = deco.flowers();
    out['world/deco_pebbles.svg'] = deco.pebbles();
    for (const [k, fn] of Object.entries(proj)) out[`projectiles/${k}.svg`] = fn();
    for (const [k, fn] of Object.entries(ui)) out[`ui/${k}.svg`] = fn();
    return out;
}
