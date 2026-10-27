// Read-only reference: Overflowing Palette Cell.ts, ShaderCell.ts, base.glsl.
// Native Laya 2D geometry restores full tiles; bands approximate the material,
// not the reference's time-distorted per-pixel shader.
export function gridMask(w: number, h: number) {
    const mask = new Laya.Sprite(), radius = Math.min(w, h) * .2;
    mask.name = 'grid-mask';
    mask.mouseEnabled = false;
    mask.graphics.drawRoundRect(0, 0, w, h, radius, radius, radius, radius, '#ffffff');
    return mask;
}
export function gridSurface(w: number, h: number, boardX: number, boardY: number) {
    const surface = new Laya.Sprite();
    surface.name = 'grid-surface';
    surface.mouseEnabled = false;
    surface.mask = gridMask(w, h);
    const g = surface.graphics;
    // Board coordinates keep neighboring cells on the same broad curved bands.
    const period = 145, amplitude = 28;
    const wave = (x: number) => Math.sin(x / 155) * amplitude + Math.sin(x / 71) * 9;
    const first = Math.floor((boardY - amplitude - 57) / period);
    const last = Math.ceil((boardY + h + amplitude) / period);
    for (let band = first; band <= last; band++) {
        const points: number[] = [];
        for (let i = 0; i <= 12; i++) {
            const x = i * w / 12;
            points.push(x, band * period + wave(boardX + x) - boardY);
        }
        for (let i = 12; i >= 0; i--) {
            const x = i * w / 12;
            points.push(x, band * period + wave(boardX + x) + 38 - boardY);
        }
        g.drawPoly(0, 0, points, 'rgba(0,0,0,0.13)');
        const shine: number[] = [];
        for (let i = 0; i <= 12; i++) {
            const x = i * w / 12;
            shine.push(x, band * period + wave(boardX + x) + 42 - boardY);
        }
        for (let i = 12; i >= 0; i--) {
            const x = i * w / 12;
            shine.push(x, band * period + wave(boardX + x) + 57 - boardY);
        }
        g.drawPoly(0, 0, shine, 'rgba(255,255,255,0.06)');
    }
    // Gentle top sheen and lower shade retain clear solid-color reading.
    for (let i = 0; i < 6; i++) {
        g.drawRect(0, i * h * .026, w, h * .026, `rgba(255,255,255,${.11 * (1 - i / 6)})`);
        g.drawRect(0, h - (i + 1) * h * .034, w, h * .034, `rgba(0,0,0,${.055 * (1 - i / 6)})`);
    }
    return surface;
}
