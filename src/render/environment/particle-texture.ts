import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import type { Scene } from "@babylonjs/core/scene.js";

export function particleFalloff(scene: Scene): DynamicTexture {
    const texture = new DynamicTexture("particle falloff", 32, scene, true);
    const ctx = texture.getContext();
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 15.8);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,255,255,.75)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    texture.update();
    return texture;
}
