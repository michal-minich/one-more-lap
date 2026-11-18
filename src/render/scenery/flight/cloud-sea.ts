import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { seededRandom } from "../../../game/random.ts";
import type { Conditions } from "../../../game/race/conditions.ts";
import { cloudNoise, smoothEdge } from "../../environment/cloud-density.ts";
import { cloudMask } from "../../environment/cloud-mask.ts";
import { skyPaint } from "../../environment/sky-textures.ts";

const cloudDay = Color3.FromHexString("#fff2f2");
const cloudDusk = Color3.FromHexString("#ffc2b3");
const cloudNight = Color3.FromHexString("#525674");
const cloudStorm = Color3.FromHexString("#8992ac");

export function drawCloudSea(scene: Scene): (time: number, conditions: Conditions) => void {
    const base = MeshBuilder.CreateGround("soft cloud sea", { width: 3000, height: 3000 }, scene);
    const basePaint = skyPaint(scene, "cloud sea", cloudSeaTexture(scene));
    base.material = basePaint;
    base.position.y = 1;
    base.alphaIndex = 11;
    base.isPickable = false;
    const layers = Array.from({ length: 4 }, (_, index) =>
        skyPaint(scene, "tinted cloud bank", cloudMask(scene, 6301 + index * 117, index % 2 ? "stratus" : "bank")));
    const duskShadows = Color3.FromHexString("#9482ae");
    const random = seededRandom(637);
    const banks = Array.from({ length: 52 }, (_, index) => {
        const angle = index * 2.39996 + random() * 0.4;
        const distance = 55 + Math.sqrt(index / 51) * 830 + random() * 90;
        const width = 98 + random() * 190;
        const cloud = MeshBuilder.CreatePlane("rolling cloud bank", { width, height: width * (0.28 + random() * 0.15) }, scene);
        cloud.billboardMode = Mesh.BILLBOARDMODE_ALL;
        cloud.alphaIndex = 12;
        cloud.isPickable = false;
        cloud.visibility = 0.64 + random() * 0.33;
        cloud.material = layers[index % layers.length]!;
        const x = Math.sin(angle) * distance;
        const z = Math.cos(angle) * distance;
        const y = 12 + random() * 30;
        return { cloud, x, y, z, phase: random() * 6.3 };
    });
    const tint = new Color3();
    return (time, env) => {
        Color3.LerpToRef(cloudNight, cloudDay, env.daylight, tint);
        Color3.LerpToRef(tint, cloudDusk, env.dusk * env.daylight * 0.74, tint);
        Color3.LerpToRef(tint, cloudStorm, Math.max(env.rain, env.fog * 0.5) * env.daylight * 0.68, tint);
        basePaint.diffuseColor.copyFrom(tint);
        for (const [index, paint] of layers.entries()) {
            Color3.LerpToRef(tint, duskShadows, (index % 2 ? 0.20 : 0.09) * env.dusk, paint.diffuseColor);
        }
        for (const { cloud, x, y, z, phase } of banks) {
            cloud.position.set(x + Math.sin(time * 0.044 + phase) * 18, y + Math.sin(time * 0.027 + phase) * 4,
                z + Math.cos(time * 0.035 + phase) * 16);
        }
    };
}

let seaPixels: ImageData | undefined;

function cloudSeaTexture(scene: Scene): DynamicTexture {
    const size = 512;
    const texture = new DynamicTexture("cloud sea density", { width: size, height: size }, scene, true);
    seaPixels ??= paintCloudSea(size);
    texture.getContext().putImageData(seaPixels, 0, 0);
    texture.hasAlpha = true;
    texture.update(true);
    return texture;
}

function paintCloudSea(size: number): ImageData {
    const pixels = new ImageData(size, size);
    const banks = cloudNoise(627, 9, 9);
    const billows = cloudNoise(901, 29, 29);
    const wisps = cloudNoise(3179, 63, 63);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const u = (x + 0.5) / size;
            const v = (y + 0.5) / size;
            const depth = banks(u, v) * 0.42 + billows(u, v) * 0.16 + wisps(u, v) * 0.047;
            const edge = 1 - smoothEdge(0.23, 0.49, Math.hypot(u - 0.5, v - 0.5));
            const light = 181 + smoothEdge(-0.35, 0.4, depth) * 69;
            const index = (y * size + x) * 4;
            pixels.data[index] = light;
            pixels.data[index + 1] = light + 1;
            pixels.data[index + 2] = light + 3;
            pixels.data[index + 3] = edge * (0.49 + smoothEdge(-0.4, 0.34, depth) * 0.49) * 255;
        }
    }
    return pixels;
}
