export type Color = 'R' | 'Y' | 'B' | 'G';
export type Board = Color[][];
export interface Level {
    name: string;
    purpose: string;
    board: Board;
    target: Color;
    moves: number;
}
