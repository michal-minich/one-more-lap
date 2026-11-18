import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import basaltNormal from "./materials/basalt-normal.jpg?inline";

export function addBasaltRelief(scene: Scene, stone: StandardMaterial, strength: number): void {
    const texture = new Texture(basaltNormal, scene);
    texture.gammaSpace = false;
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    texture.anisotropicFilteringLevel = 8;
    texture.level = strength;
    stone.bumpTexture = texture;
}
