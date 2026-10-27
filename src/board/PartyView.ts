import { CharacterGpuTile } from '../characters/CharacterGpuArt';
import { bounceDuration, groupResponseDuration } from '../characters/CharacterMotion';
import { Rules } from '../gameplay/Rules';
import { levels } from '../gameplay/SampleLevels';
import { Color, Board } from '../gameplay/types';
import { planWave, waveProgress, WaveCell } from '../effects/Wave';
import { paintFront } from '../effects/PaintFront';
import { gridMask, gridSurface } from './GridAppearance';
import { CharacterStaticTile } from '../characters/CharacterStaticArt';
import { staticArtReady, Species, speciesList } from '../characters/CharacterResources';
const colors: Record<Color, string> = { R: '#ff4d46', Y: '#f7f58c', B: '#73aeff', G: '#5bcc7f' };
const names: Record<Color, string> = { R: '红', Y: '黄', B: '蓝', G: '绿' };
interface Tile {
    character?: CharacterStaticTile | CharacterGpuTile;
    paint: Laya.Sprite;
    sprite: Laya.Sprite;
    label: Laya.Text;
    progress: number;
    surface: Laya.Sprite;
    pulse: Laya.Sprite;
}
export class PartyView extends Laya.Sprite {
    rules = new Rules(levels[2]);
    index = 2;
    private tiles: Tile[][] = [];
    private inspecting = false;
    private gpuCharacters = true;
    private motionEnabled = true;
    private characters = staticArtReady();
    private species: Species | 'mixed' = 'mixed';
    private movesText: Laya.Text;
    private statusText: Laya.Text;
    private colorButtons: Partial<Record<Color, Laya.Sprite>> = {};
    private animation: {
        old: Board;
        cells: WaveCell[];
        start: number;
        end: number;
        color: Color;
        groupStart: number;
        responders: number[][];
        groupStarted: boolean;
    } | null = null;
    constructor() {
        super();
        this.size(600, 1000);
        this.refreshUI();
    }
    private text(value: string, x: number, y: number, w: number, size = 24, color = '#edf0ff') {
        const t = new Laya.Text();
        t.text = value;
        t.font = 'Microsoft YaHei';
        t.fontSize = size;
        t.color = color;
        t.pos(x, y);
        t.width = w;
        t.height = 60;
        t.align = 'center';
        t.wordWrap = true;
        t.mouseEnabled = false;
        this.addChild(t);
        return t;
    }
    private button(label: string, x: number, y: number, w: number, h: number, fill: string, action: () => void, selected = false, border = true, fontSize = 24) {
        const b = new Laya.Sprite();
        b.name = label;
        b.pos(x, y);
        b.size(w, h);
        b.graphics.drawRect(0, 0, w, h, fill, border ? (selected ? '#ffffff' : '#434c71') : null, selected ? 4 : 1);
        b.mouseEnabled = true;
        this.addChild(b);
        const t = new Laya.Text();
        t.text = label;
        t.font = 'Microsoft YaHei';
        t.fontSize = fontSize;
        t.color = '#fff';
        t.width = w;
        t.height = h;
        t.align = 'center';
        t.valign = 'middle';
        t.mouseEnabled = false;
        b.addChild(t);
        b.on(Laya.Event.CLICK, this, action);
        return b;
    }
    private styleTile(sprite: Laya.Sprite, color: Color, boardX: number, boardY: number) {
        const w = sprite.width, h = sprite.height;
        sprite.name = 'grid-cell';
        sprite.graphics.clear();
        const paint = new Laya.Sprite();
        paint.name = 'grid-paint';
        paint.mouseEnabled = false;
        paint.size(w, h);
        paint.mask = gridMask(w, h);
        paint.graphics.drawRect(0, 0, w, h, colors[color]);
        sprite.addChild(paint);
        const surface = gridSurface(w, h, boardX, boardY);
        sprite.addChild(surface);
        const pulse = new Laya.Sprite();
        pulse.name = 'grid-pulse';
        pulse.mouseEnabled = false;
        pulse.alpha = 0;
        pulse.mask = gridMask(w, h);
        pulse.graphics.drawRect(0, 0, w, h, '#fff6df');
        sprite.addChild(pulse);
        return { paint, surface, pulse };
    }
    private toggleCharacters() {
        if (this.rules.busy || !staticArtReady())
            return;
        this.characters = !this.characters;
        this.refreshUI();
    }
    private inspectGrid() {
        this.cancelAnimation();
        this.inspecting = !this.inspecting;
        this.rules = this.inspecting ? new Rules({ name: '密集检查 · 8×10', purpose: '80格排布检查，非正式关卡；角色与格子均可染色',
            board: Array.from({ length: 8 }, (_, r) => Array.from({ length: 10 }, (_, c) => (['R', 'Y', 'B', 'G'] as Color[])[(Math.floor(c / 2) + Math.floor(r / 2)) % 4])), target: 'B', moves: 80 }) : new Rules(levels[this.index]);
        this.refreshUI();
    }
    private cancelAnimation() {
        Laya.timer.clearAll(this);
        this.animation = null;
        for (const row of this.tiles)
            for (const tile of row)
                tile.character?.motion?.reset();
    }
    destroy(destroyChild = true) {
        this.cancelAnimation();
        super.destroy(destroyChild);
    }
    restart() {
        this.cancelAnimation();
        this.rules.reset();
        this.refreshUI();
    }
    load(index: number) {
        this.cancelAnimation();
        this.index = index;
        this.inspecting = false;
        this.rules = new Rules(levels[index]);
        this.refreshUI();
    }
    cell(r: number, c: number) {
        if (this.rules.busy)
            return;
        const old = this.rules.board.map(row => row.slice());
        if (!this.rules.start(r, c))
            return;
        const cells = planWave(this.rules.changed, r, c);
        const changed = new Set(this.rules.changed.map(([y, x]) => `${y},${x}`));
        // Original target-color teammates respond once, but never enter the dye wave.
        const responders = this.motionEnabled ? this.rules.team.filter(([y, x]) => !changed.has(`${y},${x}`) && !!this.tiles[y][x].character?.motion) : [];
        const groupStart = Math.max(...cells.map(v => v.start + v.duration + (this.motionEnabled && this.tiles[v.r][v.c].character?.motion ? bounceDuration : 0)));
        this.animation = { old, cells, start: Laya.timer.currTimer, end: groupStart + (responders.length ? groupResponseDuration : 0), color: this.rules.selected, groupStart, responders, groupStarted: false };
        for (const cell of cells) {
            const tile = this.tiles[cell.r][cell.c];
            tile.progress = -1;
        }
        this.updateStatus();
        this.tickAnimation();
        Laya.timer.frameLoop(1, this, this.tickAnimation);
    }
    private tickAnimation() {
        const now = Laya.timer.currTimer;
        let expressionPending = false;
        for (const row of this.tiles)
            for (const tile of row) {
                if (tile.character?.motion?.updateExpression(now))
                    expressionPending = true;
            }
        const animation = this.animation;
        if (!animation) {
            if (!expressionPending)
                Laya.timer.clear(this, this.tickAnimation);
            return;
        }
        const elapsed = Laya.timer.currTimer - animation.start;
        for (const cell of animation.cells) {
            if (elapsed < cell.start)
                continue;
            const tile = this.tiles[cell.r][cell.c], p = waveProgress(elapsed, cell);
            if (tile.progress === p) {
                if (p >= 1 && this.motionEnabled)
                    tile.character?.motion?.update(elapsed - cell.start - cell.duration);
                continue;
            }
            if (tile.character && tile.progress < 0) {
                if (tile.character instanceof CharacterGpuTile)
                    tile.character.beginTransition(animation.color, cell);
                else
                    tile.character.beginTransition(animation.color);
            }
            tile.progress = p;
            if (tile.character) {
                if (tile.character instanceof CharacterGpuTile)
                    tile.character.setTransitionProgress(p);
                else
                    tile.character.setTransitionProgress(p, cell);
                if (p >= 1) {
                    tile.character.finishTransition();
                    if (this.motionEnabled)
                        tile.character.motion?.update(elapsed - cell.start - cell.duration);
                }
                continue; // Hidden grid labels, surfaces and pulses do not animate in character mode.
            }
            else
                this.paintTransition(tile, colors[animation.old[cell.r][cell.c]], colors[animation.color], p, cell);
            tile.label.text = names[p >= .5 ? animation.color : animation.old[cell.r][cell.c]];
            // Surface and hit area stay registered to the square cell.
            const energy = Math.sin(Math.PI * p);
            tile.pulse.alpha = energy * energy * .12;
            tile.surface.alpha = 1 - energy * .08;
        }
        if (animation.responders.length && elapsed >= animation.groupStart) {
            if (!animation.groupStarted) {
                animation.groupStarted = true;
                this.statusText.text = '新队伍集合中…';
            }
            for (const [r, c] of animation.responders)
                this.tiles[r][c].character?.motion?.respondToGroup(elapsed - animation.groupStart);
        }
        if (elapsed >= animation.end) {
            // The body action ends now; the face may linger without locking input.
            this.animation = null;
            this.rules.finish();
            this.updateStatus();
        }
    }
    // A directional, slightly uneven paint front. Draws only inside the original tile bounds.
    private paintTransition(tile: Tile, oldColor: string, newColor: string, p: number, cell: WaveCell) {
        const g = tile.paint.graphics, w = tile.sprite.width, h = tile.sprite.height;
        g.clear();
        g.drawRect(0, 0, w, h, p >= 1 ? newColor : oldColor);
        if (p <= 0 || p >= 1)
            return;
        const front = paintFront(w, h, p, cell);
        g.drawPoly(0, 0, front.fill, newColor);
        // Wide translucent halo plus a white core: closer to the reference threshold band.
        g.drawLines(0, 0, front.edge, 'rgba(255,245,211,0.22)', Math.min(w, h) * .11);
        g.drawLines(0, 0, front.edge, 'rgba(255,255,240,0.9)', Math.min(w, h) * .035);
    }
    private updateStatus() {
        this.movesText.text = `目标：${names[this.rules.level.target]}色   ·   剩余 ${this.rules.moves} 步`;
        this.statusText.text = this.rules.busy ? '变装接力中…' : this.rules.result === 'win' ? '成功！全员完成变装' : this.rules.result === 'fail' ? '步数用完 · 可撤销或重来' : '先选颜色，再点任意同色区域';
        this.statusText.color = this.rules.result === 'fail' ? '#ffb3b3' : '#e5edff';
    }
    private selectColor(color: Color) {
        if (this.rules.busy || this.rules.selected === color)
            return;
        this.rules.select(color);
        for (const key of ['R', 'Y', 'B', 'G'] as Color[]) {
            const button = this.colorButtons[key];
            if (!button)
                continue;
            const selected = this.rules.selected === key;
            button.graphics.clear();
            button.graphics.drawRect(0, 0, button.width, button.height, colors[key], selected ? '#ffffff' : '#434c71', selected ? 4 : 1);
        }
    }
    private refreshUI(board: Board = this.rules.board) {
        this.colorButtons = {};
        while (this.numChildren)
            this.getChildAt(0).destroy(true);
        this.tiles = [];
        this.graphics.clear();
        this.graphics.drawRect(0, 0, 600, 1000, '#171d36');
        this.text('染色玩法开发预览', 20, 30, 560, 36);
        this.text(this.characters ? `V0.2 / 三物种 · ${this.gpuCharacters ? 'GPU' : '遮罩'} 接力染色` : 'V0.2 / 纯格子对照 · 可操作', 20, 82, 560, 18, '#a8b4d5');
        levels.forEach((l, i) => this.button(`样板 ${i + 1}`, 24 + i * 190, 132, 172, 48, i === this.index ? '#6575b7' : '#303951', () => this.load(i)));
        (['mixed', ...speciesList] as (Species | 'mixed')[]).forEach((species, i) => this.button({ mixed: '三物种混排', horn: '小角怪', cyclops: '独眼怪', rabbit: '兔耳怪' }[species], 24 + i * 140, 190, 132, 34, '#343f60', () => {
            if (this.rules.busy || !staticArtReady())
                return;
            this.species = species;
            this.characters = true;
            this.refreshUI();
        }, this.characters && this.species === species, true, 20));
        this.text(this.rules.level.name, 20, 231, 560, 24);
        this.movesText = this.text('', 20, 273, 560, 24);
        this.text(this.rules.level.purpose, 30, 315, 540, 18, '#b8c5e4');
        this.button(this.inspecting ? '返回普通样板' : '8×10 密集检查', 32, 354, 250, 36, '#343f60', () => this.inspectGrid());
        this.button(this.characters ? '纯格子对照' : staticArtReady() ? '角色棋盘' : '角色资源未就绪', 318, 354, 250, 36, '#343f60', () => this.toggleCharacters());
        if (this.characters)
            this.button(this.gpuCharacters ? 'GPU 染色 · 切换遮罩' : '遮罩染色 · 切换 GPU', 160, 764, 280, 32, '#343f60', () => {
                if (this.rules.busy)
                    return;
                this.gpuCharacters = !this.gpuCharacters;
                this.refreshUI();
            }, false, true, 18);
        if (this.characters)
            this.button(this.motionEnabled ? '角色动作：开' : '角色动作：关', 170, 970, 260, 28, '#343f60', () => {
                if (this.rules.busy)
                    return;
                this.motionEnabled = !this.motionEnabled;
                this.refreshUI();
            }, false, true, 18);
        const rows = board.length, cols = board[0].length, size = Math.min(112, 520 / cols, 320 / rows), left = (600 - cols * size) / 2, top = 400 + (320 - rows * size) / 2;
        board.forEach((row, r) => {
            this.tiles[r] = [];
            row.forEach((color, c) => {
                const sprite = this.button(names[color], left + c * size + 1.5, top + r * size + 1.5, size - 3, size - 3, colors[color], () => this.cell(r, c), false, false);
                const label = sprite.getChildAt(0) as Laya.Text;
                label.visible = false;
                const effect = this.styleTile(sprite, color, c * size, r * size);
                sprite.name = `grid-cell-${r + 1}-${c + 1}`;
                let character: CharacterStaticTile | CharacterGpuTile | undefined;
                if (this.characters) {
                    // Keep the parent hit area and cell positions identical in both modes.
                    effect.paint.visible = false;
                    effect.surface.visible = false;
                    effect.pulse.visible = false;
                    const species = this.species === 'mixed' ? speciesList[(r + c) % speciesList.length] : this.species;
                    if (this.gpuCharacters) {
                        const gpu = new CharacterGpuTile(species, color, color, size - 3);
                        gpu.finishTransition();
                        character = gpu;
                    }
                    else
                        character = new CharacterStaticTile(species, color, size - 3);
                    sprite.addChild(character);
                }
                this.tiles[r][c] = { sprite, label, character, progress: -1, ...effect };
            });
        });
        this.statusText = this.text('', 20, 730, 560, 22);
        this.updateStatus();
        (['R', 'Y', 'B', 'G'] as Color[]).forEach((c, i) => {
            this.colorButtons[c] = this.button(names[c], 36 + i * 135, 810, 120, 58, colors[c], () => this.selectColor(c), this.rules.selected === c);
        });
        this.button('撤销', 50, 903, 230, 56, '#343f60', () => {
            if (this.rules.busy)
                return;
            this.rules.undo();
            this.refreshUI();
        });
        this.button('重来', 320, 903, 230, 56, '#343f60', () => this.restart());
    }
}
