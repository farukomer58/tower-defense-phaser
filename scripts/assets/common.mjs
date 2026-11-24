// Shared helpers and palette for the procedural SVG asset generator.

export const INK = '#2e1f14';
export const SW = 3; // outline stroke width

export const P = {
    cream: '#efe2c0', creamShade: '#d4c196', stone: '#c9b48a', stoneDark: '#a38c62',
    marble: '#f4efe6', marbleShade: '#d9d0c0',
    red: '#c0392b', redDark: '#8e2a20', gold: '#e2b43c', goldDark: '#a8801f',
    turquoise: '#2bb5a8', turquoiseDark: '#1d7f76', cobalt: '#2f5fa8', cobaltDark: '#1f3f73',
    slate: '#4a6a8f', slateDark: '#33506f', bronze: '#b8793a', bronzeDark: '#7d4f22',
    wood: '#9a6233', woodDark: '#6b4121', brick: '#a8533a', brickDark: '#7a3624',
    ice: '#bfefff', iceDark: '#6cc6e6', fire: '#ff9a2e', fireCore: '#ffe066'
};

/**
 * Removes duplicate attributes inside each tag (keeping the LAST value), so helpers
 * like o() can be overridden by appending e.g. stroke-width="2". Duplicate attributes are invalid XML.
 */
function dedupeAttributes(markup) {
    return markup.replace(/<([a-zA-Z][\w:-]*)(\s[^<>]*?)?(\/?)>/g, (_m, tag, attrs = '', selfClose) => {
        const found = new Map();
        for (const a of attrs.matchAll(/([\w:-]+)="([^"]*)"/g)) {
            found.delete(a[1]);
            found.set(a[1], a[2]);
        }
        const out = [...found].map(([k, v]) => `${k}="${v}"`).join(' ');
        return `<${tag}${out ? ' ' + out : ''}${selfClose}>`;
    });
}

export function svg(w, h, body, defs = '') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
${defs ? `<defs>${dedupeAttributes(defs)}</defs>` : ''}
${dedupeAttributes(body.replace(/<!--[\s\S]*?-->/g, ''))}
</svg>
`;
}

/** Shorthand for an outlined shape attribute string. */
export const o = (fill, extra = '') => `fill="${fill}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${extra}`;
export const f = (fill, extra = '') => `fill="${fill}" ${extra}`;

export function linear(id, c1, c2, vertical = true) {
    return `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
}

export function radial(id, c1, c2, o1 = 1, o2 = 0) {
    return `<radialGradient id="${id}"><stop offset="0" stop-color="${c1}" stop-opacity="${o1}"/><stop offset="1" stop-color="${c2}" stop-opacity="${o2}"/></radialGradient>`;
}

/** Small crescent-and-star free finial used on roofs (decorative Ottoman motif). */
export function finial(x, y, color = P.gold, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
<line x1="0" y1="0" x2="0" y2="-12" stroke="${INK}" stroke-width="3"/>
<circle cx="0" cy="-6" r="3" ${o(color)} stroke-width="2"/>
<path d="M -5 -18 A 7 7 0 1 0 5 -18 A 5.5 5.5 0 1 1 -5 -18 Z" ${o(color)} stroke-width="1.6"/>
</g>`;
}

/** A pennant flag on a pole. */
export function flag(x, y, color = P.red, h = 30, w = 22) {
    return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - h}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
<path d="M ${x} ${y - h} L ${x + w} ${y - h + 6} L ${x} ${y - h + 13} Z" ${o(color)} stroke-width="2"/>`;
}

/** Pointed (ogee-ish) Ottoman arch window. */
export function archWindow(x, y, w, h, fill = '#3b2a3a') {
    const r = w / 2;
    return `<path d="M ${x} ${y + h} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y - r * 0.6} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h} Z" ${o(fill)} stroke-width="2"/>`;
}

export function groundShadow(cx, cy, rx, ry) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="0.18"/>`;
}

/** Deterministic PRNG so generated tiles are stable between runs. */
export function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
