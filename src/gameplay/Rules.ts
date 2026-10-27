import { Board, Color, Level } from './types';
const copy = (b: Board): Board => b.map(r => r.slice());
export function region(board: Board, r: number, c: number): number[][] {
    const color = board[r]?.[c];
    if (!color)
        return [];
    const queue = [[r, c]], seen = new Set([`${r},${c}`]);
    for (let i = 0; i < queue.length; i++)
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nr = queue[i][0] + dr, nc = queue[i][1] + dc, key = `${nr},${nc}`;
            if (board[nr]?.[nc] === color && !seen.has(key)) {
                seen.add(key);
                queue.push([nr, nc]);
            }
        }
    return queue;
}
export class Rules {
    board: Board;
    moves: number;
    result: 'playing' | 'win' | 'fail' = 'playing';
    busy = false;
    selected: Color = 'B';
    changed: number[][] = [];
    team: number[][] = [];
    private history: {
        board: Board;
        moves: number;
    }[] = [];
    constructor(public level: Level) {
        this.reset();
    }
    reset() {
        this.board = copy(this.level.board);
        this.moves = this.level.moves;
        this.history = [];
        this.busy = false;
        this.changed = [];
        this.team = [];
        this.judge();
    }
    select(color: Color) {
        if (!this.busy)
            this.selected = color;
    }
    start(r: number, c: number): boolean {
        if (this.busy || this.result !== 'playing' || !this.board[r]?.[c] || this.board[r][c] === this.selected)
            return false;
        // Freeze original region before changing any cell: new-color cells cannot be bridges.
        this.changed = region(this.board, r, c);
        this.history.push({ board: copy(this.board), moves: this.moves });
        for (const [y, x] of this.changed)
            this.board[y][x] = this.selected;
        this.team = region(this.board, r, c);
        this.moves--;
        this.busy = true;
        return true;
    }
    finish() {
        if (this.busy) {
            this.busy = false;
            this.judge();
        }
    }
    undo() {
        if (this.busy)
            return false;
        const old = this.history.pop();
        if (!old)
            return false;
        this.board = old.board;
        this.moves = old.moves;
        this.changed = [];
        this.team = [];
        this.judge();
        return true;
    }
    private judge() {
        this.result = this.board.every(row => row.every(c => c === this.level.target)) ? 'win' : this.moves <= 0 ? 'fail' : 'playing';
    }
}
