// Normalized geometry matching CharacterGpuArt's existing GLSL threshold.
// Keep these constants in sync with that shader; no texture sampling is needed.
export function frontRipple(cross: number) {
    return .025 * Math.sin(cross * 7 + 1.13) + .012 * Math.sin(cross * 17 - 1.13);
}

export function frontRadius(angle: number, progress: number) {
    return Math.SQRT1_2 * progress * (1 + .045 * Math.sin(angle * 3) + .025 * Math.sin(angle * 7));
}

// Progress at which the front reaches a point on a shared edge.
export function frontArrival(x: number, y: number, dx: number, dy: number, center: boolean) {
    const px = x - .5, py = y - .5;
    let threshold: number;
    if (center) {
        threshold = Math.hypot(px, py) / frontRadius(Math.atan2(py, px), 1);
    } else {
        const length = Math.hypot(dx, dy), nx = dx / length, ny = dy / length;
        const cross = -px * ny + py * nx;
        threshold = (px * nx + py * ny) / (Math.abs(nx) + Math.abs(ny)) + .5 - frontRipple(cross);
    }
    return Math.max(0, Math.min(1, threshold));
}
