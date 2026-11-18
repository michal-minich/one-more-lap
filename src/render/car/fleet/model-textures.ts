import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Scene } from "@babylonjs/core/scene.js";
import enamel from "./materials/enamel.jpg?inline";
import alloy from "./materials/alloy.jpg?inline";
import rubber from "./materials/rubber.jpg?inline";
import ceramic from "./materials/ceramic.jpg?inline";

const sources = { enamel, alloy, rubber, ceramic };
const cache = new WeakMap<Scene, Map<keyof typeof sources, Texture>>();

export function fleetTexture(scene: Scene, finish: keyof typeof sources): Texture {
    let palette = cache.get(scene);
    if (!palette) {
        palette = new Map();
        cache.set(scene, palette);
    }
    let tile = palette.get(finish);
    if (!tile) {
        tile = new Texture(sources[finish], scene);
        tile.name = "ImageGen " + finish;
        tile.anisotropicFilteringLevel = 4;
        palette.set(finish, tile);
    }
    return tile;
}
