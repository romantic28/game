import { characterDefinitions } from './CharacterDefinitions';
import { paintFront } from '../effects/PaintFront';
import { CharacterMotion } from './CharacterMotion';
import { WaveCell } from '../effects/Wave';
import { Color } from '../gameplay/types';
import { Species, characterRoots, visibleFixedParts, mountCharacterExpressions, poseBodyFile, hasBodyPoses } from './CharacterResources';
export class CharacterStaticTile extends Laya.Sprite {
    readonly motion: CharacterMotion | null;
    private transitionPairs: {
        old: Laya.Sprite;
        next: Laya.Sprite;
        oldMask: Laya.Sprite;
        nextMask: Laya.Sprite;
    }[] = [];
    private static maskTexture: Laya.Texture;
    private ring: {
        vertices: Float32Array;
        uvs: Float32Array;
        indices: Uint16Array;
    } | null = null;
    private colorParts: {
        part: string;
        layer: Laya.Sprite;
    }[] = [];
    private targetColor: Color | null = null;
    private currentColor: Color;
    constructor(private species: Species, color: Color, size: number, target?: Color) {
        super();
        this.name = `${species}-static-tile`;
        this.size(size, size);
        this.mouseEnabled = false;
        this.currentColor = color;
        this.motion = new CharacterMotion(size, species);
        for (const layer of characterDefinitions[species].layers) {
            if (layer.kind === 'color')
                this.colorLayers(species, layer.id, color, size);
            else
                this.layer(species, layer.id, layer.kind === 'fixed' ? visibleFixedParts(species).map(name => name + '.png') : ['shadow.png'], size);
        }
        mountCharacterExpressions(species, size, this.motion);
        if (hasBodyPoses(species))
            this.motion.attachPose(body => this.drawBodyPose(body));
        if (this.motion)
            this.addChild(this.motion.actor);
        if (target)
            this.beginTransition(target);
    }
    private colorLayers(species: Species, part: string, color: Color, size: number) {
        const layer = this.layer(species, part, [color + '-' + part + '.png'], size);
        this.colorParts.push({ part, layer });
    }
    beginTransition(target: Color) {
        this.motion.stopIdle();
        this.motion.stopBlink();
        this.motion.restoreRestingBody();
        this.finishTransition();
        this.targetColor = target;
        for (const { part, layer: old } of this.colorParts) {
            const next = this.layer(this.species, part + '-target', [target + '-' + part + '.png'], this.width);
            old.parent.addChildAt(next, old.parent.getChildIndex(old) + 1);
            const oldMask = new Laya.Sprite(), nextMask = new Laya.Sprite();
            oldMask.size(this.width, this.height);
            nextMask.size(this.width, this.height);
            old.mask = oldMask;
            next.mask = nextMask;
            this.transitionPairs.push({ old, next, oldMask, nextMask });
        }
        this.setTransitionProgress(0, { r: 0, c: 0, dx: 0, dy: 0, distance: 0, start: 0, duration: 1, direction: 'center' });
    }
    // Tile and body share the same local coordinates, wave direction and progress.
    setTransitionProgress(value: number, cell: WaveCell) {
        const p = Math.max(0, Math.min(1, value)), w = this.width, h = this.height;
        const front = paintFront(w, h, p, cell);
        // Build shared complement geometry once per frame, not once per color layer.
        let remaining: number[] = [];
        if (p > 0 && p < 1) {
            if (cell.direction === 'center') {
                const count = front.edge.length / 2 - 1, radius = Math.hypot(w, h) * 2;
                if (!this.ring) {
                    const vertices = new Float32Array((count + 1) * 4), uvs = new Float32Array((count + 1) * 4), indices = new Uint16Array(count * 6);
                    uvs.fill(.5);
                    for (let i = 0; i <= count; i++) {
                        const angle = i / count * Math.PI * 2;
                        vertices[i * 4 + 2] = w / 2 + Math.cos(angle) * radius;
                        vertices[i * 4 + 3] = h / 2 + Math.sin(angle) * radius;
                        if (i < count)
                            indices.set([i * 2, i * 2 + 2, i * 2 + 3, i * 2, i * 2 + 3, i * 2 + 1], i * 6);
                    }
                    this.ring = { vertices, uvs, indices };
                }
                for (let i = 0; i <= count; i++) {
                    this.ring.vertices[i * 4] = front.edge[i * 2];
                    this.ring.vertices[i * 4 + 1] = front.edge[i * 2 + 1];
                }
                if (!CharacterStaticTile.maskTexture)
                    CharacterStaticTile.maskTexture = Laya.Texture.create(Laya.Texture2D.whiteTexture, 0, 0, 1, 1);
            }
            else {
                const length = Math.hypot(cell.dx, cell.dy), nx = cell.dx / length, ny = cell.dy / length, far = Math.hypot(w, h) * 4;
                const edge = front.edge, last = edge.length - 2;
                remaining = [...edge, edge[last] + nx * far, edge[last + 1] + ny * far, edge[0] + nx * far, edge[1] + ny * far];
            }
        }
        for (const pair of this.transitionPairs) {
            pair.old.visible = p < 1;
            pair.next.visible = p > 0;
            const old = pair.oldMask.graphics, next = pair.nextMask.graphics;
            old.clear();
            next.clear();
            if (p <= 0)
                old.drawRect(0, 0, w, h, '#fff');
            else if (p >= 1)
                next.drawRect(0, 0, w, h, '#fff');
            else {
                next.drawPoly(0, 0, front.fill, '#fff');
                if (cell.direction === 'center') {
                    const ring = this.ring!;
                    old.drawTriangles(CharacterStaticTile.maskTexture, 0, 0, ring.vertices, ring.uvs, ring.indices);
                }
                else
                    old.drawPoly(0, 0, remaining, '#fff');
            }
        }
    }
    finishTransition() {
        if (!this.targetColor)
            return;
        for (const { part, layer } of this.colorParts) {
            layer.graphics.clear();
            layer.graphics.drawTexture(Laya.loader.getRes(characterRoots[this.species] + this.targetColor + '-' + part + '.png') as Laya.Texture, 0, 0, this.width, this.height);
            layer.visible = true;
        }
        this.currentColor = this.targetColor;
        this.clearTransition();
        this.targetColor = null;
    }
    private drawBodyPose(bodyPart: string) {
        const body = this.colorParts.find(entry => entry.part === 'body');
        if (!body) return;
        const file = poseBodyFile(this.species, this.currentColor, bodyPart);
        const texture = Laya.loader.getRes(characterRoots[this.species] + file) as Laya.Texture;
        if (!texture) throw new Error('Missing character pose: ' + file);
        body.layer.graphics.clear();
        body.layer.graphics.drawTexture(texture, 0, 0, this.width, this.height);
    }
    private clearTransition() {
        for (const pair of this.transitionPairs) {
            pair.old.mask = null;
            pair.next.mask = null;
            pair.oldMask.destroy(true);
            pair.nextMask.destroy(true);
            pair.next.destroy(true);
        }
        this.transitionPairs = [];
    }
    destroy(destroyChild = true) {
        this.clearTransition();
        super.destroy(destroyChild);
    }
    private layer(species: Species, name: string, files: string[], size: number) {
        const layer = new Laya.Sprite();
        layer.name = `${species}-${name}`;
        layer.size(size, size);
        layer.mouseEnabled = false;
        // All parts share their baked canvas origin; never recenter individual features.
        for (const file of files) {
            const texture = Laya.loader.getRes(characterRoots[species] + file) as Laya.Texture;
            if (!texture)
                throw new Error(`Missing static character resource: ${characterRoots[species] + file}`);
            layer.graphics.drawTexture(texture, 0, 0, size, size);
        }
        if (characterDefinitions[species].layers.find(layer => layer.id === name.replace(/-target$/, ''))?.parent === 'actor')
            this.motion.actor.addChild(layer);
        else
            this.addChild(layer);
        if (name === 'shadow')
            this.motion?.attachShadow(layer);
        if (name === 'fixed')
            this.motion.attachFaceLayer(layer);
        return layer;
    }
}
