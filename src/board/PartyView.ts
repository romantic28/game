import { characterDefinitions } from '../characters/CharacterDefinitions';
import { CharacterGpuTile } from '../characters/CharacterGpuArt';
import { Rules } from '../gameplay/Rules';
import { levels } from '../gameplay/SampleLevels';
import { Color, Board } from '../gameplay/types';
import { planWave, waveProgress, WaveCell } from '../effects/Wave';
import { paintFront } from '../effects/PaintFront';
import { gridMask, gridSurface } from './GridAppearance';
import { CharacterStaticTile } from '../characters/CharacterStaticArt';
import { CharacterMotion, idleUpdateInterval } from '../characters/CharacterMotion';
import { staticArtReady, Species, speciesList, hasBlink } from '../characters/CharacterResources';
const colors: Record<Color, string> = { R: '#ff4d46', Y: '#f7f58c', B: '#73aeff', G: '#5bcc7f' };
// Initial sample threshold, subject to user feedback; it never changes the dye region.
const largeMergeSize = 12;
const victoryPreviewDelay = 500;
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
    private idleEnabled = true;
    private blinkEnabled = true;
    private nextIdleUpdate = 0;
    private nextBlinkAt = 0;
    private blinkCandidates: CharacterMotion[] = [];
    private get idleWorkPending() {
        return this.characters && this.motionEnabled && this.rules.result === 'playing' &&
            (this.idleEnabled || (this.blinkEnabled && this.blinkCandidates.length > 0));
    }
    private characters = staticArtReady();
    private species: Species | 'mixed' = 'mixed';
    private movesText: Laya.Text;
    private statusText: Laya.Text;
    private victory: { start: number; phase: 'cheer' | 'hold' | 'photo'; cheerDuration: number } | null = null;
    private photoFrame: Laya.Sprite | null = null;
    private get inputLocked() {
        return this.rules.busy || !!(this.victory && this.victory.phase !== 'photo');
    }
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
        largeMerge: boolean;
        finalGroup: boolean;
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
        if (this.inputLocked || !staticArtReady())
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
        this.victory = null;
        this.photoFrame?.destroy(true);
        this.photoFrame = null;
        this.nextIdleUpdate = 0;
        this.nextBlinkAt = 0;
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
        if (this.inputLocked)
            return;
        const old = this.rules.board.map(row => row.slice());
        if (!this.rules.start(r, c))
            return;
        // Keep the complete dye wave on the original registered body coordinates.
        for (const row of this.tiles)
            for (const tile of row)
                if (tile.character?.motion) {
                    tile.character.motion.stopIdle();
                    tile.character.motion.stopBlink();
                }
        this.nextBlinkAt = 0;
        const cells = planWave(this.rules.changed, r, c);
        const changed = new Set(this.rules.changed.map(([y, x]) => `${y},${x}`));
        // Original teammates never enter the dye wave; large merges add a final whole-team response.
        let responders = this.motionEnabled ? this.rules.team.filter(([y, x]) => !changed.has(`${y},${x}`) && !!this.tiles[y][x].character?.motion) : [];
        const largeMerge = responders.length > 0 && this.rules.team.length >= largeMergeSize;
        if (largeMerge)
            responders = this.rules.team.filter(([y, x]) => !!this.tiles[y][x].character?.motion);
        const finalGroup = largeMerge && this.rules.board.every(row => row.every(color => color === this.rules.level.target));
        const groupStart = Math.max(...cells.map(cell => {
            const motion = this.tiles[cell.r][cell.c].character?.motion;
            const actionDuration = this.motionEnabled ? motion?.bounceDuration || 0 : 0;
            return cell.start + cell.duration + actionDuration;
        }));
        this.animation = { old, cells, start: Laya.timer.currTimer, end: groupStart + this.responseDuration(responders), color: this.rules.selected, groupStart, responders, groupStarted: false, largeMerge, finalGroup };
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
        if (this.victory) {
            this.tickVictory(now);
            return;
        }
        const animation = this.animation;
        if (!animation) {
            if (this.idleWorkPending) {
                if (this.idleEnabled && now >= this.nextIdleUpdate) {
                    this.nextIdleUpdate = now + idleUpdateInterval;
                    const columns = this.tiles[0].length;
                    for (let r = 0; r < this.tiles.length; r++)
                        for (let c = 0; c < columns; c++)
                            this.tiles[r][c].character?.motion?.updateIdle(now, r * columns + c);
                }
                if (this.blinkEnabled && this.blinkCandidates.length) {
                    if (this.nextBlinkAt && now >= this.nextBlinkAt) {
                        const start = Math.floor(Math.random() * this.blinkCandidates.length);
                        for (let i = 0; i < this.blinkCandidates.length; i++)
                            if (this.blinkCandidates[(start + i) % this.blinkCandidates.length].tryBlink(now)) break;
                        this.nextBlinkAt = 0;
                    }
                    if (!this.nextBlinkAt) this.nextBlinkAt = now + 2000 + Math.random() * 2000;
                }
            } else if (!expressionPending)
                Laya.timer.clear(this, this.tickAnimation);
            return;
        }
        const elapsed = Laya.timer.currTimer - animation.start;
        for (const cell of animation.cells) {
            if (elapsed < cell.start)
                continue;
            const tile = this.tiles[cell.r][cell.c], p = waveProgress(elapsed, cell);
            if (tile.progress === p) {
                // Once the shared group starts, do not repeatedly settle its newly dyed members.
                if (p >= 1 && this.motionEnabled && !animation.groupStarted)
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
                // The face responds during the dye, while the body stays registered.
                // Only renew on changing progress; completed cells use the bounded bounce.
                if (this.motionEnabled)
                    tile.character.motion?.respondToDye(p);
                if (p >= 1) {
                    tile.character.finishTransition();
                    if (this.motionEnabled && !animation.groupStarted)
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
                this.statusText.text = animation.largeMerge ? '大队伍一起集合…' : '新队伍集合中…';
            }
            for (const [r, c] of animation.responders) {
                const motion = this.tiles[r][c].character?.motion;
                if (animation.finalGroup)
                    motion?.respondToVictory(elapsed - animation.groupStart);
                else
                    motion?.respondToGroup(elapsed - animation.groupStart);
            }
        }
        if (elapsed >= animation.end) {
            // The body action ends now; the face may linger without locking input.
            this.animation = null;
            this.rules.finish();
            if (this.rules.result === 'win') {
                const cheerDuration = this.responseDuration(this.rules.team);
                if (animation.finalGroup) {
                    // This whole-team response already is the victory cheer: keep it continuous.
                    for (const row of this.tiles)
                        for (const tile of row)
                            tile.character?.motion?.holdForPhoto();
                    this.victory = { start: now - cheerDuration, phase: 'hold', cheerDuration };
                } else {
                    this.victory = { start: now, phase: 'cheer', cheerDuration };
                }
            }
            this.updateStatus();
        }
    }
    private responseDuration(cells: number[][]) {
        if (!this.motionEnabled) return 0;
        let duration = 0;
        for (const [r, c] of cells)
            duration = Math.max(duration, this.tiles[r][c].character?.motion?.groupDuration || 0);
        return duration;
    }
    private tickVictory(now: number) {
        const victory = this.victory;
        if (!victory) return;
        const elapsed = now - victory.start;
        const animate = this.characters && this.motionEnabled;
        if (animate && elapsed < victory.cheerDuration) {
            for (const row of this.tiles)
                for (const tile of row)
                    tile.character?.motion?.respondToVictory(elapsed);
            return;
        }
        if (victory.phase === 'cheer') {
            if (animate)
                for (const row of this.tiles)
                    for (const tile of row)
                        tile.character?.motion?.holdForPhoto();
            victory.phase = 'hold';
        }
        if (animate && elapsed < victoryPreviewDelay) return;
        if (victory.phase !== 'photo') {
            victory.phase = 'photo';
            // Keep the actual board and characters; this is a framed view, not an exported PNG.
            const rows = this.tiles.length, cols = this.tiles[0].length;
            const first = this.tiles[0][0].sprite, last = this.tiles[rows - 1][cols - 1].sprite;
            const frame = new Laya.Sprite();
            frame.name = 'victory-photo-frame';
            frame.mouseEnabled = false;
            frame.graphics.drawRoundRect(first.x - 9, first.y - 9, last.x + last.width - first.x + 18, last.y + last.height - first.y + 18, 12, 12, 12, 12, null, '#fff5dd', 3);
            this.photoFrame = frame;
            this.addChild(frame);
            this.updateStatus();
        }
        // Freeze the same board in its final pose; no background expression timers remain.
        Laya.timer.clear(this, this.tickAnimation);
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
        this.statusText.text = this.victory ? (this.victory.phase === 'photo' ? '合照取景预览 · 重来或切样板继续' : '成功！全员集合留念…') : this.inputLocked ? '变装接力中…' : this.rules.result === 'win' ? '成功！全员完成变装' : this.rules.result === 'fail' ? '步数用完 · 可撤销或重来' : '先选颜色，再点任意同色区域';
        this.statusText.color = this.rules.result === 'fail' ? '#ffb3b3' : '#e5edff';
    }
    private selectColor(color: Color) {
        if (this.inputLocked || this.rules.selected === color)
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
        this.cancelAnimation();
        this.colorButtons = {};
        while (this.numChildren)
            this.getChildAt(0).destroy(true);
        this.tiles = [];
        this.blinkCandidates = [];
        this.graphics.clear();
        this.graphics.drawRect(0, 0, 600, 1000, '#171d36');
        this.text('染色玩法开发预览', 20, 30, 560, 36);
        this.text(this.characters ? `V0.2 / ${speciesList.length === 3 ? '三物种' : speciesList.length + '物种'} · ${this.gpuCharacters ? 'GPU' : '遮罩'} 接力染色` : 'V0.2 / 纯格子对照 · 可操作', 20, 82, 560, 18, '#a8b4d5');
        levels.forEach((l, i) => this.button(`样板 ${i + 1}`, 24 + i * 190, 132, 172, 48, i === this.index ? '#6575b7' : '#303951', () => this.load(i)));
        const speciesOptions: (Species | 'mixed')[] = ['mixed', ...speciesList];
        const speciesButtonWidth = Math.min(132, (552 - (speciesOptions.length - 1) * 8) / speciesOptions.length);
        speciesOptions.forEach((species, i) => this.button(species === 'mixed' ? (speciesList.length === 3 ? '三物种混排' : '多物种混排') : characterDefinitions[species].name, 24 + i * (speciesButtonWidth + 8), 190, speciesButtonWidth, 34, '#343f60', () => {
            if (this.inputLocked || !staticArtReady())
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
                if (this.inputLocked)
                    return;
                this.gpuCharacters = !this.gpuCharacters;
                this.refreshUI();
            }, false, true, 18);
        if (this.characters)
            this.button(this.motionEnabled ? '角色动作：开' : '角色动作：关', 24, 970, 176, 28, '#343f60', () => {
                if (this.inputLocked)
                    return;
                this.motionEnabled = !this.motionEnabled;
                this.refreshUI();
            }, false, true, 18);
        if (this.characters)
            this.button(this.motionEnabled && this.idleEnabled ? '轻呼吸：开' : '轻呼吸：关', 212, 970, 176, 28, '#343f60', () => {
                if (this.inputLocked || !this.motionEnabled)
                    return;
                this.idleEnabled = !this.idleEnabled;
                this.refreshUI();
            }, false, true, 18);
        if (this.characters) {
            const blinkSupported = (this.species === 'mixed' ? speciesList : [this.species]).some(hasBlink);
            this.button(!blinkSupported ? '眨眼：无' : this.motionEnabled && this.blinkEnabled ? '眨眼：开' : '眨眼：关', 400, 970, 176, 28, '#343f60', () => {
                if (this.inputLocked || !this.motionEnabled || !blinkSupported) return;
                this.blinkEnabled = !this.blinkEnabled;
                this.refreshUI();
            }, false, true, 18);
        }
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
                    if (hasBlink(species) && character.motion)
                        this.blinkCandidates.push(character.motion);
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
            if (this.inputLocked)
                return;
            this.rules.undo();
            this.refreshUI();
        });
        this.button('重来', 320, 903, 230, 56, '#343f60', () => this.restart());
        if (this.idleWorkPending)
            Laya.timer.frameLoop(1, this, this.tickAnimation);
    }
}
