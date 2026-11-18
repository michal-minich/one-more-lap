import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { seededRandom } from "../../game/random.ts";
import { cloudNoise, smoothEdge } from "./cloud-density.ts";

export type CloudForm = "cumulus" | "cirrus" | "stratus" | "tower" | "bank";

interface CloudShape {
    readonly lobes: number;
    readonly width: number;
    readonly height: number;
    readonly crest: number;
    readonly feather: number;
    readonly opacity: number;
}

const shapes: Readonly<Record<CloudForm, CloudShape>> = {
    cumulus: { lobes: 12, width: 0.17, height: 0.30, crest: 0.17, feather: 0.60, opacity: 0.89 },
    cirrus: { lobes: 8, width: 0.23, height: 0.12, crest: 0.05, feather: 0.54, opacity: 0.56 },
    stratus: { lobes: 10, width: 0.23, height: 0.18, crest: 0.03, feather: 0.68, opacity: 0.72 },
    tower: { lobes: 14, width: 0.15, height: 0.30, crest: 0.23, feather: 0.54, opacity: 0.94 },
    bank: { lobes: 12, width: 0.20, height: 0.34, crest: 0.09, feather: 0.64, opacity: 0.81 },
};

const width = 512;
const height = 256;
const masks = new Map<string, ImageData>();

export function cloudMask(scene: Scene, seed: number, form: CloudForm = "cumulus"): DynamicTexture {
    const key = form + "-" + seed;
    let pixels = masks.get(key);
    if (!pixels) {
        pixels = paintCloud(seed, form);
        masks.set(key, pixels);
    }
    const texture = new DynamicTexture("procedural " + form, { width, height }, scene, true);
    texture.getContext().putImageData(pixels, 0, 0);
    texture.hasAlpha = true;
    texture.update(true);
    return texture;
}

function paintCloud(seed: number, form: CloudForm): ImageData {
    const random = seededRandom(seed);
    const shape = shapes[form];
    const broad = cloudNoise(seed + 691, 8, 5);
    const fine = cloudNoise(seed + 4759, 29, 17);
    const fibres = cloudNoise(seed + 179, 8, 27);
    const peak = 0.31 + random() * 0.35;
    const lobes = Array.from({ length: shape.lobes }, (_, i) => {
        const along = i / (shape.lobes - 1);
        return {
            u: 0.22 + along * 0.56 + (random() - 0.5) * 0.11,
            v: 0.54 - Math.exp(-((along - peak) ** 2) / 0.093) * shape.crest + random() * 0.115,
            rx: 1 / (shape.width * (0.64 + random() * 0.55)),
            ry: 1 / (shape.height * (0.48 + random() * 0.62)),
        };
    });
    const pixels = new ImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const u = (x + 0.5) / width;
            const v = (y + 0.5) / height;
            const billow = broad(u, v);
            const curl = fine(u, v);
            const w = v + billow * 0.064 + curl * 0.013;
            let density = 0;
            for (const lobe of lobes) {
                const dx = (u - lobe.u) * lobe.rx;
                const dy = (w - lobe.v) * lobe.ry;
                const inner = Math.max(0, 1 - dx * dx - dy * dy);
                density += inner * inner;
            }
            const strands = form === "cirrus" ? fibres(u, v + u * 0.17) * 0.24 : 0;
            const foundation = form === "tower" ? 0.28 * (1 - smoothEdge(0.19, 0.47, Math.hypot((u - 0.5) * 0.85, (w - 0.57) * 1.5))) : 0;
            const vapor = (density + foundation) * (1 + billow * 0.25 + strands) + curl * 0.07;
            const margin = smoothEdge(0.014, 0.13, Math.min(u, v, 1 - u, 1 - v));
            const alpha = smoothEdge(0.055, shape.feather, vapor) * margin * shape.opacity;
            const light = 253 - smoothEdge(0.32, 0.94, v) * 51 + billow * 9 + curl * 4;
            const index = (y * width + x) * 4;
            pixels.data[index] = light;
            pixels.data[index + 1] = light + 1;
            pixels.data[index + 2] = light + 5;
            pixels.data[index + 3] = alpha * 255;
        }
    }
    return pixels;
}
