export type Color = 'R' | 'Y' | 'B' | 'G';
export type Board = Color[][];
export interface Level {
    // Optional for compatibility with existing external fixtures; shipped samples always define it.
    id?: string;
    name: string;
    purpose: string;
    board: Board;
    target: Color;
    moves: number;
}
