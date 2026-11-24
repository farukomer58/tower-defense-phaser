type Child = Node | string | null | undefined | false;

/** Tiny hyperscript helper for building DOM UI without a framework. */
export function h<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs: Record<string, unknown> = {},
    ...children: (Child | Child[])[]
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (v === undefined || v === null || v === false) continue;
        if (k === 'class') el.className = String(v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
        else if (k === 'html') el.innerHTML = String(v);
        else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of children.flat()) {
        if (c === null || c === undefined || c === false) continue;
        el.append(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
}

/** Sets text only when it changed (avoids layout thrash in per-frame updates). */
export function setText(el: HTMLElement, text: string | number): void {
    const s = String(text);
    if (el.textContent !== s) el.textContent = s;
}

export function toggleClass(el: HTMLElement, cls: string, on: boolean): void {
    if (el.classList.contains(cls) !== on) el.classList.toggle(cls, on);
}

export function icon(src: string, cls = 'icon', alt = ''): HTMLImageElement {
    return h('img', { src, class: cls, alt, draggable: 'false' });
}

export const fmt = (n: number): string => {
    if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
    if (n >= 1e4) return `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1)}k`;
    return String(Math.floor(n));
};
