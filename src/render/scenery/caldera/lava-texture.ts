import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Scene } from "@babylonjs/core/scene.js";
import moltenFlow from "../materials/molten-flow.jpg?inline";

export function lavaTexture(scene: Scene): Texture {
    const texture = new Texture(moltenFlow, scene);
    texture.name = "molten flow";
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    texture.anisotropicFilteringLevel = 8;
    return texture;
}
