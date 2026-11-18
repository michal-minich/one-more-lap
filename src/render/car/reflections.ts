import { FresnelParameters } from "@babylonjs/core/Materials/fresnelParameters.js";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Biome } from "../../game/course/tracks.ts";
import { seededRandom } from "../../game/random.ts";

export function reflectionSky(scene: Scene, biome: Biome): DynamicTexture {
    const texture = new DynamicTexture("soft sky reflections", { width: 512, height: 256 }, scene, true);
    const context = texture.getContext();
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    const sky = biome === "sky";
    gradient.addColorStop(0, sky ? "#282555" : "#163a70");
    gradient.addColorStop(0.32, sky ? "#6596ce" : "#5ba9e0");
    gradient.addColorStop(0.47, biome === "mars" ? "#f4c193" : sky ? "#f8d8e8" : "#d8eef8");
    gradient.addColorStop(0.52, sky ? "#9d84bc" : "#93aab4");
    gradient.addColorStop(0.62, biome === "arctic" ? "#687f94" : sky ? "#4d4f76" : "#37444e");
    gradient.addColorStop(1, sky ? "#575c80" : "#101923");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 256);
    const random = seededRandom(7106);
    for (let i = 0; i < 18; i++) {
        const x = random() * 512;
        const y = 42 + random() * 68;
        const width = 12 + random() * 40;
        const cloud = context.createRadialGradient(0, 0, 0, 0, 0, 1);
        cloud.addColorStop(0, "rgba(240,249,255,.56)");
        cloud.addColorStop(1, "rgba(240,249,255,0)");
        for (const offset of [-512, 0, 512]) {
            context.save();
            context.translate(x + offset, y);
            context.scale(width, width * 0.16);
            context.fillStyle = cloud;
            context.fillRect(-1, -1, 2, 2);
            context.restore();
        }
    }
    texture.update(true);
    texture.coordinatesMode = Texture.EQUIRECTANGULAR_MODE;
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.CLAMP_ADDRESSMODE;
    return texture;
}

export function reflect(material: StandardMaterial, texture: Texture, grazing: number, headOn: number): void {
    material.reflectionTexture = texture;
    const fresnel = new FresnelParameters();
    fresnel.leftColor.set(grazing, grazing, grazing);
    fresnel.rightColor.set(headOn, headOn, headOn);
    fresnel.power = 2.2;
    fresnel.bias = 0.02;
    material.reflectionFresnelParameters = fresnel;
}

export function tintedGlass(scene: Scene): DynamicTexture {
    const texture = new DynamicTexture("glass tint and soft highlights", 128, scene, true);
    const context = texture.getContext();
    const gradient = context.createLinearGradient(0, 126, 84, 0);
    gradient.addColorStop(0, "#6a8caa");
    gradient.addColorStop(0.53, "#c0daea");
    gradient.addColorStop(0.71, "#f2f8ff");
    gradient.addColorStop(1, "#a5c5e0");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    texture.update(true);
    texture.wrapU = texture.wrapV = Texture.CLAMP_ADDRESSMODE;
    return texture;
}
