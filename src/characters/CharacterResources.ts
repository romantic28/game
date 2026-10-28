import { CharacterMotion } from './CharacterMotion';
import { characterDefinitions, characterColors, CharacterDefinition, Species, speciesList, poseBodyParts } from './CharacterDefinitions';
export { Species, speciesList } from './CharacterDefinitions';
export const characterRoots = speciesList.reduce((roots, id) => { roots[id] = 'characters/' + characterDefinitions[id].directory + '/'; return roots; }, {} as Record<Species, string>);
export function poseBodyFile(species: Species, color: string, pose: boolean | string) {
    const definition: CharacterDefinition = characterDefinitions[species];
    const part = typeof pose === 'string' ? pose : pose && definition.poses ? definition.poses.raisedBody : 'body';
    return color + '-' + part + '.png';
}
export function hasBodyPoses(species: Species) {
    const definition: CharacterDefinition = characterDefinitions[species];
    return !!definition.poses;
}
export function hasBlink(species: Species) {
    const definition: CharacterDefinition = characterDefinitions[species];
    return !!definition.blink;
}
export function visibleFixedParts(species: Species) {
    return characterDefinitions[species].fixed;
}
export function mountCharacterExpressions(species: Species, size: number, motion: CharacterMotion) {
    const definition: CharacterDefinition = characterDefinitions[species];
    const createFace = (files: string[], name: string) => {
        const face = new Laya.Sprite();
        face.name = name + '-face';
        face.size(size, size);
        face.mouseEnabled = false;
        for (const file of files)
            face.graphics.drawTexture(Laya.loader.getRes(characterRoots[species] + file) as Laya.Texture, 0, 0, size, size);
        motion.actor.addChild(face);
        return face;
    };
    motion.attachExpressions(createFace(definition.expressions.calm, 'calm'), createFace(definition.expressions.happy, 'happy'),
        definition.blink ? createFace(definition.blink.files, 'blink') : undefined);
}
export function characterFiles(species: Species) {
    const definition: CharacterDefinition = characterDefinitions[species];
    return [...new Set([
        ...definition.layers.filter(layer => layer.kind === 'color').reduce((files, layer) =>
            files.concat('gpu-' + layer.id + '-atlas.png', ...characterColors.map(color => color + '-' + layer.id + '.png')), [] as string[]),
        'shadow.png', ...definition.fixed.map(name => name + '.png'),
        ...definition.expressions.calm, ...definition.expressions.happy,
        ...(definition.blink?.files || []),
        ...poseBodyParts(definition).reduce((files, part) => files.concat(characterColors.map(color => poseBodyFile(species, color, part))), [] as string[])
    ])];
}
export function staticArtReady(species: readonly Species[] = speciesList) {
    return species.every(id => characterFiles(id).every(file => !!Laya.loader.getRes(characterRoots[id] + file)));
}
// Callers may request only their level's species. The inspection screen still uses all.
export async function loadStaticArt(species: readonly Species[] = speciesList) {
    try {
        await Laya.loader.load([...new Set(species)].reduce((files, id) => files.concat(characterFiles(id).map(file => characterRoots[id] + file)), [] as string[]));
        if (!staticArtReady(species))
            throw new Error('Missing character textures after loading');
        return true;
    }
    catch (error) {
        console.warn('角色资源未就绪，保留纯格子入口。', error);
        return false;
    }
}
