export interface Vec2 { x: number; y: number }

export const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v);

export const dist2 = (ax: number, ay: number, bx: number, by: number) => {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
};

export const dist = (ax: number, ay: number, bx: number, by: number) => Math.sqrt(dist2(ax, ay, bx, by));
