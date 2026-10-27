import { WaveCell } from '../effects/Wave';
import { CharacterMotion } from './CharacterMotion';
import { Color } from '../gameplay/types';
import { Species, characterRoots, visibleFixedParts, mountCharacterExpressions } from './CharacterResources';
const shaderName = 'MonsterPartyGpuDye';
const vs = `
#define SHADER_NAME MonsterPartyGpuDyeVS
#include "Sprite2DVertex.glsl";
void main(){
 vec4 pos;getPosition(pos);
 vertexInfo info;getVertexInfo(info);
 v_cliped=info.cliped;v_texcoordAlpha=info.texcoordAlpha;
 v_useTex=info.useTex;v_color=info.color;gl_Position=pos;
}`;
// Laya 3.2.9 injects SubShader uniformMap declarations into GLSL headers.
// Declare custom uniforms only in uniformMap below, never again in this body.
const fs = `
#define SHADER_NAME MonsterPartyGpuDyeFS
precision mediump float;
#include "Sprite2DFrag.glsl";
void main(){
 clip();
 vec2 uv=clamp(v_texcoordAlpha.xy,0.0,1.0);
 // Same spatial threshold fields as the baked reference map, evaluated on GPU.
 // Avoid the failing imported-threshold sampler path; local UV was confirmed visually.
 float threshold=uv.x-.025*sin(uv.y*7.0+1.13)-.012*sin(uv.y*17.0-1.13);
 if(u_DyeMode>1.5){
  vec2 delta=uv-vec2(.5);
  float angle=0.0;
  if(dot(delta,delta)>0.000001)angle=atan(delta.y,delta.x);
  threshold=length(delta)/.70710678/(1.0+.045*sin(angle*3.0)+.025*sin(angle*7.0));
 }else if(u_DyeMode>0.5){
  threshold=(uv.x+uv.y)*.5-.018*sin((uv.x-uv.y)*12.0);
 }
 if(u_DyeDirection.z>.5&&u_DyeMode<1.5){
  vec2 normal=u_DyeDirection.xy;
  float extent=abs(normal.x)+abs(normal.y);
  float cross=dot(uv-vec2(.5),vec2(-normal.y,normal.x));
  threshold=dot(uv-vec2(.5),normal)/extent+.5-.025*sin(cross*7.0+1.13)-.012*sin(cross*17.0-1.13);
 }
 threshold=clamp(threshold,0.0,1.0);
 float useTarget=step(threshold,u_DyeProgress);
 if(u_DyeProgress<=0.0)useTarget=0.0;
 if(u_DyeProgress>=1.0)useTarget=1.0;
 vec4 before=transspaceColor(texture2D(u_spriteTexture,u_DyeSourceUV.xy+uv*u_DyeSourceUV.zw));
 vec4 after=transspaceColor(texture2D(u_spriteTexture,u_DyeTargetUV.xy+uv*u_DyeTargetUV.zw));
 // PNG sampling follows Laya's built-in premultiplied texture/color path.
 setglColor(mix(before,after,useTarget));
}`;
let registered = false;
function register() {
    if (registered)
        return;
    const shader = Laya.Shader3D.add(shaderName, false, false);
    shader.shaderType = Laya.ShaderFeatureType.D2;
    const types = Laya.ShaderDataType;
    const sub = new Laya.SubShader({ a_posuv: [0, types.Vector4], a_attribColor: [1, types.Vector4], a_attribFlags: [2, types.Vector4] }, { u_DyeDirection: types.Vector4, u_DyeSourceUV: types.Vector4, u_DyeTargetUV: types.Vector4, u_DyeProgress: types.Float, u_DyeMode: types.Float }, {});
    shader.addSubShader(sub);
    sub.addShaderPass(vs, fs);
    registered = true;
}
function atlasRect(texture: Laya.Texture, color: Color) {
    const uv = texture.uv, index = (['R', 'Y', 'B', 'G'] as Color[]).indexOf(color);
    if (texture.width !== 1024 || texture.height !== 256 || texture.offsetX || texture.offsetY)
        throw new Error('GPU染色图集需要完整1024×256画布');
    if (uv[0] !== uv[6] || uv[1] !== uv[3] || uv[2] !== uv[4] || uv[5] !== uv[7])
        throw new Error('GPU染色图集不支持旋转UV');
    // Half-texel inset prevents sampling a neighboring color at the cell border.
    const dx = uv[2] - uv[0], dy = uv[7] - uv[1];
    return new Laya.Vector4(uv[0] + dx * (index * 256 + .5) / 1024, uv[1] + dy * .5 / 256, dx * 255 / 1024, dy * 255 / 256);
}
export class CharacterGpuTile extends Laya.Sprite {
    readonly motion: CharacterMotion | null;
    private materials: Laya.Material[] = [];
    private mode = -1;
    private colorLayers: {
        part: string;
        layer: Laya.Sprite;
        material: Laya.Material;
    }[] = [];
    private currentColor: Color;
    private targetColor: Color;
    private vertices: Float32Array;
    private readonly uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    private readonly indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    constructor(private species: Species, from: Color, to: Color, size: number) {
        super();
        this.name = species + '-gpu-tile';
        this.size(size, size);
        this.mouseEnabled = false;
        register();
        this.currentColor = from;
        this.targetColor = to;
        this.vertices = new Float32Array([0, 0, size, 0, size, size, 0, size]);
        this.motion = new CharacterMotion(size, species);
        const root = characterRoots[species];
        for (const part of ['tile', 'shadow', 'body', 'fixed']) {
            const layer = new Laya.Sprite();
            layer.size(size, size);
            layer.mouseEnabled = false;
            const files = part === 'fixed' ? visibleFixedParts(species).map(name => name + '.png') : [part === 'shadow' ? 'shadow.png' : from + '-' + part + '.png'];
            for (const file of files) {
                const texture = Laya.loader.getRes(root + file) as Laya.Texture;
                if (!texture)
                    throw new Error('Missing GPU character texture: ' + root + file);
                if (part !== 'tile' && part !== 'body')
                    layer.graphics.drawTexture(texture, 0, 0, size, size);
                if (part === 'tile' || part === 'body') {
                    const atlas = Laya.loader.getRes(root + 'gpu-' + part + '-atlas.png') as Laya.Texture;
                    if (!atlas)
                        throw new Error('Missing GPU color atlas');
                    const material = new Laya.Material();
                    material.setShaderName(shaderName);
                    material.setVector4('u_DyeSourceUV', atlasRect(atlas, from));
                    material.setVector4('u_DyeTargetUV', atlasRect(atlas, to));
                    material.setVector4('u_DyeDirection', new Laya.Vector4(1, 0, 0, 0));
                    material.setFloat('u_DyeProgress', 0);
                    material.setFloat('u_DyeMode', 0);
                    this.materials.push(material);
                    this.colorLayers.push({ part, layer, material });
                    layer.material = material;
                    // Explicit local UVs belong to the full cell, independent of image/atlas UVs.
                    layer.graphics.drawTriangles(atlas, 0, 0, this.vertices, this.uvs, this.indices);
                }
            }
            if (this.motion && (part === 'body' || part === 'fixed'))
                this.motion.actor.addChild(layer);
            else
                this.addChild(layer);
            if (part === 'shadow')
                this.motion?.attachShadow(layer);
        }
        mountCharacterExpressions(species, size, this.motion);
        if (this.motion)
            this.addChild(this.motion.actor);
    }
    beginTransition(target: Color, cell: WaveCell) {
        this.targetColor = target;
        const center = cell.direction === 'center', length = Math.hypot(cell.dx, cell.dy) || 1;
        this.mode = center ? 2 : 0;
        for (const { part, layer, material } of this.colorLayers) {
            const atlas = Laya.loader.getRes(characterRoots[this.species] + 'gpu-' + part + '-atlas.png') as Laya.Texture;
            if (!atlas)
                throw new Error('Missing GPU color atlas: ' + part);
            material.setVector4('u_DyeSourceUV', atlasRect(atlas, this.currentColor));
            material.setVector4('u_DyeTargetUV', atlasRect(atlas, target));
            material.setVector4('u_DyeDirection', new Laya.Vector4(cell.dx / length, cell.dy / length, 1, 0));
            material.setFloat('u_DyeMode', this.mode);
            material.setFloat('u_DyeProgress', 0);
            layer.graphics.clear();
            layer.material = material;
            layer.graphics.drawTriangles(atlas, 0, 0, this.vertices, this.uvs, this.indices);
        }
    }
    setTransitionProgress(progress: number) {
        for (const material of this.materials)
            material.setFloat('u_DyeProgress', Math.max(0, Math.min(1, progress)));
    }
    finishTransition() {
        this.currentColor = this.targetColor;
        for (const { part, layer } of this.colorLayers) {
            const texture = Laya.loader.getRes(characterRoots[this.species] + this.currentColor + '-' + part + '.png') as Laya.Texture;
            layer.material = null;
            layer.graphics.clear();
            layer.graphics.drawTexture(texture, 0, 0, this.width, this.height);
        }
    }
    destroy(destroyChild = true) {
        super.destroy(destroyChild);
        for (const material of this.materials)
            material.destroy();
        this.materials = [];
    }
}
