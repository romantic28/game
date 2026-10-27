import { frontArrival } from './DyeFront';

export interface WaveCell {
    r: number;
    c: number;
    // Incoming edge normal from the predecessor, not from the click origin.
    dx: number;
    dy: number;
    source?: { r: number; c: number };
    distance: number;
    start: number;
    duration: number;
    direction: 'center' | 'left' | 'right' | 'top' | 'bottom';
}

// Bound long corridors without changing relative edge handoffs.
export const maxDyeWaveDuration = 1800;

// Only the frozen original region is eligible. BFS preserves shortest graph distance;
// among predecessors in the previous layer, use the earliest arriving front.
export function planWave(changed: number[][], r: number, c: number): WaveCell[] {
    const allowed = new Set(changed.map(([y, x]) => `${y},${x}`));
    if (!allowed.has(`${r},${c}`)) return [];
    const origin: WaveCell = { r, c, dx: 0, dy: 0, distance: 0, start: 0, duration: 380, direction: 'center' };
    const result = [origin], planned = new Map<string, WaveCell>([[`${r},${c}`, origin]]);
    for (let i = 0; i < result.length; i++) {
        const parent = result[i];
        for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const y = parent.r + dy, x = parent.c + dx, key = `${y},${x}`;
            if (!allowed.has(key)) continue;
            const distance = parent.distance + 1, existing = planned.get(key);
            if (existing && existing.distance !== distance) continue;
            // The midpoint of the shared edge is the handoff point. A side
            // branch may start before the parent finishes its opposite edge.
            const arrival = frontArrival(.5 + dx * .5, .5 + dy * .5, parent.dx, parent.dy, parent.direction === 'center');
            const start = parent.start + parent.duration * arrival;
            if (existing && existing.start <= start) continue;
            const cell: WaveCell = existing || {
                r: y, c: x, dx, dy, distance, start,
                duration: Math.max(380 * Math.pow(.96, distance), 280), direction: 'center'
            };
            cell.start = start;
            cell.dx = dx;
            cell.dy = dy;
            cell.source = { r: parent.r, c: parent.c };
            cell.direction = dx > 0 ? 'left' : dx < 0 ? 'right' : dy > 0 ? 'top' : 'bottom';
            if (!existing) {
                planned.set(key, cell);
                result.push(cell);
            }
        }
    }
    const end = Math.max(...result.map(cell => cell.start + cell.duration));
    if (end > maxDyeWaveDuration) {
        const scale = maxDyeWaveDuration / end;
        for (const cell of result) {
            cell.start *= scale;
            cell.duration *= scale;
        }
    }
    return result;
}

export function waveProgress(elapsed: number, cell: WaveCell) {
    return Math.max(0, Math.min(1, (elapsed - cell.start) / cell.duration));
}
