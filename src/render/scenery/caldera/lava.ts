import type { Scene } from "@babylonjs/core/scene.js";
import type { Surface } from "../../../game/course/surface.ts";
import type { CalderaRunoff } from "../../../game/course/caldera-runoff.ts";
import { channelPoint } from "../../../game/course/water.ts";
import type { WaterBody } from "../../../game/course/water.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { lavaTexture } from "./lava-texture.ts";
import { drawRunoff } from "./runoff.ts";

export function drawLava(scene: Scene, body: WaterBody, runoff: CalderaRunoff): (seconds: number) => void {
    const texture = lavaTexture(scene);
    const paint = material(scene, "moving lava and broken crust", "#ffffff");
    paint.disableLighting = true;
    paint.linkEmissiveWithDiffuse = true;
    paint.emissiveColor.set(1, 1, 1);
    paint.diffuseTexture = texture;
    paint.backFaceCulling = false;
    surface(scene, "lava channel", lavaSurface(body), paint).receiveShadows = false;
    drawRunoff(scene, runoff, texture);
    return seconds => { texture.uOffset = -seconds * 0.13 % 1; };
}

function lavaSurface(body: WaterBody): Surface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const width = 13;
    const length = 112;
    for (let row = 0; row <= length; row++) {
        const t = row / length;
        const along = -1 + 2 * t;
        const taper = Math.sqrt(1 - along ** 2) * (0.96 + Math.sin(t * 24) * 0.04);
        for (let column = 0; column < width; column++) {
            const across = (column / (width - 1) * 2 - 1) * taper;
            const point = channelPoint(body, along, across);
            positions.push(point.x, point.y + 0.034, point.z);
            uv.push(t * 13 + across * 0.16, across * 0.69 + Math.sin(t * 19) * 0.096);
            if (row && column) {
                const i = row * width + column;
                indices.push(i - width - 1, i - width, i - 1, i - width, i, i - 1);
            }
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}
