import { CharacterMotion } from './CharacterMotion';
import { Color } from '../gameplay/types';
export type Species = 'horn' | 'cyclops' | 'rabbit';
export const speciesList: Species[] = ['horn', 'cyclops', 'rabbit'];
export const characterRoots: Record<Species, string> = { horn: 'characters/horn-restart-v2/', cyclops: 'characters/cyclops-v2/', rabbit: 'characters/rabbit-v2/' };
export const characterFixed: Record<Species, string[]> = {
    horn: ['horn-left', 'horn-right', 'cheek-left', 'cheek-right', 'eye-left', 'eye-right', 'mouth'],
    cyclops: ['eye', 'mouth', 'cheek-left', 'cheek-right'],
    rabbit: ['eye-left', 'eye-right', 'mouth', 'cheek-left', 'cheek-right']
};
const happyFeatures = ['eye-left', 'eye-right', 'mouth'];
export function visibleFixedParts(species: Species) {
    if (species === 'horn')
        return characterFixed[species].filter(name => !happyFeatures.includes(name));
    if (species === 'cyclops')
        return characterFixed[species].filter(name => name !== 'eye');
    return characterFixed[species].filter(name => name !== 'eye-left' && name !== 'eye-right');
}
export function mountCharacterExpressions(species: Species, size: number, motion: CharacterMotion) {
    const calm = new Laya.Sprite(), happy = new Laya.Sprite();
    calm.name = 'calm-face';
    happy.name = 'happy-face';
    for (const face of [calm, happy]) {
        face.size(size, size);
        face.mouseEnabled = false;
    }
    const root = characterRoots[species];
    calm.graphics.drawTexture(Laya.loader.getRes(root + (species === 'horn' ? 'calm-face.png' : species === 'cyclops' ? 'eye.png' : 'calm-eyes.png')) as Laya.Texture, 0, 0, size, size);
    const happyFiles = species === 'horn' ? happyFeatures.map(name => name + '.png') : species === 'cyclops' ? ['happy-eye.png'] : ['eye-left.png', 'eye-right.png'];
    for (const file of happyFiles)
        happy.graphics.drawTexture(Laya.loader.getRes(root + file) as Laya.Texture, 0, 0, size, size);
    motion.actor.addChild(calm);
    motion.actor.addChild(happy);
    motion.attachExpressions(calm, happy);
}
function files(species: Species) {
    return ['gpu-tile-atlas.png', 'gpu-body-atlas.png', 'shadow.png', ...(species === 'horn' ? ['calm-face.png'] : species === 'cyclops' ? ['happy-eye.png'] : ['calm-eyes.png']), ...characterFixed[species].map(name => `${name}.png`), ...(['R', 'Y', 'B', 'G'] as Color[]).reduce((all, color) => all.concat(`${color}-body.png`, `${color}-tile.png`), [] as string[])];
}
export function staticArtReady() {
    return speciesList.every(species => files(species).every(file => !!Laya.loader.getRes(characterRoots[species] + file)));
}
export async function loadStaticArt() {
    try {
        await Laya.loader.load(speciesList.reduce((all, species) => all.concat(files(species).map(file => characterRoots[species] + file)), [] as string[]));
        if (!staticArtReady())
            throw new Error('Missing character textures after loading');
        return true;
    }
    catch (error) {
        console.warn('角色资源未就绪，保留纯格子入口。', error);
        return false;
    }
}
