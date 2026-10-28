import { Level } from './types';
// Inspection fixtures only. Formal level ordering and presentation stay separate from Rules.
export const levels: Level[] = [
    { id: 'sample-boundary', name: '01 · 连接边界', purpose: '黄黄蓝黄黄：蓝色不会成为本次染色的桥梁', board: [['Y', 'Y', 'B', 'Y', 'Y']], target: 'B', moves: 2 },
    { id: 'sample-bridge', name: '02 · 过渡排练', purpose: '先接成黄队，再接红队，最后全员变蓝', board: [['R', 'Y', 'R', 'B'], ['R', 'Y', 'R', 'B'], ['R', 'Y', 'R', 'B'], ['R', 'Y', 'R', 'B']], target: 'B', moves: 3 },
    { id: 'sample-four-colors', name: '03 · 四色集合', purpose: '4×4 四色队伍；可撤销尝试不同合并顺序', board: [['R', 'R', 'Y', 'Y'], ['R', 'R', 'Y', 'Y'], ['G', 'G', 'B', 'B'], ['G', 'G', 'B', 'B']], target: 'B', moves: 3 }
];
