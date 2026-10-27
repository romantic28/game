import { WaveCell } from './Wave';
import { frontRadius, frontRipple } from './DyeFront';

// The mask backend uses the GPU threshold geometry too, so a shared-edge
// handoff has the same meaning in both modes. No per-pixel CPU work.
export function paintFront(w: number, h: number, p: number, cell: WaveCell) {
    if (cell.direction === 'center') {
        const edge: number[] = [];
        for (let i = 0; i <= 40; i++) {
            const angle = i / 40 * Math.PI * 2, radius = frontRadius(angle, p);
            edge.push((.5 + Math.cos(angle) * radius) * w, (.5 + Math.sin(angle) * radius) * h);
        }
        return { fill: edge.slice(0, -2), edge };
    }
    const length = Math.hypot(cell.dx, cell.dy), nx = cell.dx / length, ny = cell.dy / length;
    const extent = Math.abs(nx) + Math.abs(ny), span = extent / 2 + .06;
    const edge: number[] = [];
    for (let i = 0; i <= 32; i++) {
        const cross = -span + 2 * span * i / 32;
        const along = (p - .5 + frontRipple(cross)) * extent;
        edge.push((.5 + nx * along - ny * cross) * w, (.5 + ny * along + nx * cross) * h);
    }
    const back = -extent;
    return { fill: [(.5 + nx * back + ny * span) * w, (.5 + ny * back - nx * span) * h, ...edge, (.5 + nx * back - ny * span) * w, (.5 + ny * back + nx * span) * h], edge };
}
