import { Material } from "@babylonjs/core/Materials/material.js";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { seededRandom } from "../../game/random.ts";
import { material } from "../materials.ts";

export function skyPaint(scene: Scene, name: string, texture: DynamicTexture): StandardMaterial {
    const paint = material(scene, name, "#ffffff");
    paint.diffuseTexture = texture;
    paint.useAlphaFromDiffuseTexture = true;
    paint.transparencyMode = Material.MATERIAL_ALPHABLEND;
    paint.disableDepthWrite = true;
    paint.disableLighting = true;
    paint.linkEmissiveWithDiffuse = true;
    paint.emissiveColor.set(1, 1, 1);
    paint.backFaceCulling = false;
    paint.fogEnabled = false;
    paint.specularColor.set(0, 0, 0);
    return paint;
}

export function glowTexture(scene: Scene, sun: boolean): DynamicTexture {
    const size = 128;
    const texture = new DynamicTexture(sun ? "soft sun halo" : "starlight", size, scene, true);
    const context = texture.getContext();
    const glow = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    glow.addColorStop(0, "rgba(255,250,228,1)");
    if (sun) {
        glow.addColorStop(0.17, "rgba(255,247,212,1)");
        glow.addColorStop(0.19, "rgba(255,238,180,.96)");
        glow.addColorStop(0.29, "rgba(255,201,132,.36)");
        glow.addColorStop(0.61, "rgba(255,164,113,.09)");
    } else {
        glow.addColorStop(0.19, "rgba(231,244,255,.96)");
        glow.addColorStop(0.55, "rgba(203,219,255,.26)");
    }
    glow.addColorStop(1, "rgba(255,222,173,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, size, size);
    texture.hasAlpha = true;
    texture.update(true);
    return texture;
}

export function moonTexture(scene: Scene): DynamicTexture {
    const texture = new DynamicTexture("moon with craters", 128, scene, true);
    const context = texture.getContext() as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    const light = context.createRadialGradient(55, 45, 1, 64, 64, 59);
    light.addColorStop(0, "#fff1cf");
    light.addColorStop(0.77, "#e9d7b7");
    light.addColorStop(1, "#9d9cb6");
    context.beginPath();
    context.arc(64, 64, 55, 0, Math.PI * 2);
    context.fillStyle = light;
    context.fill();
    context.save();
    context.clip();
    const random = seededRandom(927);
    for (let i = 0; i < 29; i++) {
        const x = 12 + random() * 107;
        const y = 12 + random() * 105;
        const radius = 3.5 + random() * 10.3;
        const crater = context.createRadialGradient(x + radius * 0.21, y + radius * 0.23, 0, x, y, radius);
        crater.addColorStop(0, "rgba(106,106,139,.31)");
        crater.addColorStop(0.76, "rgba(125,112,125,.11)");
        crater.addColorStop(1, "rgba(125,112,125,0)");
        context.fillStyle = crater;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    context.restore();
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.ellipse(27, 42, 42, 58, 0.3, 0, Math.PI * 2);
    context.fillStyle = "#000";
    context.fill();
    texture.hasAlpha = true;
    texture.update(true);
    return texture;
}
